import { ValidationContext } from "../types/botDetectorTypes.js";
import { BanReasonCode, IBotChecker } from "../types/checkersTypes.js";
import { BotDetectorConfig } from "../types/configSchema.js";
import { CheckerRegistry } from "./CheckerRegistry.js";
import { getDataSources } from "../config/config.js";


export class KnownBadIps implements IBotChecker<BanReasonCode> {
    name = 'KnownBadIps'
    phase = 'cheap' as const

    isEnabled(config: BotDetectorConfig) {
        return config.checkers.enableKnownBadIpsCheck.enable;
    }

    run(ctx: ValidationContext, config: BotDetectorConfig) {
        const { enableKnownBadIpsCheck } = config.checkers;
        const reasons: BanReasonCode[] = [];
        let score = 0;

        if (enableKnownBadIpsCheck.enable === false) return { score, reasons };

        const ds = getDataSources();
        const ip = ctx.ipAddress;

        const banned = ds.bannedDataBase(ip);
        if (banned) {
            reasons.push('PREVIOUSLY_BANNED_IP', 'BAD_BOT_DETECTED');
            return { score, reasons };
        }

        const highRisk = ds.highRiskDataBase(ip);
        if (highRisk) {
            const ratio = Math.min(highRisk.score / config.banScore, 1);
            score += Math.round(enableKnownBadIpsCheck.highRiskPenalty * ratio);
            reasons.push('PREVIOUSLY_HIGH_RISK_IP');
        }

        return { score, reasons };
    }
}

CheckerRegistry.register(new KnownBadIps());