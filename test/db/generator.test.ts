import { it, describe, expect, beforeAll, afterAll } from 'vitest';
import { runGeneration } from '~~/src/botDetector/db/generator.js';
import { DataSources } from '~~/src/botDetector/helpers/mmdbDataReaders.js';
import { getConfiguration, getDb } from '~~/src/botDetector/config/config.js';
import { prep } from '~~/src/botDetector/db/dialectUtils.js';
import { seedBannedRow, deleteBanned, seedVisitorWithReputation, deleteVisitor } from '../test-utils/database-utils.js';
import { BANNED_ROWS, BANNED_IPS, HIGH_RISK_IPS, HIGH_RISK_SCORES } from '../test-utils/mmdb-seed.js';



const HIGH_RISK_COOKIES = HIGH_RISK_IPS.map((_, i) => `gen-test-risk-${i}-${Date.now()}`);
const BELOW_THRESHOLD_COOKIE = 'gen-test-below-' + Date.now();
const BELOW_THRESHOLD_IP = '203.0.113.210';
const BELOW_THRESHOLD_SCORE = 30;
let fresh: DataSources;

beforeAll(async () => {
    for (const [ip, country, ua, reason, score] of BANNED_ROWS) {
        await seedBannedRow(ip, country, ua, reason, score);
    }
    for (let i = 0; i < HIGH_RISK_COOKIES.length; i++) {
        await seedVisitorWithReputation(HIGH_RISK_COOKIES[i], 0, HIGH_RISK_SCORES[i], HIGH_RISK_IPS[i]);
    }
    await seedVisitorWithReputation(BELOW_THRESHOLD_COOKIE, 0, BELOW_THRESHOLD_SCORE, BELOW_THRESHOLD_IP);

    await runGeneration();
    fresh = await DataSources.initialize();
});

afterAll(async () => {
    for (const ip of BANNED_IPS) {
        await deleteBanned(ip, 'ip');
    }
    for (const cookie of [...HIGH_RISK_COOKIES, BELOW_THRESHOLD_COOKIE]) {
        await deleteVisitor(cookie);
    }
});


describe('Generator buildBannedMmdb', () => {
    it('all 10 seeded IPs are findable in banned.mmdb', () => {
        for (const ip of BANNED_IPS) {
            const record = fresh.bannedDataBase(ip);
            expect(record, `Expected ${ip} to be in banned.mmdb`).not.toBeNull();
        }
    });

    it('BannedRecord score maps correctly from the banned table', () => {
        const record = fresh.bannedDataBase('192.0.2.10');
        expect(record).not.toBeNull();
        expect(record!.score).toBe(40);
    });

    it('BannedRecord country maps correctly', () => {
        const record = fresh.bannedDataBase('192.0.2.10');
        expect(record!.country).toBe('testland');
    });

    it('BannedRecord userAgent maps from user_agent column', () => {
        const record = fresh.bannedDataBase('192.0.2.10');
        expect(record!.userAgent).toBe('EvilBot/1.0');
    });

    it('BannedRecord reason is stored as the original JSON string', () => {
        const record = fresh.bannedDataBase('192.0.2.10');
        expect(record!.reason).toBe('["FIREHOL_L1_THREAT"]');
    });

    it('multi reason record stores the full JSON array string', () => {
        const record = fresh.bannedDataBase('192.0.2.12');
        expect(record!.reason).toBe('["FIREHOL_L1_THREAT","PROXY_DETECTED"]');
    });

    it('high score ip maps correctly', () => {
        const record = fresh.bannedDataBase('192.0.2.16');
        expect(record!.score).toBe(100);
        expect(record!.userAgent).toBe('Curl/7.0');
    });
});

