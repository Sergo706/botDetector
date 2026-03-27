import { getData } from '../helpers/getIPInformation.js';
import { makeCookie } from '../utils/cookieGenerator.js';
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { randomBytes, randomUUID } from "crypto";
import parseUA from '../helpers/UAparser.js';
import { uaAndGeoBotDetector } from '../../botDetector.js';
import { visitorCache } from '../helpers/cache/cannaryCache.js';
import { rateCache } from '../helpers/cache/rateLimitarCache.js';
import { userReputation } from '../helpers/reputation.js';
import { getLogger } from '../utils/logger.js';
import type { userValidation } from '../types/fingerPrint.js';
import { getConfiguration, getBatchQueue } from '../config/config.js';
import { isInWhiteList } from '../utils/whitelist.js';
import { nowMysql } from '@utils/nowMysql.js';
import consola from 'consola';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
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


export function validator(
  buildCustomContext?: (req: Request) => unknown,
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {checksTimeRateControl} = getConfiguration();
    let canary: string | undefined = req.cookies.canary_id as string | undefined;
    const ua = req.get("User-Agent") ?? "";
    const ip = req.ip ?? '';
     const log = getLogger().child({service: 'BOT DETECTOR', branch: `main`, canary: canary});
     log.info(`Validator entered for ${req.method} ${req.get('X-Forwarded-Host') ?? ''}`);
     log.info({ cookies: req.cookies },`Incoming cookies`);
     const whiteList = isInWhiteList(ip);

    if (canary) {
      const cached = await visitorCache.get(canary);
      if (cached) {
        if (cached.banned && !whiteList) {
          res.sendStatus(403);
          return;
        }
        req.newVisitorId = cached.visitor_id;
        if (!checksTimeRateControl.checkEveryRequest){
        next(); return;
      }
      }
    }
    
  if (!canary) {
    log.info(`No canary_id cookie found. Generating a new one.`);
    const cookieValue = randomBytes(32).toString('hex');
    canary = cookieValue;
    
    makeCookie(res,'canary_id', cookieValue, {
      httpOnly: true,
      sameSite: "lax", 
      maxAge: 1000 * 60 * 60 * 24 * 90,
      secure: true,
      path: "/", 
    });
    req.cookies.canary_id = canary;
    log.info(`New canary_id cookie set:, ${cookieValue}`);
  }

  const geo = getData(ip);
  const parsedUA = parseUA(ua);
  const visitorId = randomUUID();

  const userValidation = {
      visitorId,
      cookie: canary,
      userAgent: ua,
      ipAddress: ip,
      device_type: parsedUA.device,
      browser: parsedUA.browser,
      is_bot: false,
      first_seen: nowMysql(),        
      last_seen: nowMysql(),       
      request_count: 1,       
      deviceVendor: parsedUA.deviceVendor,
      deviceModel: parsedUA.deviceModel,
      browserType: parsedUA.browserType,
      browserVersion: parsedUA.browserVersion,
      os: parsedUA.os,
      activity_score: '0',
      ...geo,
    } as userValidation;

  void getBatchQueue().addQueue(canary, ip, 'visitor_upsert', { insert: userValidation }, 'deferred');
  req.newVisitorId = visitorId;

    if (whiteList) {
        log.info(`${ip} is in white list skipping botDetection checks.`);

      visitorCache.set(canary, {
        banned: false,
        visitor_id: visitorId
      }).catch((err: unknown) => { log.error({ err }, 'Failed to save visitorCache in storage'); });

      req.botDetection = {
      success: true,
      banned: false,
      time: new Date().toISOString(),
      ipAddress: ip
      };

      next(); return;
    };

  const brvConfig = getConfiguration().checkers.enableBehaviorRateCheck;
  if (brvConfig.enable) {
    const existing = await rateCache.get(canary);
    if (!existing) {
      const ttlSeconds = Math.ceil(brvConfig.behavioral_window / 1000);
      rateCache.set(canary, { score: 0, timestamp: Date.now(), request_count: 1 }, ttlSeconds)
        .catch((err: unknown) => { log.error({ err }, 'Failed to pre seed rateCache'); });
    }
  }

  const isBot = await uaAndGeoBotDetector(req, ip, ua, geo, parsedUA, buildCustomContext);

  visitorCache.set(canary, {
    banned: isBot,
    visitor_id: visitorId
  }).catch((err: unknown) => { log.error({ err }, 'Failed to save visitorCache in storage'); });

  if (isBot) {
    res.sendStatus(403);
    return;
  }

   req.botDetection = {
    success: true,
    banned: isBot,
    time: new Date().toISOString(),
    ipAddress: ip
   };
   
   userReputation(canary).catch((err: unknown) => { consola.error('[BOT DETECTION - MIDDLEWARE] userReputation failed:', err); });

  next();
  };
}
