let cfg;
export function initBotDetector(config) {
    if (!config.store?.host)
        throw new Error('BotDetector: db.host is required');
    if (!config.telegram?.token)
        throw new Error('BotDetector: telegram.token is required');
    cfg = Object.freeze(config);
}
export function getBotDetectorConfig() {
    if (!cfg) {
        throw new Error('BotDetector: initBotDetector() must be called once in app start-up');
    }
    return cfg;
}
