import { BanReasonCode, IBotChecker } from '../types/checkersTypes.js';
import { BotDetectorConfig } from '../types/configSchema.js';
import { ValidationContext } from '../types/botDetectorTypes.js';
import { CheckerRegistry } from './CheckerRegistry.js';
import { getDataSources } from '../config/config.js';

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'] as const;
type Severity = typeof SEVERITY_ORDER[number];
let patterns: { rx: RegExp; severity: Severity }[] = [];

export function loadUaPatterns(): void {
    const db = getDataSources().getUserAgentLmdb();
    const bucketStrings = new Map<Severity, string[]>(
        SEVERITY_ORDER.map(sev => [sev, []])
    );

    for (const { value } of db.getRange({ limit: 10_000 })) {
        const sev = value.metadata_severity as Severity;
        bucketStrings.get(sev)?.push(value.useragent_rx);
    }

    patterns = SEVERITY_ORDER.map(severity => {
        const patterns = bucketStrings.get(severity) ?? [];
        if (patterns.length === 0) return null;
        
        const combined = patterns.map(p => `(?:${p})`).join('|');
        return {
            rx: new RegExp(combined, 'i'),
            severity
        };
    }).filter((p): p is { rx: RegExp; severity: Severity } => p !== null);
}

export class BadUaChecker implements IBotChecker<BanReasonCode> {
  name = 'Bad User Agent list';
  phase = 'heavy' as const;

  isEnabled(config: BotDetectorConfig) {
    return config.checkers.knownBadUserAgents.enable;
  }

  run(ctx: ValidationContext, config: BotDetectorConfig) {
    const { knownBadUserAgents } = config.checkers;
    const reasons: 'BAD_UA_DETECTED'[] = [];
    let score = 0;

    if (!knownBadUserAgents.enable) return { score, reasons };

    if (patterns.length === 0) {
        loadUaPatterns();
    }

    const rawUa = ctx.req.get('User-Agent') ?? '';
    for (const { rx, severity } of patterns) {
      if (rx.test(rawUa)) {
        reasons.push('BAD_UA_DETECTED');
        switch (severity) {
          case 'critical': score += knownBadUserAgents.penalties.criticalSeverity; break;
          case 'high': score += knownBadUserAgents.penalties.highSeverity; break;
          case 'medium': score += knownBadUserAgents.penalties.mediumSeverity; break;
          case 'low': score += knownBadUserAgents.penalties.lowSeverity; break;
        }
        break;
      }
    }
    return { score, reasons };
  }
}

CheckerRegistry.register(new BadUaChecker());