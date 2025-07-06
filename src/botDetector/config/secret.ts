import { BotDetectorConfig } from '../types/config.js';


let cfg: BotDetectorConfig | undefined;

export function initBotDetector(config: BotDetectorConfig): void {
  if (!config.store)      throw new Error('BotDetector: db.host is required');
  if (!config.telegram?.token)
    throw new Error('BotDetector: telegram.token is required');

  cfg = Object.freeze(config);   
}


export function getBotDetectorConfig(): BotDetectorConfig {
  if (!cfg) {
    throw new Error(
      'BotDetector: initBotDetector() must be called once in app start-up'
    );
  }
  return cfg;
}