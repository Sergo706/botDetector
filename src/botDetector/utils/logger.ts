import pino, { Logger } from 'pino';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { getConfiguration } from '../config/config.js';


const LOG_DIR = path.resolve(process.cwd(), process.env.LOG_DIR || 'bot-detector-logs');
if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });

const transport = pino.transport({
  targets: [
    {
      target: 'pino/file',
      level:  'info',
      options: {
        destination: `${LOG_DIR}/info.log`,
        mkdir: true
      }
    },
    {
      target: 'pino/file',
      level:  'warn',
      options: {
        destination: `${LOG_DIR}/warn.log`,
        mkdir: true
      }
    },
    {
      target: 'pino/file',
      level:  'error',
      options: {
        destination: `${LOG_DIR}/errors.log`,
        mkdir:true
      }
    }
  ]
});

let logger: pino.Logger;  

export function getLogger(): Logger {
  if (logger) return logger;      
  const { logLevel } = getConfiguration();
  logger = (pino) (
    {
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    mixin() { return { uptime: process.uptime() }; },
    redact: {
      paths: [
      '*.password',
       '*.email',
        'name',
        'Name',
        '*.cookies',
        '*.cookie',
        'cookies',
        'cookie',
        '*.accessToken',
        '*.refresh_token',
        '*.secret'
      ],
      censor: '[SECRET]'
     }
    },
  transport
  );
  return logger;
}