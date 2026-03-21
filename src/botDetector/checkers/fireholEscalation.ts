import { ValidationContext } from "../types/botDetectorTypes.js";
import { BanReasonCode, IBotChecker } from "../types/checkersTypes.js";
import { BotDetectorConfig } from "../types/configSchema.js";
import { CheckerRegistry } from "./CheckerRegistry.js";

export class ThreatLevels implements IBotChecker<BanReasonCode> {
    name = 'Known ThreatLevels'
    phase = 'cheap' as const

    isEnabled(config: BotDetectorConfig) {
        return config.checkers.enableKnownThreatsDetections.enable;
    }
    
    async run(ctx: ValidationContext, config: BotDetectorConfig) {
        const { enableKnownThreatsDetections } = config.checkers;
        const reasons: BanReasonCode[] = [];
        let score = 0;

        if (enableKnownThreatsDetections.enable === false) return { score, reasons };
        const {anonymiseNetwork, threatLevels} = enableKnownThreatsDetections.penalties;

        if (ctx.anon) {
            score += anonymiseNetwork
            reasons.push('ANONYMITY_NETWORK')
        }

        switch (ctx.threatLevel) {
            case 1: {
                score += threatLevels.criticalLevel1
                reasons.push('FIREHOL_L1_THREAT')
                break;
            }
            case 2: {
                score += threatLevels.currentAttacksLevel2
                reasons.push('FIREHOL_L2_THREAT')
                break;
            }
            case 3: {
                score += threatLevels.threatLevel3
                reasons.push('FIREHOL_L3_THREAT')
                break;
            }

            case 4: {
                score += threatLevels.threatLevel4
                reasons.push('FIREHOL_L4_THREAT')
                break;
            }
        }

        return { score, reasons };
    }
}

CheckerRegistry.register(new ThreatLevels());