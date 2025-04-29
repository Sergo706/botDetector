import { getdata } from '../helpers/getIPInformation.js';
import { makeCookie } from '../utils/cookieGenerator.js';
import { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";
import parseUA from '../helpers/UAparser.js';
import { format } from 'date-fns';
import { updateVisitor } from '../db/updateVisitors.js';
import { uaAndGeoBotDetector } from '../botDetector.js';
import { visitorCache } from '../helpers/cache/cannaryCache.js';
import { settings } from '../settings.js';
import { userReputaion } from '../helpers/reputation.js';

export const validator = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    let canary = req.cookies?.canary_id || null;
    const ua = req.get("User-Agent") || "";
    const ip = req.ip;
    console.log(`[DEBUG] Validator entered for ${req.method} ${req.originalUrl}`);
    console.log(`[DEBUG] Incoming cookies:`, req.cookies);

    if (canary) {
      const hit = visitorCache.get(canary);
      if (hit && hit.expires > Date.now()) {
        if (hit.banned) {
          res.sendStatus(403);
          return; 
        } 
        if (!settings.checksTimeRateControl.checkEveryReqest){ 
        return next();
      }
      }
    }
    
  if (!canary) {
    console.log(`[DEBUG] No canary_id cookie found. Generating a new one.`);
    const cookieValue = randomBytes(32).toString('hex');
    canary = cookieValue;
    
    makeCookie(res,'canary_id', cookieValue, {
      httpOnly: true,
      sameSite: "strict", 
      maxAge: 1000 * 60 * 60 * 24 * 90,
      secure: true,
      path: "/", 
    })
    req.cookies = req.cookies || {};
    req.cookies.canary_id = canary;
    console.log(`[DEBUG] New canary_id cookie set:`, cookieValue);
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
      as: geo.as ?? 'unknown',
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
    };
    updateVisitor(userValidation);
 
  const isBot = await uaAndGeoBotDetector(req, ip!, ua, geo, parsedUA);
  
  visitorCache.set(canary, {
    banned:  isBot,
    expires: Date.now() + settings.checksTimeRateControl.checkEvery
  });

  if (isBot) {
    res.sendStatus(403);
    return; 
  }
   userReputaion(canary).catch(err => console.error('[BOTDETECTION - MIDDLEWARE] userReputaion failed:', err))
     
  return next();
}
