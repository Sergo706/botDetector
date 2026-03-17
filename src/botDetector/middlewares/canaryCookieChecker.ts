import { getData } from '../helpers/getIPInformation.js';
import { makeCookie } from '../utils/cookieGenerator.js';
import { Request, Response, NextFunction, RequestHandler } from "express";
import { randomBytes, randomUUID } from "crypto";
import parseUA from '../helpers/UAparser.js';
import { format } from 'date-fns';
import { uaAndGeoBotDetector } from '../../botDetector.js';
import { getVisitorCache } from '../helpers/cache/cannaryCache.js';
import { userReputation } from '../helpers/reputation.js';
import { getLogger } from '../utils/logger.js';
import { userValidation } from '../types/fingerPrint.js';
import { getConfiguration, getBatchQueue } from '../config/config.js';
import { isInWhiteList } from '../utils/whitelist.js';

declare global {
  namespace Express {
    export interface Request {
      newVisitorId?: string;
      botDetection: {
        success: boolean,
        banned: boolean,
        time: string,
        ipAddress: string
      }
    }
  }
}


export function validator<TCustom = Record<string, never>>(
  buildCustomContext?: (req: Request) => TCustom,
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {checksTimeRateControl} = getConfiguration()
    let canary = req.cookies?.canary_id || null;
    const ua = req.get("User-Agent") || "";
    const ip = req.ip;
     const log = getLogger().child({service: 'BOT DETECTOR', branch: `main`, canary: canary});
     log.info(`Validator entered for ${req.method} ${req.get('X-Forwarded-Host')}`)
     log.info({ cookies: req.cookies },`Incoming cookies`);
     const whiteList = isInWhiteList(ip!); 

    if (canary) {
      const cached = getVisitorCache().get(canary);
      if (cached) {
        if (cached.banned && !whiteList) {
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

  const geo = getData(ip!);
  const parsedUA = parseUA(ua);
  const visitorId = randomUUID()

    const now = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const userValidation = {
      visitorId,
      cookie: canary,
      userAgent: ua,
      ipAddress: ip,
      device_type: parsedUA.device,
      browser: parsedUA.browser,
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
      ...geo,
    } as userValidation;

  await getBatchQueue().addQueue(canary, ip!, 'visitor_upsert', { insert: userValidation as userValidation }, 'immediate');
  req.newVisitorId = visitorId

    if (whiteList) {
        log.info(`${ip} is in white list skipping botDetection checks.`);
        
      if (visitorId) {
        getVisitorCache().set(canary, { 
          banned: false,
          visitor_id: visitorId 
        });
      }
      req.botDetection = {
      success: true,
      banned: false,
      time: new Date().toISOString(),
      ipAddress: req.ip!
      };
      
      return next()
    };

  const isBot = await uaAndGeoBotDetector(req, ip!, ua, geo, parsedUA, buildCustomContext);
  
  getVisitorCache().set(canary, {
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
   
   userReputation(canary).catch(err => console.error('[BOT DETECTION - MIDDLEWARE] userReputation failed:', err))

  return next();
  };
}
