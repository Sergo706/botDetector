import fs from 'node:fs';
import type { BotDetectorConfigInput } from "../src/botDetector/types/configSchema.js";
import type { DbConfig } from "../src/botDetector/types/dbTypes.js";

export const mysqlOpts = {
  host: 'localhost',
  port: 3307,
  user: 'botDetector',
  password: 'test',
  database: 'testdb',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 1000 * 30,
  timezone: '+00:00',
  infileStreamFactory: (path: string) => fs.createReadStream(path),
};

export const dbConfig: DbConfig = { driver: 'mysql-pool', ...mysqlOpts };

export const defaultSettings: BotDetectorConfigInput = {
    store: { main: dbConfig },
    whiteList: ["172.18.0.1", "172.29.20.1", "172.21.10.1", "127.0.0.1", "172.20.5.4", "172.21.10.4", "::ffff:127.0.0.1"],
    checkers: {
        enableGeoChecks: {
            enable: true,
            bannedCountries: [
                "bangladesh", "algeria", "bahrain", "belarus", "ukraine", "russia", "china",
                "india", "pakistan", "vietnam", "chad", "brazil", "nigeria", "iran", "germany"
            ]
        }
    }
};
