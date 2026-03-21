import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from './http-app.js';
import { getConfiguration, getBatchQueue } from '~~/src/botDetector/config/config.js';
import { visitorCache } from '~~/src/botDetector/helpers/cache/cannaryCache.js';
import { deleteVisitor, deleteBanned, getVisitor, getBanned } from '../test-utils/database-utils.js';
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
        await deleteBanned(c);
        await deleteVisitor(c);
    }
});


describe('visitor upsert via http', () => {
    it('creates a visitor row with correct ip, browser and device after a first GET', async () => {
        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = trackCanary(res);
        expect(res.status).toBe(200);

        await getBatchQueue().flush();

        const row = await getVisitor(canary);
        expect(row).not.toBeNull();
        expect(row.canary_id).toBe(canary);
        expect(row.ip_address).toBe(CLEAN_IP);
        expect(row.browser).toBe('Chrome');
        expect(row.device_type).toBe('desktop');
        expect(row.os).toBe('Windows');
    });

    it('stores the user agent string in the visitor row', async () => {
        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = trackCanary(res);
        await getBatchQueue().flush();

        const row = await getVisitor(canary);
        expect(row).not.toBeNull();
        expect(row.user_agent).toContain('Chrome/124.0');
    });

    it('sets is_bot=0 for a clean visitor', async () => {
        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = trackCanary(res);
        await getBatchQueue().flush();

        const row = await getVisitor(canary);
        expect(row).not.toBeNull();
        expect(Number(row.is_bot)).toBe(0);
    });

    it('sets request_count=1 on the initial visit', async () => {
        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = trackCanary(res);
        await getBatchQueue().flush();

        const row = await getVisitor(canary);
        expect(row).not.toBeNull();
        expect(Number(row.request_count)).toBe(1);
    });

    it('populates geo fields from the ip lookup', async () => {
        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = trackCanary(res);
        await getBatchQueue().flush();

        const row = await getVisitor(canary);
        expect(row).not.toBeNull();
        expect(typeof row.country).toBe('string');
        expect(typeof row.timezone).toBe('string');
    });
});


describe('banned row via http, cli bot', () => {
    it('writes a banned row with correct canary_id and ip_address', async () => {
        const res = await request(app)
            .get('/check')
            .set('User-Agent', 'curl/7.0')
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = trackCanary(res);
        expect(res.status).toBe(403);
        await getBatchQueue().flush();

        const banned = await getBanned(canary);
        expect(banned).not.toBeNull();
        expect(banned.canary_id).toBe(canary);
        expect(banned.ip_address).toBe(CLEAN_IP);
    });

    it('stores a json reason array in the banned row', async () => {
        const res = await request(app)
            .get('/check')
            .set('User-Agent', 'curl/7.0')
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = trackCanary(res);
        await getBatchQueue().flush();

        const banned = await getBanned(canary);
        expect(banned).not.toBeNull();
        const reasons = JSON.parse(banned.reason);
        expect(Array.isArray(reasons)).toBe(true);
        expect(reasons.length).toBeGreaterThan(0);
    });

    it('stores the banned score at or above banScore', async () => {
        const res = await request(app)
            .get('/check')
            .set('User-Agent', 'curl/7.0')
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = trackCanary(res);
        await getBatchQueue().flush();

        const banned = await getBanned(canary);
        expect(banned).not.toBeNull();
        expect(Number(banned.score)).toBeGreaterThanOrEqual(getConfiguration().banScore);
    });

    it('sets is_bot=1 in visitors after flushing deferred jobs', async () => {
        const res = await request(app)
            .get('/check')
            .set('User-Agent', 'curl/7.0')
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = trackCanary(res);
        await getBatchQueue().flush();

        const row = await getVisitor(canary);
        expect(row).not.toBeNull();
        expect(Number(row.is_bot)).toBe(1);
    });
});


describe('score_update via http, clean request', () => {
    it('writes suspicious_activity_score to visitors after a clean request flush', async () => {
        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = trackCanary(res);
        expect(res.status).toBe(200);
        await getBatchQueue().flush();

        const row = await getVisitor(canary);
        expect(row).not.toBeNull();
        expect(Number(row.suspicious_activity_score)).toBeGreaterThanOrEqual(0);
    });

    it('does NOT write a banned row for a clean request', async () => {
        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = trackCanary(res);
        expect(res.status).toBe(200);
        await getBatchQueue().flush();

        const banned = await getBanned(canary);
        expect(banned).toBeUndefined();
    });
});
