import { ValidationContext } from "../types/botDetectorTypes.js";
import { BanReasonCode, IBotChecker } from "../types/checkersTypes.js";
import { BotDetectorConfig } from "../types/configSchema.js";
import { CheckerRegistry } from "./CheckerRegistry.js";
import { timingCache } from "../helpers/cache/timingCache.js";

const MAX_SAMPLES = 10;
const MIN_SAMPLES_TO_EVALUATE = 5;

export class VelocityFingerprintChecker implements IBotChecker<BanReasonCode> {
    name = 'Velocity Fingerprinting';
    phase = 'heavy' as const;

    isEnabled(config: BotDetectorConfig): boolean {
        return config.checkers.enableVelocityFingerprint.enable;
    }

    run(ctx: ValidationContext, config: BotDetectorConfig) {
        const checkConfig = config.checkers.enableVelocityFingerprint;
        const reasons: BanReasonCode[] = [];
        let score = 0;

        if (checkConfig.enable === false || !ctx.cookie) return { score, reasons };

        const now = Date.now();
        const existing = timingCache.get(ctx.cookie) ?? [];
        const timestamps = [...existing, now].slice(-MAX_SAMPLES);
        timingCache.set(ctx.cookie, timestamps);

        if (timestamps.length < MIN_SAMPLES_TO_EVALUATE) return { score, reasons };

        const intervals: number[] = [];
        for (let i = 1; i < timestamps.length; i++) {
            intervals.push(timestamps[i] - timestamps[i - 1]);
        }

        const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        if (mean === 0) return { score, reasons };

        const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
        const cv = Math.sqrt(variance) / mean;

        if (cv < checkConfig.cvThreshold) {
            score += checkConfig.penalties;
            reasons.push('TIMING_TOO_REGULAR');
        }

        return { score, reasons };
    }
}

CheckerRegistry.register(new VelocityFingerprintChecker());