import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from './http-app.js';
import { getBatchQueue } from '~~/src/botDetector/config/config.js';
import { getBanned } from '../test-utils/database-utils.js';
import { BROWSER_HEADERS, extractCanary } from '../test-utils/test-utils.js';
import { defaultSettings } from '../config.js';
import { configuration } from '~~/src/botDetector/config/config.js';
import { run } from '@riavzon/utils/server';

import http from 'http';

const app = createApp();
const CLEAN_IP = '89.139.83.137';
let server: http.Server;


beforeAll(async () => {
    server = await new Promise((resolve, reject) => {
        const serv = app.listen(0, () => resolve(serv));
        serv.on('error', reject);
    });
});

afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await run('python3 scripts/benchmark.py')
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
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
            request(server)
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

    it('blocks all 300 unique ip bot requests and writes banned rows', { timeout: 120_000 }, async () => {
        const results = await fireRequests(300, (i) =>
            request(server)
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
            expect(banned).toBeDefined();
            expect(banned.canary_id).toBe(canary);
        }
    });

    it('each banned bot has a reason array with at least one entry', async () => {
        const results = await fireRequests(20, (i) =>
            request(server)
                .get('/check')
                .set('User-Agent', BOT_UAS[i % BOT_UAS.length])
                .set('X-Forwarded-For', `10.99.${(i >> 8) & 0xff}.${i & 0xff}`),
        );

        await getBatchQueue().flush();

        for (const r of results.slice(0, 10)) {
            const canary = extractCanary(r);
            const banned = await getBanned(canary);
            expect(banned).toBeDefined();
            const reasons = JSON.parse(banned.reason);
            expect(Array.isArray(reasons)).toBe(true);
            expect(reasons.length).toBeGreaterThan(0);
        }
    });
});


