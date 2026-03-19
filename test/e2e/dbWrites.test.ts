import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { uaAndGeoBotDetector } from '~~/src/botDetector.js';
import { getConfiguration, getBatchQueue } from '~~/src/botDetector/config/config.js';
import { CheckerRegistry } from '~~/src/botDetector/checkers/CheckerRegistry.js';
import { makeReq, cleanUSGeo, bannedCountryGeo, cleanBrowserUA } from '../test-utils/test-utils.js';
import { seedVisitor, getVisitor, getBanned, deleteBanned, deleteVisitor } from '../test-utils/database-utils.js';

const CLEAN_IP = '203.0.113.100';
const BOT_IP   = '1.2.3.4';
const cliUA = { ...cleanBrowserUA, browserType: 'cli' as const };


const activeCookies: string[] = [];

afterEach(async () => {
    const batch = activeCookies.splice(0);
    await Promise.all(batch.map(c => deleteBanned(c)));
    await Promise.all(batch.map(deleteVisitor));
});

let savedAsnEnable: boolean;
let savedProxyIspEnable: boolean;

function disableMmdbCheckers() {
    const cfg = getConfiguration();
    savedAsnEnable = (cfg.checkers.enableAsnClassification as any).enable;
    savedProxyIspEnable = (cfg.checkers.enableProxyIspCookiesChecks as any).enable;
    (cfg.checkers.enableAsnClassification as any).enable = false;
    (cfg.checkers.enableProxyIspCookiesChecks as any).enable = false;
}

function restoreMmdbCheckers() {
    const cfg = getConfiguration();
    (cfg.checkers.enableAsnClassification as any).enable     = savedAsnEnable;
    (cfg.checkers.enableProxyIspCookiesChecks as any).enable = savedProxyIspEnable;
}


describe('db writes cheap phase score ban, CLI/library UA', () => {
    it('writes a banned row synchronously', async () => {
        const cookie = 'db-banned-cli-' + Date.now();
        activeCookies.push(cookie);
        await seedVisitor(cookie, BOT_IP);

        const req = makeReq({ ua: 'curl/7.0', cookie });
        const result = await uaAndGeoBotDetector(req, BOT_IP, 'curl/7.0', cleanUSGeo, cliUA);
        expect(result).toBe(true);

        const banned = await getBanned(cookie);
        expect(banned).not.toBeNull();
        expect(banned.canary_id).toBe(cookie);
        expect(banned.ip_address).toBe(BOT_IP);
    });

    it('stores a JSON reason array in the banned row', async () => {
        const cookie = 'db-banned-reason-' + Date.now();
        activeCookies.push(cookie);
        await seedVisitor(cookie, BOT_IP);

        const req = makeReq({ ua: 'curl/7.0', cookie });
        await uaAndGeoBotDetector(req, BOT_IP, 'curl/7.0', cleanUSGeo, cliUA);

        const banned = await getBanned(cookie);
        expect(banned).not.toBeNull();
        const reasons = JSON.parse(banned.reason);
        expect(Array.isArray(reasons)).toBe(true);
        expect(reasons.length).toBeGreaterThan(0);
    });

    it('sets is_bot=1 in visitors after flushing the deferred is_bot_update job', async () => {
        const cookie = 'db-isbot-cli-' + Date.now();
        activeCookies.push(cookie);
        await seedVisitor(cookie, BOT_IP);

        const req = makeReq({ ua: 'curl/7.0', cookie });
        await uaAndGeoBotDetector(req, BOT_IP, 'curl/7.0', cleanUSGeo, cliUA);

        await getBatchQueue().flush();

        const row = await getVisitor(cookie);
        expect(row).not.toBeNull();
        expect(row.canary_id).toBe(cookie);
        expect(Number(row.is_bot)).toBe(1);
    });
});


