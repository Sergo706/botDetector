import './botDetector/checkers/index.js'; 
import { Request } from 'express';
import { CheckerRegistry } from './botDetector/checkers/CheckerRegistry.js';
import { ValidationContext } from './botDetector/types/botDetectorTypes.js';
import { BadBotDetected, GoodBotDetected } from './botDetector/helpers/exceptions.js';
import { banIp } from './botDetector/penalties/banIP.js';
import type { ParsedUAResult } from './botDetector/types/UAparserTypes.js';
import type { GeoResponse } from './botDetector/types/geoTypes.js';
import { BanReasonCode } from './botDetector/types/checkersTypes.js';
import { processChecks } from './botDetector/helpers/processChecks.js';
import { reputationCache } from './botDetector/helpers/cache/reputationCache.js';
import { getLogger } from './botDetector/utils/logger.js';
import { getConfiguration, getDataSources, getBatchQueue } from './botDetector/config/config.js';

export async function uaAndGeoBotDetector(
  req: Request,
  ipAddress: string,
  userAgent: string,
  geo: GeoResponse,
  parsedUA: ParsedUAResult,
  buildCustomContext?: (req: Request) => unknown,
): Promise<boolean> {
  
  const log = getLogger().child({service: 'BOT DETECTOR', branch: 'main'});
  const {banScore, maxScore, setNewComputedScore} = getConfiguration();
  const BAN_THRESHOLD = banScore;
  const MAX_SCORE = maxScore;

  const reasons: BanReasonCode[] = [];
  let botScore = 0;
  const cookie: string | undefined = req.cookies.canary_id as string | undefined; 
  const uaString = req.get("User-Agent") ?? "";
  log.info(`BotDetection called for ${req.method} ${req.get('X-Forwarded-Host') ?? ''}`);

  const threatsLevels = getDataSources().fireholLvl1DataBase(ipAddress) ? 1 :
                      getDataSources().fireholLvl2DataBase(ipAddress) ? 2 :
                      getDataSources().fireholLvl3DataBase(ipAddress) ? 3 :
                      getDataSources().fireholLvl4DataBase(ipAddress) ? 4 : null as 1 | 2 | 3 | 4 | null;

  const proxy = () => {
    const isProxy = getDataSources().proxyDataBase(ipAddress);
    if (isProxy) {
      return {
        proxy: true,
        proxyType: isProxy.comment
      };
    }
    return { proxy: false };
  };
  
  const {tor, asn, threatLevel, anon} = {
    tor: getDataSources().torDataBase(ipAddress),
    asn: getDataSources().asnDataBase(ipAddress),
    threatLevel: threatsLevels,
    anon: getDataSources().fireholAnonDataBase(ipAddress) ? true : false,
  };

  const proxyResult = proxy();
  const ctx: ValidationContext<unknown> = {
    req,
    ipAddress,
    parsedUA: parsedUA,
    geoData: geo,
    cookie,
    proxy: {
      isProxy: proxyResult.proxy,
      proxyType: proxyResult.proxyType
    },
    anon,
    bgp: asn ?? {},
    tor: tor ?? {},
    threatLevel,
    custom: buildCustomContext ? buildCustomContext(req) : ({} as unknown),
  };

  const cheapChecks = CheckerRegistry.getEnabled('cheap', getConfiguration());
  const checks = CheckerRegistry.getEnabled('heavy', getConfiguration());

  try {
    botScore = await processChecks(cheapChecks, ctx, getConfiguration(), botScore, reasons, 'cheapPhase');

    if (botScore < BAN_THRESHOLD) {
      botScore = await processChecks(checks, ctx, getConfiguration(), botScore, reasons, 'heavyPhase');
    }
  } catch (error) {
    if (error instanceof BadBotDetected) {
      const bannedInfo = { score: BAN_THRESHOLD, reasons: Array.from(reasons) };
      await Promise.all([
        banIp(ipAddress, bannedInfo),
        getBatchQueue().addQueue(cookie ?? '', ipAddress, 'update_banned_ip', { cookie: cookie ?? '', ipAddress, country: ctx.geoData.country ?? '', user_agent: uaString, info: bannedInfo }, 'immediate'),
      ]);
      void getBatchQueue().addQueue(cookie ?? '', ipAddress, 'is_bot_update', { isBot: true, cookie: cookie ?? '' }, 'deferred');
      return true;
    }
    if (error instanceof GoodBotDetected) {
      return false;
    }
    log.error({error},'unexpected error');
  }

  botScore = Math.min(botScore, MAX_SCORE);
  if (botScore >= BAN_THRESHOLD) {
    log.info(`Starting Ban for ${ipAddress} ${userAgent}`);
    const bannedInfo = { score: botScore, reasons: Array.from(reasons) };
    await Promise.all([
      banIp(ipAddress, bannedInfo),
      getBatchQueue().addQueue(cookie ?? '', ipAddress, 'update_banned_ip', { cookie: cookie ?? '', ipAddress, country: ctx.geoData.country ?? '', user_agent: uaString, info: bannedInfo }, 'immediate'),
    ]);
    void getBatchQueue().addQueue(cookie ?? '', ipAddress, 'is_bot_update', { isBot: true, cookie: cookie ?? '' }, 'deferred');
    return true;
  }


  if (setNewComputedScore) {
    void getBatchQueue().addQueue(cookie ?? '', ipAddress, 'score_update', { score: botScore, cookie: cookie ?? '' }, 'deferred');

    reputationCache.set(cookie ?? '', { isBot: false, score: botScore }).catch((err: unknown) => {
      log.error({err}, 'Failed to set reputationCache in storage');
    });

  } else {
    const cached = await reputationCache.get(cookie ?? '');
    if (!cached || cached.score === 0) {
      void getBatchQueue().addQueue(cookie ?? '', ipAddress, 'score_update', { score: botScore, cookie: cookie ?? '' }, 'deferred');

      reputationCache.set(cookie ?? '', { isBot: false, score: botScore }).catch((err: unknown) => {
         log.error({err}, 'Failed to set reputationCache in storage');
      });
      
    }
  }
  return false;
}