describe('Generator buildHighRiskMmdb', () => {
    it('all 3 high risk visitor ips are findable in highRisk.mmdb', () => {
        for (const ip of HIGH_RISK_IPS) {
            const record = fresh.highRiskDataBase(ip);
            expect(record, `Expected ${ip} to be in highRisk.mmdb`).not.toBeNull();
        }
    });

    it('HighRiskRecord score maps from suspicious_activity_score', () => {
        const record = fresh.highRiskDataBase('203.0.113.200');
        expect(record).not.toBeNull();
        expect(record!.score).toBe(75);
    });

    it('HighRiskRecord browser field maps correctly', () => {
        const record = fresh.highRiskDataBase('203.0.113.200');
        expect(record!.browser).toBe('Chrome');
    });

    it('HighRiskRecord proxy is a boolean', () => {
        const record = fresh.highRiskDataBase('203.0.113.200');
        expect(typeof record!.proxy).toBe('boolean');
        expect(record!.proxy).toBe(false);
    });

    it('HighRiskRecord hosting is a boolean', () => {
        const record = fresh.highRiskDataBase('203.0.113.200');
        expect(typeof record!.hosting).toBe('boolean');
        expect(record!.hosting).toBe(false);
    });

    it('firstSeen is an iso date string', () => {
        const record = fresh.highRiskDataBase('203.0.113.200');
        expect(record!.firstSeen).not.toBeNull();
        expect(typeof record!.firstSeen).toBe('string');
        expect(record!.firstSeen!).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('lastSeen is an iso date string', () => {
        const record = fresh.highRiskDataBase('203.0.113.201');
        expect(record!.lastSeen).not.toBeNull();
        expect(typeof record!.lastSeen).toBe('string');
    });

    it('visitor below scoreThreshold is NOT included in highRisk.mmdb', () => {
        const record = fresh.highRiskDataBase(BELOW_THRESHOLD_IP);
        expect(record).toBeNull();
    });
});

describe('Generator deleteAfterBuild', () => {

    it('banned rows are removed after generation when deleteAfterBuild=true', async () => {
        const deleteIp = '192.0.2.123';
        await seedBannedRow(deleteIp, 'testland', 'Bot/1.0', '["FIREHOL_L1_THREAT"]', 40);

        const cfg = getConfiguration();
        (cfg.generator as any).deleteAfterBuild = true;
        await runGeneration();
        (cfg.generator as any).deleteAfterBuild = false;
        new Promise(resolve => setTimeout(resolve, 200))
        const rows = await prep(getDb(), `SELECT ip_address FROM banned WHERE ip_address = ?`).all(deleteIp) as any[];
        expect(rows).toHaveLength(0);
    });

    it('high risk visitor rows are removed after generation when deleteAfterBuild=true', async () => {
        const deleteIp = '192.0.2.52';
        const deleteCookie = 'gen-del-hr-' + Date.now();
        await seedVisitorWithReputation(deleteCookie, 0, 80, deleteIp);

        const cfg = getConfiguration();
        (cfg.generator as any).deleteAfterBuild = true;
        await runGeneration();
        (cfg.generator as any).deleteAfterBuild = false;

        const rows = await prep(getDb(), `SELECT ip_address FROM visitors WHERE ip_address = ?`).all(deleteIp) as any[];
        expect(rows).toHaveLength(0);
    });

    it('banned rows are NOT removed when deleteAfterBuild=false', async () => {
        const keepIp = '192.0.2.51';
        await seedBannedRow(keepIp, 'testland', 'Bot/1.0', '["FIREHOL_L1_THREAT"]', 40);

        const cfg = getConfiguration();
        (cfg.generator as any).deleteAfterBuild = false;
        await runGeneration();

        const rows = await prep(getDb(), `SELECT ip_address, score FROM banned WHERE ip_address = ?`).all(keepIp) as any[];
        expect(rows).toHaveLength(1);
        expect(rows[0].ip_address).toBe(keepIp);
        expect(rows[0].score).toBe(40);

        await deleteBanned(keepIp, 'ip');
    });

    it('high risk visitor rows are NOT removed when deleteAfterBuild=false', async () => {
        const keepIp = '192.0.2.53';
        const keepCookie = 'gen-keep-hr-' + Date.now();
        await seedVisitorWithReputation(keepCookie, 0, 80, keepIp);

        const cfg = getConfiguration();
        (cfg.generator as any).deleteAfterBuild = false;
        await runGeneration();

        const rows = await prep(getDb(), `SELECT ip_address, suspicious_activity_score FROM visitors WHERE ip_address = ?`).all(keepIp) as any[];
        expect(rows).toHaveLength(1);
        expect(rows[0].ip_address).toBe(keepIp);
        expect(rows[0].suspicious_activity_score).toBe(80);

        await deleteBanned(keepIp, 'ip');
    });
});