describe('ddos simulation, single ip rapid fire', { timeout: 60_000 }, () => {
    it('handles 300 requests from a single ip without crashing', async () => {
        const results = await fireRequests(300, () =>
            request(server)
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
            const req = request(server)
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

describe('behavior rate', { timeout: 120_000 }, () => {
    afterEach(async () => {
        await configuration(defaultSettings);
    });

    it('blocks 5 returning visitors that exceed the request threshold', async () => {
        await configuration({
            ...defaultSettings,
            checkers: {
                ...defaultSettings.checkers,
                enableBehaviorRateCheck: {
                    enable: true,
                    behavioral_threshold: 10,
                    behavioral_window: 60_000,
                    penalties: 100,
                },
            },
        });

        const VISITORS = 5;
        const THRESHOLD_BREACH = 15;
        const activeSessions = [];

        for (let i = 0; i < VISITORS; i++) {
            const res = await request(server)
                .get('/check')
                .set(BROWSER_HEADERS)
                .set('X-Forwarded-For', CLEAN_IP); 
            
            activeSessions.push({
                cookie: res.headers['set-cookie'],
                canaryId: extractCanary(res)
            });
        }

        const promises = [];
        for (const session of activeSessions) {
            for (let r = 0; r < THRESHOLD_BREACH; r++) {
                promises.push(
                    request(server)
                        .get('/check')
                        .set(BROWSER_HEADERS)
                        .set('X-Forwarded-For', CLEAN_IP)
                        .set('Cookie', session.cookie ?? [])
                );
            }
        }
        await Promise.all(promises);

        await new Promise(resolve => setImmediate(resolve));
        await getBatchQueue().flush();

        for (const session of activeSessions) {
            const banned = await getBanned(session.canaryId);
            expect(banned).toBeDefined();
            const reasons = JSON.parse(banned.reason);
            expect(reasons).toContain('BEHAVIOR_TOO_FAST');
        }
        
    });


    it('handles 100 visitors making 5 requests every second over 3 seconds', async () => {
        const VISITORS = 100;
        const REQ_PER_SEC = 5;
        const SECONDS = 3;
        const activeSessions = [];

        for (let i = 0; i < VISITORS; i++) {
            const res = await request(server)
                .get('/check')
                .set(BROWSER_HEADERS)
                .set('X-Forwarded-For', CLEAN_IP);
            
            activeSessions.push({
                ip: CLEAN_IP,
                cookie: res.headers['set-cookie']
            });
        }

        for (let s = 0; s < SECONDS; s++) {
            const promises = [];
            for (const session of activeSessions) {
                for (let r = 0; r < REQ_PER_SEC; r++) {
                    promises.push(
                        request(server)
                            .get('/check')
                            .set(BROWSER_HEADERS)
                            .set('X-Forwarded-For', session.ip)
                            .set('Cookie', session.cookie ?? [])
                    );
                }
            }
            
            const results = await Promise.all(promises);
            const count403 = results.filter(r => r.status === 403).length;
            expect(count403).toBe(0);

            const validStatuses = results.every(r => r.status === 200);
            expect(validStatuses).toBe(true);

            if (s < SECONDS - 1) {
                await sleep(1000);
            }
        }

        await new Promise(resolve => setImmediate(resolve));
        await getBatchQueue().flush();
    });
});

describe('explosions', () => {
    it('ua explosion', { timeout: 120_000 }, async () => {
        const evilUA = 'A'.repeat(1000) + 'curl'.repeat(100);
    
        const results = await fireRequests(500, (i) =>
            request(server) 
                .get('/check')
                .set('User-Agent', evilUA)
                .set('X-Forwarded-For', `10.${(i >> 16) & 0xff}.${(i >> 8) & 0xff}.${i & 0xff}`)
        );
    
        expect(results.length).toBe(500);
        const blocked = results.filter(r => r.status === 403).length;
        expect(blocked).toBeGreaterThan(400);
    });

    it('cache bypass', { timeout: 120_000 }, async () => {
        const results = await fireRequests(1000, (i) =>
            request(server)
                .get('/check')
                .set(BROWSER_HEADERS)
                .set('X-Forwarded-For', `100.${(i >> 16) & 0xff}.${(i >> 8) & 0xff}.${i & 0xff}`)
        );
    
        expect(results.length).toBe(1000);
        expect(results.every(r => [200, 403].includes(r.status))).toBe(true);
    });

    it('batch queue overwrite race', { timeout: 120_000 }, async () => {
        const sessions = await fireRequests(50, () => 
            request(server).get('/check').set(BROWSER_HEADERS).set('X-Forwarded-For', CLEAN_IP)
        );

        const cookies = sessions.map(res => res.headers['set-cookie'] as unknown as string[]);
    
        const flatTaskGenerator = cookies.flatMap(cookie => 
            Array.from({ length: 20 }, () => cookie)
        );
        const results = await fireRequests(flatTaskGenerator.length, (i) => 
            request(server)
                .get('/check')
                .set(BROWSER_HEADERS)
                .set('Cookie', flatTaskGenerator[i] || [])
                .set('X-Forwarded-For', CLEAN_IP)
        );
    
        expect(results.length).toBe(1000);
        expect(results.every(r => [200, 403].includes(r.status))).toBe(true);
    });

    it('event loop', { timeout: 120_000 }, async () => {
        const start = Date.now();
        
        const results = await fireRequests(1000, () => 
            request(server)
                .get('/check')
                .set('User-Agent', 'Shit'.repeat(100))
                .set('X-Forwarded-For', '10.10.10.10')
        );
    
        const duration = Date.now() - start;
        expect(duration).toBeLessThan(15000);
        expect(results.length).toBe(1000);
    });

    it('velocity fingerprint poisoning', { timeout: 120_000 }, async () => {
        const res = await request(server)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);
    
        const cookie = res.headers['set-cookie'] as unknown as string[];
        let lastStatus = 200;
    
        for (let i = 0; i < 50; i++) { 
            await sleep(i % 2 === 0 ? 50 : 250);
    
            const r = await request(server)
                .get('/check')
                .set(BROWSER_HEADERS)
                .set('Cookie', cookie || [])
                .set('X-Forwarded-For', CLEAN_IP);
    
            lastStatus = r.status;
        }
        expect([200, 403]).toContain(lastStatus);
    });

    it('session graph', { timeout: 120_000 }, async () => {
        const res = await request(server)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);
    
        const cookie = res.headers['set-cookie'] as unknown as string[];
    
        const results = await fireRequests(300, (i) => 
            request(server)
                .get(`/page-${i}`)
                .set(BROWSER_HEADERS)
                .set('Referer', `/page-${Math.floor(Math.random() * 300)}`)
                .set('Cookie', cookie || [])
                .set('X-Forwarded-For', CLEAN_IP)
        );
    
        expect(results.length).toBe(300);
    });

    it('long running chaos', { timeout: 180_000 }, async () => {
        let lastMemory = process.memoryUsage().heapUsed;
        const CHUNK_SIZE = 1000;
        const TOTAL_CHUNKS = 3; 
    
        for (let chunk = 0; chunk < TOTAL_CHUNKS; chunk++) {
            await fireRequests(CHUNK_SIZE, (i) => {
                const index = chunk * CHUNK_SIZE + i;
                return request(server)
                    .get('/check')
                    .set(BROWSER_HEADERS)
                    .set('X-Forwarded-For', `10.${(index >> 16) & 0xff}.${(index >> 8) & 0xff}.${index & 0xff}`);
            });
    
            await sleep(50); 
            
            const mem = process.memoryUsage().heapUsed;
            
            expect(mem).toBeLessThan(lastMemory * 3);
            lastMemory = mem;
        }
    });
    
})
