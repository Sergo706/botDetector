import type { IBotChecker, BanReasonCode } from '../types/checkersTypes.js';
import type { BotDetectorConfig } from '../types/configSchema.js';

let registeredCheckers: IBotChecker<BanReasonCode>[] = [];

export const CheckerRegistry = {
  register(checker: IBotChecker<BanReasonCode>) {
    console.log(`Loaded plugin: ${checker.name}`);
    registeredCheckers.push(checker);
  },

  getEnabled(phase: 'cheap' | 'heavy', config: BotDetectorConfig): IBotChecker<BanReasonCode>[] {
    return registeredCheckers.filter(
      checker => checker.phase === phase && checker.isEnabled(config)
    );
  },

  clear() {
    registeredCheckers = [];
  },
};
