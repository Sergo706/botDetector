import { ValidationContext } from "../types/botDetectorTypes.js";
import { BanReasonCode, IBotChecker } from "../types/checkersTypes.js";
import { BotDetectorConfig } from "../types/configSchema.js";
import { CheckerRegistry } from "./CheckerRegistry.js";

export class TorAnalysisChecker implements IBotChecker<BanReasonCode> {
    name = 'Tor Node Analysis';
    phase = 'cheap' as const;

    isEnabled(config: BotDetectorConfig): boolean {
        return config.checkers.enableTorAnalysis.enable;
    }

    private parseFlags(flags: string | undefined): Set<string> {
        if (!flags) return new Set();
        return new Set(flags.split(',').map(f => f.trim()));
    }


    private canExitWebTraffic(summary: string | undefined): boolean {
        if (!summary) return false;
        try {
            const policy = JSON.parse(summary) as { accept?: string[]; reject?: string[] };

            const coversWebPort = (entry: string): boolean => {
                if (entry === '80' || entry === '443') return true;
                if (entry.includes('-')) {
                    const [lo, hi] = entry.split('-').map(Number);
                    return (lo <= 80 && 80 <= hi) || (lo <= 443 && 443 <= hi);
                }
                return false;
            };

            if (policy.accept) {
                return policy.accept.some(coversWebPort);
            }

            if (policy.reject) {
                return !policy.reject.some(coversWebPort);
            }
        } catch {}
        
        return false;
    }

    run(ctx: ValidationContext, config: BotDetectorConfig) {
        const checkConfig = config.checkers.enableTorAnalysis;
        const reasons: BanReasonCode[] = [];
        let score = 0;

        if (!checkConfig.enable) return { score, reasons };
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!ctx.tor || Object.keys(ctx.tor).length === 0) return { score, reasons };

        const { penalties } = checkConfig;
        const {
            running,
            exit_addresses,
            flags,
            recommended_version,
            version_status,
            exit_probability,
            exit_policy_summary,
            guard_probability,
        } = ctx.tor;

        const flagSet = this.parseFlags(flags);

        if (running) {
            score += penalties.runningNode;
            reasons.push('TOR_ACTIVE_NODE');
        }

        const isExitNode = (exit_addresses && exit_addresses.length > 0) ?? flagSet.has('Exit');
        if (isExitNode) {
            score += penalties.exitNode + Math.ceil((exit_probability ?? 0) * 30);
            reasons.push('TOR_EXIT_NODE');

            if (this.canExitWebTraffic(exit_policy_summary)) {
                score += penalties.webExitCapable;
                reasons.push('TOR_WEB_EXIT_CAPABLE');
            }
        }

        if (flagSet.has('BadExit')) {
            score += penalties.badExit;
            reasons.push('TOR_BAD_EXIT');
        }

        if (flagSet.has('Guard') || (guard_probability ?? 0) > 0) {
            score += penalties.guardNode;
            reasons.push('TOR_GUARD_NODE');
        }

        if (recommended_version === false || version_status === 'obsolete') {
            score += penalties.obsoleteVersion;
            reasons.push('TOR_OBSOLETE_VERSION');
        }

        return { score, reasons };
    }
}

CheckerRegistry.register(new TorAnalysisChecker());