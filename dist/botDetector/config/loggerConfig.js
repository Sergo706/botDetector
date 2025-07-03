import { getBotDetectorConfig } from '../config/secret.js';
let loggerLvl;
export function getLogLvl() {
    if (loggerLvl)
        return loggerLvl;
    const { logLevel } = getBotDetectorConfig();
    loggerLvl = logLevel;
    return loggerLvl;
}
