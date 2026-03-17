import { getPool } from '../config/dbConnection.js';
import { RowDataPacket } from 'mysql2';
import { rateCache } from '../helpers/cache/rateLimitarCache.js';
import { IBotChecker, BanReasonCode } from "../types/checkersTypes.js";
import { ValidationContext } from "../types/botDetectorTypes.js";
import { BotDetectorConfig } from "../types/configSchema.js";
import { CheckerRegistry } from "./CheckerRegistry.js";

interface VisitorRow extends RowDataPacket {
  last_seen: Date;
  request_count: number;
}

export class BehavioralDbChecker implements IBotChecker<BanReasonCode> {
  name = 'Behavior Rate Verification';
  phase = 'heavy' as const;

  isEnabled(config: BotDetectorConfig): boolean {
    return config.checkers.enableBehaviorRateCheck.enable;
  }

  async run(ctx: ValidationContext, config: BotDetectorConfig) {
    const cookie = ctx.cookie || '';
    let score = 0;
    const reasons: BanReasonCode[] = [];

    const checkConfig = config.checkers.enableBehaviorRateCheck;
    if (checkConfig.enable === false) return { score, reasons };

    const BEHAVIORAL_THRESHOLD = checkConfig.behavioral_threshold;
    const BEHAVIORAL_WINDOW = checkConfig.behavioral_window;
    const BEHAVIORAL_PENALTY = checkConfig.penalties;

    const pool = getPool();
    const cached = rateCache.get(cookie);

    if (cached) {
      console.log('[CACHE HIT] behaviouralDbScore');
      const ageSinceLastSeen = Date.now() - cached.timestamp;
      if (cached.request_count > BEHAVIORAL_THRESHOLD && ageSinceLastSeen <= BEHAVIORAL_WINDOW) {
        return {
          score: cached.score,
          reasons: cached.score ? ['BEHAVIOR_TOO_FAST' as const] : []
        };
      }
    } else {
      console.log('[CACHE MISS or EXPIRED] behaviouralDbScore');
    }

    try {
      const [rows] = await pool.execute<VisitorRow[]>(
        `SELECT last_seen, request_count
         FROM visitors
         WHERE canary_id = ?
         LIMIT 1;`,
        [cookie]
      );
      const visitor = rows[0];

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
      });

    } catch (err) {
      console.error('[ERROR] behaviouralDbScore failed:', err);
      throw err;
    }

    return { score, reasons };
  }
}

CheckerRegistry.register(new BehavioralDbChecker());
