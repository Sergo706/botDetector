import { getBotDetectorConfig } from '../config/secret.js';

let loggerLvl: string;

export function getLogLvl() {
  if (loggerLvl) return loggerLvl;
  const { logLevel } = getBotDetectorConfig();
  loggerLvl = logLevel!;
  return loggerLvl;
}