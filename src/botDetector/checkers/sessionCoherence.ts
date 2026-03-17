import { ValidationContext } from "../types/botDetectorTypes.js";
import { BanReasonCode, IBotChecker } from "../types/checkersTypes.js";
import { BotDetectorConfig } from "../types/configSchema.js";
import { CheckerRegistry } from "./CheckerRegistry.js";
import { sessionCache } from "../helpers/cache/sessionCache.js";

export class SessionCoherenceChecker implements IBotChecker<BanReasonCode> {
    name = 'Session Coherence';
    phase = 'cheap' as const;

    isEnabled(config: BotDetectorConfig): boolean {
        return config.checkers.enableSessionCoherence.enable;
    }

    run(ctx: ValidationContext, config: BotDetectorConfig) {
        const checkConfig = config.checkers.enableSessionCoherence;
        const reasons: BanReasonCode[] = [];
        let score = 0;

        if (checkConfig.enable === false) return { score, reasons };
        if (!ctx.cookie) return { score, reasons };

        const currentPath = ctx.req.path;
        const refererHeader = ctx.req.get('Referer');
        const cached = sessionCache.get(ctx.cookie);

        if (cached && refererHeader) {
            try {
                const refererPath = new URL(refererHeader).pathname;
                if (refererPath !== cached.lastPath) {
                    score += checkConfig.penalties;
                    reasons.push('SESSION_COHERENCE_VIOLATION');
                }
            } catch {
            }
        }

        sessionCache.set(ctx.cookie, { lastPath: currentPath });
        return { score, reasons };
    }
}

CheckerRegistry.register(new SessionCoherenceChecker());
