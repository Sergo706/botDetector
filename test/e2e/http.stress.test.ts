import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './http-app.js';
import { getBatchQueue } from '~~/src/botDetector/config/config.js';
import { getBanned } from '../test-utils/database-utils.js';
import { BROWSER_HEADERS, extractCanary } from '../test-utils/test-utils.js';

const app = createApp();
const CLEAN_IP = '89.139.83.137';

async function fireRequests(
    count: number,
    buildReq: (i: number) => request.Test,
): Promise<request.Response[]> {
    const BATCH = 50;
    const results: request.Response[] = [];
    for (let start = 0; start < count; start += BATCH) {
        const end = Math.min(start + BATCH, count);
        const batch = [];
        for (let i = start; i < end; i++) {
            batch.push(buildReq(i));
        }
        const responses = await Promise.all(batch);
        results.push(...responses);
    }
    return results;
}


describe('high volume clean traffic', { timeout: 60_000 }, () => {
    it('handles 300 concurrent clean requests without errors or bans', async () => {
        const results = await fireRequests(300, () =>
            request(app)
                .get('/check')
                .set(BROWSER_HEADERS)
                .set('X-Forwarded-For', CLEAN_IP),
        );

        const count200 = results.filter(r => r.status === 200).length;
        const count403 = results.filter(r => r.status === 403).length;

        expect(count200).toBe(300);
        expect(count403).toBe(0);
    });
});


describe("botnet simulation, many unique ips with bot ua's", { timeout: 60_000 }, () => {
    const BOT_UAS = [
        'curl/7.0',
        'Wget/1.21',
        'python-requests/2.31.0',
        'Go-http-client/1.1',
        'Java/11.0.2',
        'libwww-perl/6.67',
        'PHP/8.1',
        'Ruby',
        'okhttp/4.12.0',
        'node-fetch/1.0',
    ];

    it('blocks all 300 unique ip bot requests and writes banned rows', async () => {
        const results = await fireRequests(300, (i) =>
            request(app)
                .get('/check')
                .set('User-Agent', BOT_UAS[i % BOT_UAS.length])
                .set('X-Forwarded-For', `10.${(i >> 16) & 0xff}.${(i >> 8) & 0xff}.${i & 0xff}`),
        );

        const count403 = results.filter(r => r.status === 403).length;
        expect(count403).toBe(300);

        await getBatchQueue().flush();

        const sampleCanaries = results.slice(0, 5).map(r => extractCanary(r));
        for (const canary of sampleCanaries) {
            const banned = await getBanned(canary);
            expect(banned).not.toBeNull();
            expect(banned.canary_id).toBe(canary);
        }
    });

    it('each banned bot has a reason array with at least one entry', async () => {
        const results = await fireRequests(20, (i) =>
            request(app)
                .get('/check')
                .set('User-Agent', BOT_UAS[i % BOT_UAS.length])
                .set('X-Forwarded-For', `10.99.${(i >> 8) & 0xff}.${i & 0xff}`),
        );

        await getBatchQueue().flush();

        for (const r of results.slice(0, 10)) {
            const canary = extractCanary(r);
            const banned = await getBanned(canary);
            expect(banned).not.toBeNull();
            const reasons = JSON.parse(banned.reason);
            expect(Array.isArray(reasons)).toBe(true);
            expect(reasons.length).toBeGreaterThan(0);
        }
    });
});


describe('ddos simulation, single ip rapid fire', { timeout: 60_000 }, () => {
    it('handles 300 rapid requests from a single IP without crashing', async () => {
        const results = await fireRequests(300, () =>
            request(app)
                .get('/check')
                .set(BROWSER_HEADERS)
                .set('X-Forwarded-For', CLEAN_IP),
        );

        const validStatuses = results.every(r => r.status === 200 || r.status === 403);
        expect(validStatuses).toBe(true);

        const count200 = results.filter(r => r.status === 200).length;
        const count403 = results.filter(r => r.status === 403).length;
        expect(count200 + count403).toBe(300);
    });

    it('mixed bot and clean traffic, bots are blocked while clean passes through', async () => {
        const results = await fireRequests(100, (i) => {
            const isBot = i % 3 === 0;
            const req = request(app)
                .get('/check')
                .set('X-Forwarded-For', CLEAN_IP);

            if (isBot) {
                return req.set('User-Agent', 'curl/7.0');
            }
            return req.set(BROWSER_HEADERS);
        });

        const botResults = results.filter((_, i) => i % 3 === 0);
        const cleanResults = results.filter((_, i) => i % 3 !== 0);

        const allBotBlocked = botResults.every(r => r.status === 403);
        const allCleanPassed = cleanResults.every(r => r.status === 200);

        expect(allBotBlocked).toBe(true);
        expect(allCleanPassed).toBe(true);
    });
});