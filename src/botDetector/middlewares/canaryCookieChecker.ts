import { getdata } from '../helpers/getIPInformation.js';
import { makeCookie } from '../utils/cookieGenerator.js';
import { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";
import parseUA from '../helpers/UAparser.js';
import { format } from 'date-fns';
import { updateVisitor } from '../db/updateVisitors.js';
import { uaAndGeoBotDetector } from '../../botDetector.js';
import { visitorCache } from '../helpers/cache/cannaryCache.js';
import { userReputaion } from '../helpers/reputation.js';
import { getLogger } from '../utils/logger.js';
import { userValidation } from '../types/fingerPrint.js';
import { getConfiguration } from '../config/config.js';

declare global {
  namespace Express {
    export interface Request {
      newVisitorId?: number;
      botDetection: {
        success: boolean,
        banned: boolean,
        time: string,
        ipAddress: string
      }
    }
  }
}


export const validator = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {checksTimeRateControl} = getConfiguration()
    let canary = req.cookies?.canary_id || null;
    const ua = req.get("User-Agent") || "";
    const ip = req.ip;
     const log = getLogger().child({service: 'BOT DETECTOR', branch: `main`, canary: canary});
     log.info(`Validator entered for ${req.method} ${req.get('X-Forwarded-Host')}`)
     log.info({ cookies: req.cookies },`Incoming cookies`)

    if (canary) {
      const cached = visitorCache.get(canary);
      if (cached) {
        if (cached.banned) {
          res.sendStatus(403);
          return; 
        } 
        req.newVisitorId = cached.visitor_id;
        if (!checksTimeRateControl.checkEveryReqest){ 
        return next();
      }
      }
    }
    
  if (!canary) {
    log.info(`No canary_id cookie found. Generating a new one.`)
    const cookieValue = randomBytes(32).toString('hex');
    canary = cookieValue;
    
    makeCookie(res,'canary_id', cookieValue, {
      httpOnly: true,
      sameSite: "lax", 
      maxAge: 1000 * 60 * 60 * 24 * 90,
      secure: true,
      path: "/", 
    })
    req.cookies = req.cookies || {};
    req.cookies.canary_id = canary;
    log.info(`New canary_id cookie set:, ${cookieValue}`)
  }

  const [geo] = await Promise.all([ getdata(ip!) ]);
  const parsedUA = parseUA(ua);
  
    const now = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const userValidation = {
      cookie: canary,
      userAgent: ua,
      ipAddress: ip || 'unknown',
      country: geo.country  ?? 'unknown',
      region: geo.region ?? 'unknown',
      regionName: geo.regionName ?? 'unknown',
      city: geo.city ?? 'unknown',
      district: geo.district ?? 'unknown',
      lat: geo.lat != null ? String(geo.lat) : 'unknown',
      lon: geo.lon != null ? String(geo.lon) : 'unknown',
      timezone: geo.timezone ?? 'unknown',
      currency: geo.currency ?? 'unknown',
      isp: geo.isp ?? 'unknown',
      org: geo.org ?? 'unknown',
      as: geo.as_org ?? 'unknown',
      device_type: parsedUA.device,
      browser: parsedUA.browser,
      proxy: geo.proxy ?? false,
      hosting: geo.hosting ?? false,
      is_bot: false,
      first_seen: now,        
      last_seen: now,       
      request_count: 1,       
      deviceVendor: parsedUA.deviceVendor,
      deviceModel: parsedUA.deviceModel,
      browserType: parsedUA.browserType,
      browserVersion: parsedUA.browserVersion,
      os: parsedUA.os,
      activity_score: '0',
    } as userValidation;

  const visitorId = await updateVisitor(userValidation);
  req.newVisitorId = visitorId

  const isBot = await uaAndGeoBotDetector(req, ip!, ua, geo, parsedUA);
  
  visitorCache.set(canary, {
    banned:  isBot,
    visitor_id: visitorId!
  });

  if (isBot) {
    res.sendStatus(403);
    return; 
  }
   req.botDetection = {
    success: true,
    banned: isBot,
    time: new Date().toISOString(),
    ipAddress: req.ip!
   }
   
   userReputaion(canary).catch(err => console.error('[BOT DETECTION - MIDDLEWARE] userReputaion failed:', err))
     
  return next();
}
