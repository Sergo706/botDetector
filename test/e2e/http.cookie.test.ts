import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from './http-app.js';
import { getBatchQueue } from '~~/src/botDetector/config/config.js';
import { visitorCache } from '~~/src/botDetector/helpers/cache/cannaryCache.js';
import { deleteVisitor, getVisitor } from '../test-utils/database-utils.js';
import { BROWSER_HEADERS, extractCanary } from '../test-utils/test-utils.js';

const app = createApp();
const CLEAN_IP = '89.139.83.137';

const createdCookies: string[] = [];

afterEach(async () => {
    await getBatchQueue().flush();
    const batch = createdCookies.splice(0);
    for (const c of batch) {
        await visitorCache.delete(c);
        await deleteVisitor(c);
    }
});

describe('cookie generation on first visit', () => {
    it('sets a canary_id cookie when no cookie is sent', async () => {
        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = extractCanary(res);
        expect(canary).toBeTruthy();
        expect(canary.length).toBe(64);
        createdCookies.push(canary);
    });

    it('canary_id cookie is httpOnly and secure', async () => {
        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        const setCookie = res.headers['set-cookie'];
        const raw = Array.isArray(setCookie) ? setCookie : [setCookie];
        const canaryLine = raw.find((c: string) => c.includes('canary_id='));
        expect(canaryLine).toBeDefined();
        expect(canaryLine).toContain('HttpOnly');
        expect(canaryLine).toContain('Secure');

        createdCookies.push(extractCanary(res));
    });

    it('canary_id cookie has SameSite=Lax and a path of /', async () => {
        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        const setCookie = res.headers['set-cookie'];
        const raw = Array.isArray(setCookie) ? setCookie : [setCookie];
        const canaryLine = raw.find((c: string) => c.includes('canary_id='));
        expect(canaryLine).toContain('SameSite=Lax');
        expect(canaryLine).toContain('Path=/');

        createdCookies.push(extractCanary(res));
    });

    it('generates a different canary_id on each new visitor request', async () => {
        const res1 = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        const res2 = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        const c1 = extractCanary(res1);
        const c2 = extractCanary(res2);
        expect(c1).not.toBe(c2);
        createdCookies.push(c1, c2);
    });
});


describe('cookie persistence across requests', () => {
    it('does not set a new canary_id when the client sends one back', async () => {
        const first = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = extractCanary(first);
        createdCookies.push(canary);

        await getBatchQueue().flush();

        const second = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP)
            .set('Cookie', `canary_id=${canary}`);

        const secondCanary = extractCanary(second);
        expect(secondCanary).toBe('');
    });

    it('creates a visitor row in the db after a first visit', async () => {
        const res = await request(app)
            .get('/check')
            .set(BROWSER_HEADERS)
            .set('X-Forwarded-For', CLEAN_IP);

        const canary = extractCanary(res);
        createdCookies.push(canary);

        await getBatchQueue().flush();

        const row = await getVisitor(canary);
        expect(row).not.toBeNull();
        expect(row.canary_id).toBe(canary);
        expect(row.ip_address).toBe(CLEAN_IP);
        expect(row.browser).toBe('Chrome');
    });
});
