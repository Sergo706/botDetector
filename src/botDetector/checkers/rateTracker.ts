import { rateCache } from '../helpers/cache/rateLimitarCache.js';
import { IBotChecker, BanReasonCode } from "../types/checkersTypes.js";
import { ValidationContext } from "../types/botDetectorTypes.js";
import { BotDetectorConfig } from "../types/configSchema.js";
import { CheckerRegistry } from "./CheckerRegistry.js";
import { getLogger } from "@utils/logger.js";

export class BehavioralDbChecker implements IBotChecker<BanReasonCode> {
  name = 'Behavior Rate Verification';
  phase = 'heavy' as const;
  private _logger?: ReturnType<typeof getLogger>;
  private get logger() {
    this._logger ??= getLogger().child({ service: 'botDetector', branch: 'checker', type: 'BehavioralDbChecker' });
    return this._logger;
  }

  isEnabled(config: BotDetectorConfig): boolean {
    return config.checkers.enableBehaviorRateCheck.enable;
  }

  async run(ctx: ValidationContext, config: BotDetectorConfig) {
    const cookie = ctx.cookie ?? '';

    const checkConfig = config.checkers.enableBehaviorRateCheck;
    if (!checkConfig.enable) return { score: 0, reasons: [] };

    const BEHAVIORAL_THRESHOLD = checkConfig.behavioral_threshold;
    const BEHAVIORAL_WINDOW = checkConfig.behavioral_window;
    const BEHAVIORAL_PENALTY = checkConfig.penalties;
    const ttlSeconds = Math.ceil(BEHAVIORAL_WINDOW / 1000);

    const cached = await rateCache.get(cookie);

    if (cached) {
      const ageSinceLastSeen = Date.now() - cached.timestamp;

      if (ageSinceLastSeen <= BEHAVIORAL_WINDOW) {
        const newCount = cached.request_count + 1;
        const score = newCount > BEHAVIORAL_THRESHOLD ? BEHAVIORAL_PENALTY : 0;

        rateCache.set(cookie, { ...cached, request_count: newCount, score }, ttlSeconds).catch((err: unknown) => {
          this.logger.error({ err }, 'Failed to save rateCache in storage');
        });

        return { score, reasons: score ? ['BEHAVIOR_TOO_FAST' as const] : [] };
      } else {
        rateCache.set(cookie, { request_count: 1, timestamp: Date.now(), score: 0 }, ttlSeconds).catch((err: unknown) => {
          this.logger.error({ err }, 'Failed to reset rateCache in storage');
        });

        return { score: 0, reasons: [] };
      }
    }

    return { score: 0, reasons: [] };
  }
}

CheckerRegistry.register(new BehavioralDbChecker());