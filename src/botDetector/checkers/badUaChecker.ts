import { BanReasonCode, IBotChecker } from '../types/checkersTypes.js';
import { BotDetectorConfig } from '../types/configSchema.js';
import { ValidationContext } from '../types/botDetectorTypes.js';
import { CheckerRegistry } from './CheckerRegistry.js';
import { getDb } from '../config/config.js';


export class BadUaChecker implements IBotChecker<BanReasonCode> {
  name = 'Bad User Agent list'
  phase = 'heavy' as const

  private patterns: { rx: RegExp; severity: string }[] = [];

  public async loadUaPatterns(): Promise<void> {
      const db = getDb();

      const sql = 
        `SELECT http_user_agent, metadata_severity
          FROM user_agent_metadata
          WHERE metadata_severity IN ('low','medium','high','critical');`;

      const rows = await db.prepare(sql).all() as { http_user_agent: string; metadata_severity: string }[];
      
      console.log('Called loadUaPatterns')
      this.patterns = (rows).map(r => {
        const escaped = r.http_user_agent
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace(/\\\*/g, '.*'); 
        return { rx: new RegExp(`^${escaped}$`, 'i'), severity: r.metadata_severity };
      });
}

  isEnabled(config: BotDetectorConfig) {
    return config.checkers.knownBadUserAgents.enable;
  }


  async run(ctx: ValidationContext, config: BotDetectorConfig) {
    const { knownBadUserAgents } = config.checkers;
    const reasons: 'BAD_UA_DETECTED'[] = [];
    let score = 0;

    if (knownBadUserAgents.enable === false) return { score, reasons };

    if (this.patterns.length === 0) {
        await this.loadUaPatterns();
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