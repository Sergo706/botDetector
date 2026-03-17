import { ValidationContext } from "../types/botDetectorTypes.js";
import { BanReasonCode, IBotChecker } from "../types/checkersTypes.js";
import { BotDetectorConfig } from "../types/configSchema.js";
import { CheckerRegistry } from "./CheckerRegistry.js";

export class HoneypotChecker implements IBotChecker<BanReasonCode> {
    name = 'Honeypot Path';
    phase = 'cheap' as const;

    isEnabled(config: BotDetectorConfig): boolean {
        return config.checkers.honeypot.enable;
    }

    run(ctx: ValidationContext, config: BotDetectorConfig) {
        const checkConfig = config.checkers.honeypot;
        const reasons: BanReasonCode[] = [];

        if (checkConfig.enable === false || checkConfig.paths.length === 0) {
            return { score: 0, reasons };
        }

        const requestPath = ctx.req.path.toLowerCase();
        const hit = checkConfig.paths.some(p => requestPath === p.toLowerCase());

        if (hit) {
            reasons.push('HONEYPOT_PATH_HIT');
            reasons.push('BAD_BOT_DETECTED');
        }

        return { score: 0, reasons };
    }
}

CheckerRegistry.register(new HoneypotChecker());