import { runGeneration } from '~~/src/botDetector/db/generator.js';
import { DataSources } from '~~/src/botDetector/helpers/mmdbDataReaders.js';
import { seedBannedRow, deleteBanned, seedVisitorWithReputation, deleteVisitor } from './database-utils.js';

export const BANNED_ROWS: Array<[string, string, string, string, number]> = [
 ['192.0.2.10', 'testland', 'EvilBot/1.0', '["FIREHOL_L1_THREAT"]',40],
 ['192.0.2.11', 'testland', 'EvilBot/2.0', '["PROXY_DETECTED"]', 25],
 ['192.0.2.12', 'testland', 'Scraper/3.0', '["FIREHOL_L1_THREAT","PROXY_DETECTED"]', 55],
 ['192.0.2.13', 'testland', 'EvilBot/1.0', '["TOR_EXIT_NODE"]',  60],
 ['192.0.2.14', 'testland', 'Crawler/1.0', '["HONEYPOT_PATH_HIT"]', 10],
 ['192.0.2.15', 'otherbad', 'Bot/1.0', '["ASN_HOSTING_CLASSIFIED"]', 15],
 ['192.0.2.16', 'otherbad', 'Curl/7.0', '["CLI_OR_LIBRARY"]',100],
 ['192.0.2.17', 'otherbad', 'Puppet/1.0', '["HEADLESS_BROWSER_DETECTED"]', 30],
 ['192.0.2.18', 'testland', 'EvilBot/1.0', '["BEHAVIOR_TOO_FAST"]', 20],
 ['192.0.2.19', 'testland', 'Harvester/1.0', '["FIREHOL_L1_THREAT"]', 45],
];

export const BANNED_IPS = BANNED_ROWS.map(r => r[0]);

export const HIGH_RISK_IPS = ['203.0.113.200', '203.0.113.201', '203.0.113.202'];
export const HIGH_RISK_SCORES = [75, 85, 95];

const SEED_HR_COOKIES = HIGH_RISK_IPS.map((_, i) => `mmdb-seed-risk-${i}`);


export async function populateTestMmdb(): Promise<DataSources> {
    for (const [ip, country, ua, reason, score] of BANNED_ROWS) {
        await seedBannedRow(ip, country, ua, reason, score);
    }
    for (let i = 0; i < HIGH_RISK_IPS.length; i++) {
        await seedVisitorWithReputation(SEED_HR_COOKIES[i], 0, HIGH_RISK_SCORES[i], HIGH_RISK_IPS[i]);
    }

    await runGeneration();

    for (const ip of BANNED_IPS) {
        await deleteBanned(ip, 'ip');
    }
    
    for (const cookie of SEED_HR_COOKIES) {
        await deleteVisitor(cookie);
    }

    return DataSources.initialize();
}
