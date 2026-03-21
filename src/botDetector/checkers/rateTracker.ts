import { prep } from '../db/dialectUtils.js';
import { rateCache } from '../helpers/cache/rateLimitarCache.js';
import { IBotChecker, BanReasonCode } from "../types/checkersTypes.js";
import { ValidationContext } from "../types/botDetectorTypes.js";
import { BotDetectorConfig } from "../types/configSchema.js";
import { CheckerRegistry } from "./CheckerRegistry.js";
import { getLogger } from "@utils/logger.js";
import { getDb } from '../config/config.js';

interface VisitorRow {
  last_seen: Date;
  request_count: number;
}

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
    let score = 0;
    const reasons: BanReasonCode[] = [];

    const checkConfig = config.checkers.enableBehaviorRateCheck;
    if (!checkConfig.enable) return { score, reasons };

    const BEHAVIORAL_THRESHOLD = checkConfig.behavioral_threshold;
    const BEHAVIORAL_WINDOW = checkConfig.behavioral_window;
    const BEHAVIORAL_PENALTY = checkConfig.penalties;

    const db = getDb();
    const cached = await rateCache.get(cookie);

    if (cached) {
      const ageSinceLastSeen = Date.now() - cached.timestamp;
      if (cached.request_count > BEHAVIORAL_THRESHOLD && ageSinceLastSeen <= BEHAVIORAL_WINDOW) {
        return {
          score: cached.score,
          reasons: cached.score ? ['BEHAVIOR_TOO_FAST' as const] : []
        };
      }
    }

    try {
      const sql = 
        `SELECT last_seen, request_count
         FROM visitors
         WHERE canary_id = ?
         LIMIT 1;`;

      const visitor = await prep(db, sql).get(cookie) as VisitorRow | undefined;

      if (!visitor) return { score, reasons };

      const ageSinceLastSeen = Date.now() - visitor.last_seen.getTime();
      if (visitor.request_count > BEHAVIORAL_THRESHOLD && ageSinceLastSeen <= BEHAVIORAL_WINDOW) {
        score = BEHAVIORAL_PENALTY;
        reasons.push('BEHAVIOR_TOO_FAST');
      }

      rateCache.set(cookie, {
        score,
        timestamp: Date.now(),
        request_count: visitor.request_count,
      }).catch((err: unknown) => {
        this.logger.error({ err }, 'Failed to save rateCache in storage');
      });

    } catch (err) {
      this.logger.error({ err }, 'behaviouralDbScore failed');
      throw err;
    }

    return { score, reasons };
  }
}

CheckerRegistry.register(new BehavioralDbChecker());