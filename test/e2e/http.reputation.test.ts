import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from './http-app.js';
import { getConfiguration, getBatchQueue } from '~~/src/botDetector/config/config.js';
import { visitorCache } from '~~/src/botDetector/helpers/cache/cannaryCache.js';
import { reputationCache } from '~~/src/botDetector/helpers/cache/reputationCache.js';
import { deleteVisitor, deleteBanned, getVisitor, seedVisitorWithReputation } from '../test-utils/database-utils.js';
import { BROWSER_HEADERS, extractCanary } from '../test-utils/test-utils.js';

const app = createApp();
const CLEAN_IP = '89.139.83.137';

const trackedCookies: string[] = [];

function trackCanary(res: request.Response): string {
    const c = extractCanary(res);
    if (c) trackedCookies.push(c);
    return c;
}

afterEach(async () => {
    await getBatchQueue().flush();
    const batch = trackedCookies.splice(0);
    for (const c of batch) {
        await visitorCache.delete(c);
        await reputationCache.delete(c);
        await deleteBanned(c);
        await deleteVisitor(c);
    }
});


describe('reputation healing via http', () => {
    it('populates reputationCache after a clean http request', async () => {
        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = trackCanary(res);
        expect(res.status).toBe(200);

        await getBatchQueue().flush();

        const cached = await reputationCache.get(canary);
        expect(cached).not.toBeNull();
        expect(cached!.isBot).toBe(false);
        expect(typeof cached!.score).toBe('number');
    });

    it('heals a suspect score on subsequent clean requests through the middleware', async () => {
        const canary = 'rep-http-heal-' + Date.now();
        trackedCookies.push(canary);
        const cfg = getConfiguration();

        await seedVisitorWithReputation(canary, 0, 5, CLEAN_IP);
        await reputationCache.set(canary, { isBot: false, score: 5 });

        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP)
            .set('Cookie', `canary_id=${canary}`);

        expect(res.status).toBe(200);

        await getBatchQueue().flush();
        await new Promise(r => setTimeout(r, 200));

        const cached = await reputationCache.get(canary);
        expect(cached).not.toBeNull();
        const expected = Math.max(0, 5 - cfg.restoredReputationPoints);
        expect(cached!.score).toBeLessThanOrEqual(5);
        expect(cached!.score).toBe(expected);
    });

    it('does not heal a banned visitor score through the middleware', async () => {
        const canary = 'rep-http-bot-' + Date.now();
        trackedCookies.push(canary);

        await seedVisitorWithReputation(canary, 1, 50, CLEAN_IP);
        await reputationCache.set(canary, { isBot: true, score: 50 });

        await visitorCache.set(canary, { banned: false, visitor_id: 'fake-id' });

        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP)
            .set('Cookie', `canary_id=${canary}`);

        expect(res.status).toBe(200);

        await getBatchQueue().flush();
        await new Promise(r => setTimeout(r, 200));

        const cached = await reputationCache.get(canary);
        expect(cached).not.toBeNull();
        expect(cached!.isBot).toBe(true);
        expect(cached!.score).toBe(50);
    });
});


describe('reputation cache and db consistency via http', () => {
    it('writes the healed score to the db after flushing', async () => {
        const canary = 'rep-http-db-' + Date.now();
        trackedCookies.push(canary);
        const cfg = getConfiguration();

        await seedVisitorWithReputation(canary, 0, 8, CLEAN_IP);
        await reputationCache.set(canary, { isBot: false, score: 8 });

        await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP)
            .set('Cookie', `canary_id=${canary}`);

        await getBatchQueue().flush();
        await new Promise(r => setTimeout(r, 200));

        const row = await getVisitor(canary);
        expect(row).not.toBeNull();
        const expected = Math.max(0, 8 - cfg.restoredReputationPoints);
        expect(Number(row.suspicious_activity_score)).toBe(expected);
    });

    it('resnapshots the score when cached score is 0 in snapshot then heal mode', async () => {
        const canary = 'rep-http-zero-' + Date.now();
        trackedCookies.push(canary);

        await seedVisitorWithReputation(canary, 0, 0, CLEAN_IP);
        await reputationCache.set(canary, { isBot: false, score: 0 });

        await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP)
            .set('Cookie', `canary_id=${canary}`);

        await getBatchQueue().flush();
        await new Promise(r => setTimeout(r, 200));

        const row = await getVisitor(canary);
        expect(row).not.toBeNull();
        expect(Number(row.suspicious_activity_score)).toBeGreaterThanOrEqual(0);
    });
});
