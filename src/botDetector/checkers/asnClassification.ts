import { ValidationContext } from "../types/botDetectorTypes.js";
import { BanReasonCode, IBotChecker } from "../types/checkersTypes.js";
import { BotDetectorConfig } from "../types/configSchema.js";
import { CheckerRegistry } from "./CheckerRegistry.js";

export class AsnClassificationChecker implements IBotChecker<BanReasonCode> {
    name = 'ASN Classification';
    phase = 'cheap' as const;

    isEnabled(config: BotDetectorConfig): boolean {
        return config.checkers.enableAsnClassification.enable;
    }

    run(ctx: ValidationContext, config: BotDetectorConfig) {
        const checkConfig = config.checkers.enableAsnClassification;
        const reasons: BanReasonCode[] = [];
        let score = 0;

        if (!checkConfig.enable) return { score, reasons };
        const { penalties } = checkConfig;
        const { classification, hits } = ctx.bgp;

        if (!classification) {
            score += penalties.unknownClassification;
            reasons.push('ASN_CLASSIFICATION_UNKNOWN');
            return { score, reasons };
        }

        if (classification === 'Content') {
            score += penalties.contentClassification;
            reasons.push('ASN_HOSTING_CLASSIFIED');
        }

        const hitsNum = parseInt(hits ?? '', 10);
        const isLowVisibility = Number.isFinite(hitsNum) && hitsNum >= 0 && hitsNum < penalties.lowVisibilityThreshold;

        if (isLowVisibility) {
            score += penalties.lowVisibilityPenalty;
            reasons.push('ASN_LOW_VISIBILITY');
        }

        if (classification === 'Content' && isLowVisibility) {
            score += penalties.comboHostingLowVisibility;
            reasons.push('ASN_HOSTING_LOW_VISIBILITY_COMBO');
        }

        return { score, reasons };
    }
}
CheckerRegistry.register(new AsnClassificationChecker());
