import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from './http-app.js';
import { getBatchQueue } from '~~/src/botDetector/config/config.js';
import { visitorCache } from '~~/src/botDetector/helpers/cache/cannaryCache.js';
import { deleteVisitor, deleteBanned, getBanned } from '../test-utils/database-utils.js';
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


describe('clean browser request', () => {
    it('returns 200 for a standard Chrome request', async () => {
        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        trackCanary(res);
        expect(res.status).toBe(200);
        expect(res.body.results.banned).toBe(false);
    });

    it('populates the visitor cache with banned=false after a clean pass', async () => {
        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = trackCanary(res);
        expect(res.status).toBe(200);

        const cached = await visitorCache.get(canary);
        expect(cached).not.toBeNull();
        expect(cached!.banned).toBe(false);
        expect(cached!.visitor_id).toBeTruthy();
    });
});


describe('cli/library user agent detection', () => {
    it('returns 403 for curl user agent', async () => {
        const res = await request(app)
            .get('/check')
            .set('User-Agent', 'curl/7.0')
            .set('X-Forwarded-For', CLEAN_IP);

        trackCanary(res);
        expect(res.status).toBe(403);
    });

    it('returns 403 for wget user agent', async () => {
        const res = await request(app)
            .get('/check')
            .set('User-Agent', 'Wget/1.21')
            .set('X-Forwarded-For', CLEAN_IP);

        trackCanary(res);
        expect(res.status).toBe(403);
    });

    it('returns 403 for python-requests user agent', async () => {
        const res = await request(app)
            .get('/check')
            .set('User-Agent', 'python-requests/2.31.0')
            .set('X-Forwarded-For', CLEAN_IP);

        trackCanary(res);
        expect(res.status).toBe(403);
    });

    it('caches the bot as banned=true in visitor cache after cli detection', async () => {
        const res = await request(app)
            .get('/check')
            .set('User-Agent', 'curl/7.0')
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = trackCanary(res);
        expect(res.status).toBe(403);

        const cached = await visitorCache.get(canary);
        expect(cached).not.toBeNull();
        expect(cached!.banned).toBe(true);
    });

    it('writes a banned row to the DB when a cli user agent is detected', async () => {
        const res = await request(app)
            .get('/check')
            .set('User-Agent', 'curl/7.0')
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = trackCanary(res);
        await getBatchQueue().flush();

        const banned = await getBanned(canary);
        expect(banned).not.toBeNull();
        expect(banned.canary_id).toBe(canary);
        expect(banned.ip_address).toBe(CLEAN_IP);
    });
});


describe('headless browser detection', () => {
    it('returns 403 for a HeadlessChrome user agent with minimal headers', async () => {
        const res = await request(app)
            .get('/check')
            .set('User-Agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/124.0 Safari/537.36')
            .set('X-Forwarded-For', CLEAN_IP);

        trackCanary(res);
        expect(res.status).toBe(403);
    });
});


describe('empty user agent detection', () => {
    it('returns 403 for an empty user agent string', async () => {
        const res = await request(app)
            .get('/check')
            .set('User-Agent', '')
            .set('X-Forwarded-For', CLEAN_IP);

        trackCanary(res);
        expect(res.status).toBe(403);
    });

    it('returns 403 for a very short user agent string', async () => {
        const res = await request(app)
            .get('/check')
            .set('User-Agent', 'X')
            .set('X-Forwarded-For', CLEAN_IP);

        trackCanary(res);
        expect(res.status).toBe(403);
    });
});


describe('repeated bot requests use cache', () => {
    it('returns 403 on the second request for a known banned cookie from cache', async () => {
        const first = await request(app)
            .get('/check')
            .set('User-Agent', 'curl/7.0')
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = trackCanary(first);
        expect(first.status).toBe(403);

        const second = await request(app)
            .get('/check')
            .set('User-Agent', 'curl/7.0')
            .set('X-Forwarded-For', CLEAN_IP)
            .set('Cookie', `canary_id=${canary}`);

        expect(second.status).toBe(403);
    });
});
