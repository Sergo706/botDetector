import express from 'express';
import cookieParser from 'cookie-parser';
import router from '~~/src/botDetector/routes/visitorLog.js';

export function createApp() {
    const app = express();
    app.set('trust proxy', true);
    app.use(cookieParser());
    app.use(router);
    return app;
}
