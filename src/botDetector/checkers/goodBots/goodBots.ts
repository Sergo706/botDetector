import suffix from '../../db/json/suffix.json' with { type: 'json' };
import { IBotChecker } from "../../types/checkersTypes.js";
import { ValidationContext } from "../../types/botDetectorTypes.js";
import { BotDetectorConfig } from "../../types/configSchema.js";
import { CheckerRegistry } from "../CheckerRegistry.js";
import { GoodBotsBase } from "./base.js";
import { Suffix } from '../../types/suffixes.js';

const suffixes: Suffix = suffix;

const userAgents: string[] = Object.values(suffixes)
  .flatMap((e) =>
    Array.isArray(e.useragent) ? e.useragent : [e.useragent]
  )
  .map(u => u.toLowerCase());
  
export class GoodBotsChecker extends GoodBotsBase implements IBotChecker<'BAD_BOT_DETECTED' | 'GOOD_BOT_IDENTIFIED'> {
  name = 'Good/Bad Bot Verification';
  phase = 'cheap' as const;

  isEnabled(config: BotDetectorConfig): boolean {
    return config.checkers.enableGoodBotsChecks.enable;
  }

  async run(ctx: ValidationContext, config: BotDetectorConfig) {
    const browserType = (ctx.parsedUA.browserType ?? '').toLowerCase();
    const browserName = (ctx.parsedUA.browser ?? '').toLowerCase();
    const ipAddress = ctx.ipAddress;
    
    const score = 0;
    const reasons: ('BAD_BOT_DETECTED' | 'GOOD_BOT_IDENTIFIED')[] = [];

    const checkersConfig = config.checkers.enableGoodBotsChecks;
    if (!checkersConfig.enable) return { score, reasons };

    if (browserType !== 'crawler' && browserType !== 'fetcher') {
      return { score: 0, reasons: [] };
    }

    const name = browserName;
    const botsWithoutSuffix  = ['duckduckbot','gptbot','oai-searchbot','chatgpt-user'].includes(name);
    const botsWithSuffix = userAgents.some(suf => name.includes(suf));

    if (checkersConfig.banUnlistedBots && !botsWithoutSuffix && !botsWithSuffix) {
        reasons.push('BAD_BOT_DETECTED');
        return { score: 0, reasons };   
    }

    let trusted: boolean;

    if (botsWithSuffix) {
      trusted = await this.isBotFromTrustedDomain(ipAddress);
    } else {
      trusted = this.isBotIPTrusted(ipAddress);
    }

    if (!trusted) {
      reasons.push('BAD_BOT_DETECTED');
      return {
        score: checkersConfig.penalties,
        reasons
      };
    }

    reasons.push('GOOD_BOT_IDENTIFIED');
    return { score, reasons };
  }
}

CheckerRegistry.register(new GoodBotsChecker());
