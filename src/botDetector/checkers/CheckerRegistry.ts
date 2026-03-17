import { IBotChecker } from '../types/checkersTypes.js';
import { BotDetectorConfig } from '../types/configSchema.js';

export class CheckerRegistry {
  private static registeredCheckers: IBotChecker<any>[] = [];

  static register(checker: IBotChecker<any>) {
    console.log(`Loaded plugin: ${checker.name}`);
    this.registeredCheckers.push(checker);
  }

  static getEnabled(phase: 'cheap' | 'heavy', config: BotDetectorConfig): IBotChecker<any>[] {
    return this.registeredCheckers.filter(
      checker => checker.phase === phase && checker.isEnabled(config)
    );
  }

  static clear() {
    this.registeredCheckers = [];
  }
  
}
