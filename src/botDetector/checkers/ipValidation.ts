import { isIP } from 'node:net';
import { IBotChecker } from '../types/checkersTypes.js';
import { ValidationContext } from '../types/botDetectorTypes.js';
import { BotDetectorConfig } from '../types/configSchema.js';
import { CheckerRegistry } from './CheckerRegistry.js';

export class IpChecker implements IBotChecker<'IP_INVALID'> {
  name = 'IP Validation';
  phase = 'cheap' as const;

  isEnabled(config: BotDetectorConfig): boolean {
    return config.checkers.enableIpChecks.enable;
  }

  async run(ctx: ValidationContext, config: BotDetectorConfig) {
    const isValid = isIP(ctx.ipAddress) !== 0;
    if (!isValid) {
      console.log('Entered Ban from ip validation Helper');
    }
    return {
      score: isValid ? 0 : config.banScore,
      reasons: isValid ? [] : ['IP_INVALID' as const]
    };
  }
}

CheckerRegistry.register(new IpChecker());
