import { BanReasonCode, IBotChecker } from '../../types/checkersTypes.js';
import { HeaderAnalysis } from '../headers/headers.js';
import { ValidationContext } from "../../types/botDetectorTypes.js";
import { BotDetectorConfig } from "../../types/configSchema.js";
import { CheckerRegistry } from "../CheckerRegistry.js";
import { anyOf, createRegExp } from 'magic-regexp';
import { UaAndHeaderCheckerBase } from './base.js';

export class UaAndHeaderChecker extends UaAndHeaderCheckerBase implements IBotChecker<BanReasonCode> {
  name = 'User agent and Header Verification';
  phase = 'heavy' as const;

  isEnabled(config: BotDetectorConfig): boolean {
    return config.checkers.enableUaAndHeaderChecks.enable;
  }

  async run(ctx: ValidationContext, config: BotDetectorConfig) {
    const checkConfig = config.checkers.enableUaAndHeaderChecks;
    const reasons: BanReasonCode[] = [];
    let score = 0;

    if (!checkConfig.enable) return { score, reasons };
    const { penalties } = checkConfig;

    const req = ctx.req;
    const uaString = req.get("User-Agent") ?? "";
    const uaLower = uaString.toLowerCase();
    const regex = createRegExp(anyOf('headless', 'puppeteer', 'selenium', 'playwright', 'phantomjs'));
    
    if (regex.test(uaLower)) {
        score += penalties.headlessBrowser;
        reasons.push('HEADLESS_BROWSER_DETECTED');
    }

    if (!uaString || uaString.length < 10) {
        score += penalties.shortUserAgent;
        reasons.push('SHORT_USER_AGENT');
    }

    const tlsCheckScore = this.tlsBotScore(req, config);
    if (tlsCheckScore > 0) {
        score += tlsCheckScore;
        reasons.push('TLS_CHECK_FAILED');
    }

    const headers = new HeaderAnalysis(req);
    const headerChecker = await headers.scoreHeaders();
      
    if (headerChecker > 0) {
        score += headerChecker;
        reasons.push('HEADER_SCORE_TOO_HIGH');
    }


    const pathChecker = this.pathScore(req, config);
    if (pathChecker > 0) {
        score += pathChecker;
        reasons.push('PATH_TRAVELER_FOUND');
    }

    return { score, reasons };
  }
}

CheckerRegistry.register(new UaAndHeaderChecker());