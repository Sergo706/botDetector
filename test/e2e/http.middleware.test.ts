import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from './http-app.js';
import { getConfiguration, getBatchQueue } from '~~/src/botDetector/config/config.js';
import { visitorCache } from '~~/src/botDetector/helpers/cache/cannaryCache.js';
import { deleteVisitor, deleteBanned } from '../test-utils/database-utils.js';
import { BROWSER_HEADERS, extractCanary } from '../test-utils/test-utils.js';

const app = createApp();
const CLEAN_IP = '89.139.83.137';
const WHITELISTED_IP = '127.0.0.1';

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
        await deleteBanned(c);
        await deleteVisitor(c);
    }
});


describe('whitelist bypass', () => {
    it('returns 200 for a whitelisted ip without running detection', async () => {
        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', WHITELISTED_IP);
        trackCanary(res);
        expect(res.status).toBe(200);
        expect(res.body.results.banned).toBe(false);
        expect(res.body.results.success).toBe(true);
    });

    it('returns 200 for a whitelisted IP even with a bot like ua', async () => {
        const res = await request(app)
            .get('/check')
            .set('User-Agent', 'curl/7.0')
            .set('X-Forwarded-For', WHITELISTED_IP);
        trackCanary(res);
        expect(res.status).toBe(200);
        expect(res.body.results.banned).toBe(false);
    });

    it('populates the visitor cache for a whitelisted ip', async () => {
        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', WHITELISTED_IP);

        const canary = trackCanary(res);

        const cached = await visitorCache.get(canary);
        expect(cached).not.toBeNull();
        expect(cached!.banned).toBe(false);
        expect(cached!.visitor_id).toBeTruthy();
    });
});


describe('visitor cache', () => {
    it('returns 200 on the second request using the cached visitor entry', async () => {
        const first = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = trackCanary(first);
        expect(first.status).toBe(200);

        await getBatchQueue().flush();

        const second = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP)
            .set('Cookie', `canary_id=${canary}`);

        expect(second.status).toBe(200);
    });

    it('returns 403 on a second request when the visitor is cached as banned', async () => {
        const canary = 'mw-banned-cache-' + Date.now();
        trackedCookies.push(canary);

        await visitorCache.set(canary, { banned: true, visitor_id: 'fake-id' });

        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP)
            .set('Cookie', `canary_id=${canary}`);

        expect(res.status).toBe(403);
    });

    it('skips detection checks when checkEveryRequest is false and cache exists', async () => {
        const cfg = getConfiguration();
        const savedCheckEvery = cfg.checksTimeRateControl.checkEveryReqest;
        (cfg.checksTimeRateControl as any).checkEveryReqest = false;

        try {
            const first = await request(app)
                .get('/check')
                .set(BROWSER_HEADERS)
                .set('X-Forwarded-For', CLEAN_IP);

            const canary = trackCanary(first);
            expect(first.status).toBe(200);

            await getBatchQueue().flush();

            const second = await request(app)
                .get('/check')
                .set(BROWSER_HEADERS)
                .set('X-Forwarded-For', CLEAN_IP)
                .set('Cookie', `canary_id=${canary}`);

            expect(second.status).toBe(200);
        } finally {
            (cfg.checksTimeRateControl as any).checkEveryReqest = savedCheckEvery;
        }
    });
});


describe('response body shape', () => {
    it('returns the correct botDetection fields for a clean request', async () => {
        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        trackCanary(res);
        expect(res.status).toBe(200);

        const body = res.body;
        expect(body).toHaveProperty('results');
        expect(body).toHaveProperty('message', 'Fingerprint logged successfully');

        const results = body.results;
        expect(results).toHaveProperty('success', true);
        expect(results).toHaveProperty('banned', false);
        expect(results).toHaveProperty('time');
        expect(results).toHaveProperty('ipAddress');
        expect(typeof results.time).toBe('string');
        expect(results.ipAddress).toBe(CLEAN_IP);
    });

    it('returns a 403 status with no json body for a detected bot', async () => {
        const res = await request(app)
            .get('/check')
            .set('User-Agent', 'curl/7.0')
            .set('X-Forwarded-For', CLEAN_IP);

        trackCanary(res);
        expect(res.status).toBe(403);
        expect(res.body).toEqual({});
    });
});


describe('req.ip extraction with trust proxy', () => {
    it('uses X-Forwarded-For as req.ip and populates ipAddress in the response', async () => {
        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        trackCanary(res);
        expect(res.status).toBe(200);
        expect(res.body.results.ipAddress).toBe(CLEAN_IP);
    });
});
