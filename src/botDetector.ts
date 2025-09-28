import { VisitorTrackingData } from './botDetector/types/botDetectorTypes.js'
import { Request } from 'express';
import { mapCountry } from './botDetector/checkers/acceptLangMap.js';
import { timeZoneMapper } from './botDetector/checkers/timezoneMap.js';
import { behaviouralDbScore } from './botDetector/checkers/rateTracker.js';
import { validateIp } from './botDetector/checkers/ipValidation.js';
import { banIp } from './botDetector/penalties/banIP.js';
import { updateBannedIP } from './botDetector/db/updateBanned.js';
import { updateScore } from './botDetector/db/updateVisitorScore.js';
import type { ParsedUAResult } from './botDetector/types/UAparserTypes.js';
import type { GeoResponse } from './botDetector/types/geoTypes.js';
import { BanReasonCode } from './botDetector/types/checkersTypes.js';
import { validateGoodBots } from './botDetector/checkers/goodBots.js';
import { calculateUaAndHeaderScore } from './botDetector/checkers/headersAndUACalc.js';
import { calculateBrowserDetailsAndDevice } from './botDetector/checkers/browserTypesAneDevicesCalc.js';
import { calculateGeoLocation } from './botDetector/checkers/geoLocationCalc.js';
import { calculateProxyIspAndCookie } from './botDetector/checkers/proxyISPAndCookieCalc.js';
import { norm } from './botDetector/helpers/normalize.js'
import { processChecks } from './botDetector/helpers/processChecks.js';
import { updateIsBot } from './botDetector/db/updateIsBot.js';
import { reputationCache } from './botDetector/helpers/cache/reputationCache.js';
import { getLogger } from './botDetector/utils/logger.js';
import { getConfiguration } from './botDetector/config/config.js';



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
  const log = getLogger().child({service: 'BOT DETECTOR', branch: 'main'});
  const {banScore, maxScore, checks: enabledChecks, setNewComputedScore} = getConfiguration()
  const BAN_THRESHOLD = banScore;
  const MAX_SCORE = maxScore;

  const reasons: BanReasonCode[] = [];
  let botScore: number = 0;
  const cookie = req.cookies.canary_id 
  const uaString = req.get("User-Agent") || "";
  log.info(`BotDetection called for ${req.method} ${req.get('X-Forwarded-Host')}`);

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
    as: norm(geo.as_org),
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


const cheapChecks: Array<() => Promise<{ score: number; reasons?: BanReasonCode[] }>> = [];
const checks: Array<() => Promise<{ score: number; reasons?: BanReasonCode[] }>> = [];



if (enabledChecks.enableIpChecks) {
    cheapChecks.push(async function ipCheck() {
      const isValid = await validateIp(ipAddress);
      return {
        score:   isValid ? 0 : BAN_THRESHOLD,
        reasons: isValid ? [] : ['INVALID_IP' as BanReasonCode]
      };
    });
  }

  if (enabledChecks.enableGoodBotsChecks) {
    cheapChecks.push(async function goodBotCheck() {
      const { score, isBadBot, isGoodBot } =
        await validateGoodBots(data.browserType, data.browser, ipAddress);
      if (isBadBot) throw new BadBotDetected();
      if (isGoodBot) throw new GoodBotDetected();
      return { score, reasons: [] };
    });
  }

  if (enabledChecks.enableBrowserAndDeviceChecks) {
    cheapChecks.push(async function browserDetailsAndDeviceCheck() {
      return calculateBrowserDetailsAndDevice(
        data.browserType,
        data.browser,
        data.os,
        data.device,
        data.deviceVendor,
        data.browserVersion,
        data.deviceModel
      );
    });
  }
  
  if (enabledChecks.enableTimeZoneMapper) {
    cheapChecks.push(async function timeZoneMapperCheck() {
      const score = timeZoneMapper(data.country, data.timezone);
      return { score, reasons: score ? ['TZ_MISMATCH'] : [] };
    });
  }
  

  if (enabledChecks.enableLocaleMapsCheck) {
    cheapChecks.push(async function localeMapCheck() {
      const score = mapCountry(
        req.get('Accept-Language') || '',
        data.country,
        data.countryCode
      );
      return { score, reasons: score ? ['LOCALE_MISMATCH'] : [] };
    });
  }


  if (enabledChecks.enableBehaviorRateCheck) {
    checks.push(async function behaviouralDbScoreCheck() {
      const score = await behaviouralDbScore(cookie);
      return { score, reasons: score ? ['BEHAVIOR_TOO_FAST'] : [] };
    });
  }

  if (enabledChecks.enableProxyIspCookiesChecks) {
    checks.push(async function proxyIspCookieCheck() {
      return calculateProxyIspAndCookie(
        cookie,
        data.proxy,
        data.hosting,
        data.isp,
        data.org,
        data.as
      );
    });
  }


if (enabledChecks.enableUaAndHeaderChecks) {
  checks.push(async function uaHeaderScoreCheck() {
    return calculateUaAndHeaderScore(req);
  });
}


if (enabledChecks.enableGeoChecks) {
    checks.push(async function geoLocationCheck() {
      return calculateGeoLocation(
        data.country,
        data.region,
        data.regionName,
        data.lat,
        data.lon,
        data.district,
        data.city,
        data.timezone
      );
    });
  }

  try {
    botScore = await processChecks(cheapChecks, botScore, reasons,'cheapPhase');

    if (botScore < BAN_THRESHOLD) {
      botScore = await processChecks(checks, botScore, reasons,'heavyPhase');
    }
  } catch (error) {
    if (error instanceof BadBotDetected) {
      await Promise.all([
        banIp(ipAddress, { score: BAN_THRESHOLD, reasons: Array.from(reasons) }),
        updateBannedIP(cookie, ipAddress, data.country, uaString, { score: BAN_THRESHOLD, reasons: Array.from
        (reasons) }),
        updateIsBot(true, cookie)
      ]);
      return true;
    }
    if (error instanceof GoodBotDetected) {
      return false;
    }
    log.error({error},'unexpected error');
  }

  botScore = Math.min(botScore, MAX_SCORE);
  if (botScore >= BAN_THRESHOLD) {
    log.info(`Starting Ban for ${ipAddress} ${userAgent}`),
    await Promise.all([
      banIp(ipAddress, { score: botScore, reasons: Array.from(reasons) }),
      updateBannedIP(cookie, ipAddress, data.country, uaString, { score: botScore, reasons: Array.from(reasons) }),
      updateIsBot(true, cookie)
    ]);
    return true;
  }


  if (setNewComputedScore) { 
  await updateScore(botScore, cookie);
  reputationCache.set(cookie, { isBot: false, score: botScore });
  } else {
  const cached = reputationCache.get(cookie);
  if (!cached || cached.score === 0) {
    await updateScore(botScore, cookie);   
    reputationCache.set(cookie, { isBot: false, score: botScore });
  }
  }
  return false;
}

