import { ValidationContext } from "../types/botDetectorTypes.js";
import { BanReasonCode, IBotChecker } from "../types/checkersTypes.js";
import { BotDetectorConfig } from "../types/configSchema.js";
import { CheckerRegistry } from "./CheckerRegistry.js";

export class TimezoneConsistencyChecker implements IBotChecker<BanReasonCode> {
    name = 'Timezone Consistency';
    phase = 'cheap' as const;

    isEnabled(config: BotDetectorConfig): boolean {
        return config.checkers.enableTimezoneConsistency.enable;
    }

    run(ctx: ValidationContext, config: BotDetectorConfig) {
        const checkConfig = config.checkers.enableTimezoneConsistency;
        const reasons: BanReasonCode[] = [];
        let score = 0;

        if (!checkConfig.enable) return { score, reasons };

        const geoTimezone = ctx.geoData.timezone?.toLowerCase();
        if (!geoTimezone) return { score, reasons };

        const tzHeader = ctx.req.get('Sec-CH-UA-Timezone') ?? ctx.req.get('X-Timezone');
        if (tzHeader && tzHeader.toLowerCase() !== geoTimezone) {
            score += checkConfig.penalties;
            reasons.push('TZ_HEADER_GEO_MISMATCH');
        }

        return { score, reasons };
    }
}
CheckerRegistry.register(new TimezoneConsistencyChecker());
