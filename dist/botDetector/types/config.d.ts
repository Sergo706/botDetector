export interface BotDetectorConfig {
    store: {
        host: string;
        port: number;
        user: string;
        password: string;
        name: string;
    };
    telegram: {
        token: string;
        allowedUser?: string;
        chatID?: string;
    };
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
}
