import mysql2 from 'mysql2/promise';
export interface BotDetectorConfig {
  store: {
    main: mysql2.Pool,
  };
  telegram: {
    token:        string;
    allowedUser?: string;
    chatID?:      string;
  };
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}