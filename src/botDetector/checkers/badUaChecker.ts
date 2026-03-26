import { BanReasonCode, IBotChecker } from '../types/checkersTypes.js';
import { BotDetectorConfig } from '../types/configSchema.js';
import { ValidationContext } from '../types/botDetectorTypes.js';
import { CheckerRegistry } from './CheckerRegistry.js';
import { getRange, UserAgentRecord } from '@riavzon/shield-base';
import { resolveDataPath } from '../db/findDataPath.js';


export class BadUaChecker implements IBotChecker<BanReasonCode> {
  name = 'Bad User Agent list';
  phase = 'cheap' as const;

  private patterns: { rx: RegExp; severity: string }[] = [];

  public loadUaPatterns(): void {
      const dbPath = resolveDataPath('useragent-db/useragent.mdb');
      const rows = getRange<UserAgentRecord>(dbPath, 'useragent', 10_000);

      console.log('Called loadUaPatterns');
      this.patterns = rows
          .filter(({ data }) => data.metadata_severity !== 'none')
          .map(({ data }) => ({
              rx: new RegExp(data.useragent_rx, 'i'),
              severity: data.metadata_severity,
          }));
  }

  isEnabled(config: BotDetectorConfig) {
    return config.checkers.knownBadUserAgents.enable;
  }


  run(ctx: ValidationContext, config: BotDetectorConfig) {
    const { knownBadUserAgents } = config.checkers;
    const reasons: 'BAD_UA_DETECTED'[] = [];
    let score = 0;

    if (!knownBadUserAgents.enable) return { score, reasons };

    if (this.patterns.length === 0) {
        this.loadUaPatterns();
    }
    
    const rawUa = ctx.req.get('User-Agent') ?? '';
    for (const { rx, severity } of this.patterns) {
      if (rx.test(rawUa)) {
        reasons.push('BAD_UA_DETECTED');
        
        switch(severity) {
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