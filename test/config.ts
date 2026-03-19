import mysql2 from 'mysql2/promise'
import fs from 'node:fs'
import type { BotDetectorConfigInput } from "../src/botDetector/types/configSchema.js";




export const poolConnection = mysql2.createPool({
  host: 'localhost',
  port: 3306,
  user: 'botDetector',
  password: 'strong_password',
  database: 'botdetector',
  waitForConnections: true,
  connectionLimit: 5, 
  queueLimit: 0, 
  connectTimeout: 1000 * 30,
  infileStreamFactory: (path) => fs.createReadStream(path),
});
export const defaultSettings: BotDetectorConfigInput  = {
    store: { main: poolConnection },
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