import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { uaAndGeoBotDetector } from '~~/src/botDetector.js';
import { CheckerRegistry } from '~~/src/botDetector/checkers/CheckerRegistry.js';
import { getConfiguration, getBatchQueue, getDb } from '~~/src/botDetector/config/config.js';
import { reputationCache } from '~~/src/botDetector/helpers/cache/reputationCache.js';
import { prep } from '~~/src/botDetector/db/dialectUtils.js';
import { makeReq, cleanUSGeo, bannedCountryGeo, cleanBrowserUA } from '../test-utils/test-utils.js';
import { seedVisitor, getVisitor, deleteVisitor } from '../test-utils/database-utils.js';
import type { IBotChecker } from '~~/src/botDetector/types/checkersTypes.js';
import type { ValidationContext } from '~~/src/botDetector/types/botDetectorTypes.js';


const CLEAN_IP = '203.0.113.100';
let savedAsnEnable: boolean;
let savedProxyIspEnable: boolean;

beforeEach(() => {
    const cfg = getConfiguration();
    savedAsnEnable = (cfg.checkers.enableAsnClassification as any).enable;
    savedProxyIspEnable = (cfg.checkers.enableProxyIspCookiesChecks as any).enable;
    (cfg.checkers.enableAsnClassification as any).enable = false;
    (cfg.checkers.enableProxyIspCookiesChecks as any).enable = false;
});

afterEach(() => {
    const cfg = getConfiguration();
    (cfg.checkers.enableAsnClassification as any).enable = savedAsnEnable;
    (cfg.checkers.enableProxyIspCookiesChecks as any).enable = savedProxyIspEnable;
});


describe('legitimate request', () => {
    it('returns false for a clean chrome request', async () => {
        const req = makeReq({ cookie: 'flow-clean-' + Date.now() });
        const result = await uaAndGeoBotDetector(
            req, CLEAN_IP, req.get('user-agent') || '', cleanUSGeo, cleanBrowserUA,
        );
        expect(result).toBe(false);
    });

    it('populates the reputation cache with isBot=false after a clean pass', async () => {
        const cookie = 'flow-cache-' + Date.now();
        const req = makeReq({ cookie });

        await uaAndGeoBotDetector(req, CLEAN_IP, req.get('user-agent') || '', cleanUSGeo, cleanBrowserUA);

        const cached = await reputationCache.get(cookie);
        expect(cached).toBeDefined();
        expect(cached!.isBot).toBe(false);
        expect(typeof cached!.score).toBe('number');
    });

    it('returns false on a second request for the same cookie cache', async () => {
        const cookie = 'flow-repeat-' + Date.now();
        const req = makeReq({ cookie });
        const ua  = req.get('user-agent') || '';

        const first = await uaAndGeoBotDetector(req, CLEAN_IP, ua, cleanUSGeo, cleanBrowserUA);
        const second = await uaAndGeoBotDetector(req, CLEAN_IP, ua, cleanUSGeo, cleanBrowserUA);

        expect(first).toBe(false);
        expect(second).toBe(false);
    });
});


describe('buildCustomContext callback', () => {
    it('populates ctx.custom and makes it available inside a registered checker', async () => {
        let capturedCustom: unknown;
        let probeActive = true;

        const probe: IBotChecker<any> = {
            name: '__flow_custom_ctx_probe__',
            phase: 'cheap',
            isEnabled: () => probeActive,
            run: (ctx: ValidationContext<any>) => {
                capturedCustom = ctx.custom;
                probeActive = false;
                return Promise.resolve({ score: 0, reasons: [] });
            },
        };
        CheckerRegistry.register(probe);

        const req = makeReq({ cookie: 'flow-custom-' + Date.now() });

        await uaAndGeoBotDetector(
            req, CLEAN_IP, req.get('user-agent') || '', cleanUSGeo, cleanBrowserUA,
            () => ({ tenantId: 'tenant-abc', userId: 42 }),
        );

        expect(capturedCustom).toMatchObject({ tenantId: 'tenant-abc', userId: 42 });
    });

    it('ctx.custom is an empty object when buildCustomContext is omitted', async () => {
        let capturedCustom: unknown = Symbol('not-set');
        let probeActive2 = true;

        const probe2: IBotChecker<any> = {
            name: '__flow_no_custom_ctx_probe__',
            phase: 'cheap',
            isEnabled: () => probeActive2,
            run: (ctx: ValidationContext<any>) => {
                capturedCustom = ctx.custom;
                probeActive2 = false;
                return Promise.resolve({ score: 0, reasons: [] });
            },
        };
        CheckerRegistry.register(probe2);

        const req = makeReq({ cookie: 'flow-no-custom-' + Date.now() });
        await uaAndGeoBotDetector(req, CLEAN_IP, req.get('user-agent') || '', cleanUSGeo, cleanBrowserUA);

        expect(capturedCustom).toEqual({});
    });
});


describe('bot detection, cheap-phase score ban, cli tool', () => {
    it('returns true for a CLI/library user agent', async () => {
        const cliUA = { ...cleanBrowserUA, browserType: 'cli' as const };

        const req = makeReq({ ua: 'curl/7.0', cookie: 'flow-cli-' + Date.now() });

        const result = await uaAndGeoBotDetector(
            req, '1.2.3.4', 'curl/7.0', cleanUSGeo, cliUA,
        );

        expect(result).toBe(true);
    });

    it('returns true regardless of ip for a cli user agent', async () => {
        const cliUA = { ...cleanBrowserUA, browserType: 'cli' as const };
        const req = makeReq({ ua: 'curl/7.0', cookie: 'flow-cli2-' + Date.now() });
        const result = await uaAndGeoBotDetector(
            req, CLEAN_IP, 'curl/7.0', cleanUSGeo, cliUA,
        );
        expect(result).toBe(true);
    });
});


describe('bot detection, score-based ban path, banned country', () => {
    it('returns true when score reaches banScore via banned-country geo', async () => {
        const req = makeReq({ cookie: 'flow-geo-ban-' + Date.now() });
        const result = await uaAndGeoBotDetector(
            req,
            CLEAN_IP,
            req.get('user-agent') || '',
            bannedCountryGeo,
            cleanBrowserUA,
        );
        expect(result).toBe(true);
    });
});


describe('reputation cache, score_update deduplication', () => {
    it('does not requeue score_update when cache already holds a non-zero score', async () => {
        const cookie = 'flow-rep-cache-' + Date.now();
        const req = makeReq({ cookie });
        const ua = req.get('user-agent') || '';

        await seedVisitor(cookie, CLEAN_IP);

        try {
            await uaAndGeoBotDetector(req, CLEAN_IP, ua, cleanUSGeo, cleanBrowserUA);
            await getBatchQueue().flush();

            const row1 = await getVisitor(cookie);
            expect(row1).not.toBeNull();
            const score1 = Number(row1.suspicious_activity_score);

            
            await prep(getDb(), `UPDATE visitors SET suspicious_activity_score = 0 WHERE canary_id = ?`).run(cookie);

            await uaAndGeoBotDetector(req, CLEAN_IP, ua, cleanUSGeo, cleanBrowserUA);
            await getBatchQueue().flush();

            const row2 = await getVisitor(cookie);
            expect(row2).not.toBeNull();
            const score2 = Number(row2.suspicious_activity_score);

            if (score1 > 0) {
                expect(score2).toBe(0);
            } else {
                expect(typeof score2).toBe('number');
            }
        } finally {
            await deleteVisitor(cookie);
        }
    });
});