describe('db writes score-based ban, banned country', () => {
    it('writes a banned row when the geo checker fires', async () => {
        const cookie = 'db-banned-geo-' + Date.now();
        activeCookies.push(cookie);
        await seedVisitor(cookie, BOT_IP);

        const req = makeReq({ cookie });
        const result = await uaAndGeoBotDetector(
            req, BOT_IP, req.get('user-agent') || '', bannedCountryGeo, cleanBrowserUA,
        );
        expect(result).toBe(true);

        const banned = await getBanned(cookie);
        expect(banned).not.toBeNull();
        expect(banned.canary_id).toBe(cookie);
        expect(banned.ip_address).toBe(BOT_IP);
    });

    it('sets is_bot=1 after flushing deferred jobs', async () => {
        const cookie = 'db-isbot-geo-' + Date.now();
        activeCookies.push(cookie);
        await seedVisitor(cookie, BOT_IP);

        const req = makeReq({ cookie });
        await uaAndGeoBotDetector(req, BOT_IP, req.get('user-agent') || '', bannedCountryGeo, cleanBrowserUA);
        await getBatchQueue().flush();

        const row = await getVisitor(cookie);
        expect(row).not.toBeNull();
        expect(row.canary_id).toBe(cookie);
        expect(Number(row.is_bot)).toBe(1);
    });
});


describe('db writes, clean request, score_update', () => {
    beforeEach(disableMmdbCheckers);
    afterEach(restoreMmdbCheckers);

    it('writes suspicious_activity_score to visitors after flushing deferred jobs', async () => {
        const cookie = 'db-score-clean-' + Date.now();
        activeCookies.push(cookie);
        await seedVisitor(cookie, CLEAN_IP);

        const req = makeReq({ cookie });
        const result = await uaAndGeoBotDetector(
            req, CLEAN_IP, req.get('user-agent') || '', cleanUSGeo, cleanBrowserUA,
        );
        expect(result).toBe(false);

        await getBatchQueue().flush();

        const row = await getVisitor(cookie);
        expect(row).not.toBeNull();
        expect(row.canary_id).toBe(cookie);
        expect(Number(row.suspicious_activity_score)).toBeGreaterThanOrEqual(0);
    });

    it('does NOT write a banned row for a clean request', async () => {
        const cookie = 'db-no-banned-clean-' + Date.now();
        activeCookies.push(cookie);
        await seedVisitor(cookie, CLEAN_IP);

        const req = makeReq({ cookie });
        await uaAndGeoBotDetector(req, CLEAN_IP, req.get('user-agent') || '', cleanUSGeo, cleanBrowserUA);
        await getBatchQueue().flush();

        const banned = await getBanned(cookie);
        expect(banned).toBeNull();
    });
});


describe('context object population', () => {
    beforeEach(disableMmdbCheckers);
    afterEach(restoreMmdbCheckers);

    it('ctx fields are populated from the function arguments', async () => {
        let capturedCtx: any;
        let probeActive = true;

        CheckerRegistry.register({
            name: '__db_writes_ctx_probe__',
            phase: 'cheap',
            isEnabled: () => probeActive,
            run: (ctx: any) => {
                capturedCtx = ctx;
                probeActive = false;
                return Promise.resolve({ score: 0, reasons: [] });
            },
        });

        const cookie = 'db-ctx-probe-' + Date.now();
        const req = makeReq({ cookie, ua: 'TestAgent/ctx' });

        await uaAndGeoBotDetector(req, CLEAN_IP, 'TestAgent/ctx', cleanUSGeo, cleanBrowserUA);

        expect(capturedCtx).toBeDefined();
        expect(capturedCtx.ipAddress).toBe(CLEAN_IP);
        expect(capturedCtx.cookie).toBe(cookie);
        expect(capturedCtx.geoData.country).toBe(cleanUSGeo.country);
        expect(capturedCtx.parsedUA.browser).toBe(cleanBrowserUA.browser);
        expect(typeof capturedCtx.proxy.isProxy).toBe('boolean');
        expect(typeof capturedCtx.anon).toBe('boolean');
        expect(capturedCtx.threatLevel === null || typeof capturedCtx.threatLevel === 'number').toBe(true);
    });
});
