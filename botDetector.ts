import { VisitorTrackingData } from './types/botDetectorTypes.js'
import { Request } from 'express';
import { mapCountry } from './checkers/acceptLangMap.js';
import { timeZoneMapper } from './checkers/timezoneMap.js';
import { behaviouralDbScore } from './checkers/rateTracker.js';
import { validateIp } from './checkers/ipValidation.js';
import { banIp } from './helpers/banIP.js';
import { updateBannedIP } from '../../db/updateBanned.js';
import { updateScore } from '../../db/updateVisitorScore.js';
import type { ParsedUAResult } from './types/UAparserTypes.js';
import type { GeoResponse } from './types/geoTypes.js';
import { BanReasonCode } from './types/checkersTypes.js';
import { validateGoodBots } from './checkers/goodBots.js';
import { calculateUaAndHeaderScore } from './checkers/headersAndUACalc.js';
import { calculateBrowserDetailsAndDevice } from './checkers/browserTypesAneDevicesCalc.js';
import { settings } from './settings.js';
import { calculateGeoLocation } from './checkers/geoLocationCalc.js';
import { calculateProxyIspAndCookie } from './checkers/proxyISPAndCookieCalc.js';
import { norm } from './helpers/normalize.js'

const BAN_THRESHOLD = settings.banScore;
const MAX_SCORE = settings.maxScore;

class BadBotDetected extends Error {
  constructor(message = 'Bad bot detected') {
    super(message);
    this.name = 'BadBotDetected';
  }
}
class GoodBotDetected extends Error {
  constructor(message = 'Good bot detected') {
    super(message);
    this.name = 'GoodBotDetected';
  }
}

export async function uaAndGeoBotDetector(req: Request, ipAddress: string, userAgent: string, geo: GeoResponse,  parsedUA: ParsedUAResult ): Promise<boolean> {

  const reasons: BanReasonCode[] = [];
  let botScore: number = 0;
  const cookie = req.cookies.canary_id 
  const uaString = req.get("User-Agent") || "";
  console.log(`[DEBUG] BotDetection called for ${req.method} ${req.originalUrl}`);

  const data: VisitorTrackingData = {
    cookie: cookie,
    device: norm(parsedUA.device),
    ipAddress: ipAddress,
    country: norm(geo.country),
    countryCode: norm(geo.countryCode),
    region: norm(geo.region),
    regionName: norm(geo.regionName),
    city: norm(geo.city),
    district: norm(geo.district),
    lat: geo.lat ? String(geo.lat) : 'unknown',
    lon: geo.lon ? String(geo.lon) : 'unknown',
    timezone: norm(geo.timezone),
    currency: norm(geo.currency),
    isp: norm(geo.isp),
    org: norm(geo.org),
    as: norm(geo.as),
    browser: norm(parsedUA.browser),
    proxy: geo.proxy ?? false,
    hosting: (geo as any).hosting ?? false,
    is_bot: parsedUA.botAI,
    is_ai_bot: parsedUA.botAI,
    deviceVendor: norm(parsedUA.deviceVendor),
    deviceModel: norm(parsedUA.deviceModel),
    browserType: norm(parsedUA.browserType),
    browserVersion: norm(parsedUA.browserVersion),
    os: norm(parsedUA.os),
  };


const checks: Array<() => Promise<{ score: number; reasons?: BanReasonCode[] }>> = [];

if (settings.checks.enableIpChecks) {
  checks.push(() => 
    validateIp(ipAddress)
      .then(isValid => ({
        score: isValid ? 0 : BAN_THRESHOLD,
        reasons: isValid ? [] : ['INVALID_IP' as BanReasonCode]
      }))
  );
}

if (settings.checks.enableGoodBotsChecks) {
  checks.push(() => 
    validateGoodBots(data.browserType, data.browser, ipAddress)
      .then(({ score, isBadBot, isGoodBot }) => { 
        if (isBadBot) throw new BadBotDetected();
        if (isGoodBot) throw new GoodBotDetected();
        return { score, reasons: [] };
      })
  );
}

if (settings.checks.enableBehaviorRateCheck) {
  checks.push(() => 
    behaviouralDbScore(cookie)
      .then(score => ({ score, reasons: score ? ['BEHAVIOR_TOO_FAST'] : [] }))
  );
}

if (settings.checks.enableProxyIspCookiesChecks) {
  checks.push(() =>
    Promise.resolve(calculateProxyIspAndCookie(cookie, data.proxy, data.hosting, data.isp, data.org, data.as))
  );
}

if (settings.checks.enableUaAndHeaderChecks) {
  checks.push(() =>
    Promise.resolve(calculateUaAndHeaderScore(req))
  );
}

if (settings.checks.enableBrowserAndDeviceChecks) {
  checks.push(() =>
    Promise.resolve(calculateBrowserDetailsAndDevice(
      data.browserType,
      data.browser,
      data.os,
      data.device,
      data.deviceVendor,
      data.browserVersion,
      data.deviceModel
    ))
  );
}

if (settings.checks.enableGeoChecks) {
  checks.push(() =>
    Promise.resolve(calculateGeoLocation(
      data.country,
      data.region,
      data.regionName,
      data.lat,
      data.lon,
      data.district,
      data.city,
      data.timezone
    ))
  );
}

if (settings.checks.enableLocaleMapsCheck) {
  checks.push(() => {
    const score = mapCountry(req.get('Accept-Language') || '', data.country, data.countryCode);
    return Promise.resolve({ score, reasons: score > 0 ? ['LOCALE_MISMATCH'] : [] });
  });
}

if (settings.checks.enableTimeZoneMapper) {
  checks.push(() => {
    const score = timeZoneMapper(data.country, data.timezone);
    return Promise.resolve({ score, reasons: score > 0 ? ['TZ_MISMATCH'] : [] });
  });
}

  try {
    let cs = 0
    for (const runCheck of checks) {
      const { score, reasons: rs = [] } = await runCheck();
      console.log(
        `Check #${cs++} →`,
        runCheck,
        'score=', score,
        'reasons=', rs
      );
      
      botScore += score;
      rs.forEach(r => reasons.push(r));
      if (botScore >= BAN_THRESHOLD) break;
    }
  } catch (error) {
    if (error instanceof BadBotDetected) {
      await Promise.all([
        banIp(ipAddress, { score: BAN_THRESHOLD, reasons: Array.from(reasons) }),
        updateBannedIP(cookie, ipAddress, data.country, uaString, { score: BAN_THRESHOLD, reasons: Array.from(reasons) })
      ]);
      return true;
    }
    if (error instanceof GoodBotDetected) {
      return false;
    }
    console.error('[BotDetector] unexpected error', error);
  }

  botScore = Math.min(botScore, MAX_SCORE);
  if (botScore >= BAN_THRESHOLD) {
    console.log(`[DEBUG] Starting Ban for ${ipAddress} ${userAgent}`),
    await Promise.all([
      banIp(ipAddress, { score: botScore, reasons: Array.from(reasons) }),
      updateBannedIP(cookie, ipAddress, data.country, uaString, { score: botScore, reasons: Array.from(reasons) })
    ]);
    return true;
  }

  await updateScore(botScore, cookie);
  return false;
}

