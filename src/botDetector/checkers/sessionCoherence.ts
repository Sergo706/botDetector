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
        const secFetchSite = ctx.req.get('Sec-Fetch-Site');
        const currentHostname = ctx.req.hostname;
        const cached = sessionCache.get(ctx.cookie);

        const missingSameOriginReferer = secFetchSite === 'same-origin' && !refererHeader;
        const missingSubsequentReferer = cached && !refererHeader;

        if (missingSameOriginReferer || missingSubsequentReferer) {
            score += checkConfig.penalties.missingReferer;
            reasons.push('SESSION_COHERENCE_MISSING_REFERER');
        }

        else if (refererHeader) {
            try {
                const refererUrl = new URL(refererHeader);

                if (refererUrl.hostname !== currentHostname) {
                    score += checkConfig.penalties.domainMismatch;
                    reasons.push('SESSION_COHERENCE_DOMAIN_MISMATCH');
                } 

                else if (cached && refererUrl.pathname !== cached.lastPath) {
                    score += checkConfig.penalties.pathMismatch;
                    reasons.push('SESSION_COHERENCE_PATH_MISMATCH');
                }
            } catch {
                score += checkConfig.penalties.missingReferer; 
                reasons.push('SESSION_COHERENCE_INVALID_REFERER');
            }
        }

        sessionCache.set(ctx.cookie, { lastPath: currentPath });
        return { score, reasons };
    }
}

CheckerRegistry.register(new SessionCoherenceChecker());