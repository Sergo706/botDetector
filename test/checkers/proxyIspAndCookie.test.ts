import { it, describe, expect } from 'vitest';
import { getConfiguration } from '~~/src/botDetector/config/config.js';
import { ProxyIspAndCookieChecker } from '@checkers/proxyISPAndCookieCalc.js';
import { createMockContext } from '../test-utils/test-utils.js';

const checker = new ProxyIspAndCookieChecker();

function run(overrides: object) {
    return checker.run(createMockContext(overrides), getConfiguration());
}

const cleanCtx = {
    cookie: 'test-canary-abc',
    proxy: { isProxy: false, proxyType: '' },
    geoData: { isp: 'Comcast', org: 'AS7922', hosting: false },
};

describe('ProxyIspAndCookieChecker', () => {
    describe('clean context, no penalties', () => {

        it('returns zero score for a legitimate request', async () => {
            const { score, reasons } = await run(cleanCtx);
            const cfg = getConfiguration().checkers.enableProxyIspCookiesChecks;
            expect(cfg.enable).toBe(true)
            if (cfg.enable) {
                expect(score).toBe(0);
                expect(reasons).toHaveLength(0);
            }
        });
    });

    describe('missing cookie', () => {
        it('penalises when cookie is absent', async () => {
            const { score, reasons } = await run({ ...cleanCtx, cookie: '' });
            const cfg = getConfiguration().checkers.enableProxyIspCookiesChecks;
            expect(cfg.enable).toBe(true)

            if (!cfg.enable) return;
            expect(score).toBe(cfg.penalties.cookieMissing);
            expect(reasons).toContain('COOKIE_MISSING');
        });

        it('penalises when cookie is undefined', async () => {
            const { reasons, score } = await run({ ...cleanCtx, cookie: undefined });
            const cfg = getConfiguration().checkers.enableProxyIspCookiesChecks;
            expect(cfg.enable).toBe(true)

            if (!cfg.enable) return;
            expect(score).toBe(cfg.penalties.cookieMissing);
            expect(reasons).toContain('COOKIE_MISSING');
        });
    });

    describe('proxy detection', () => {
        it('penalises a detected proxy', async () => {
            const { score, reasons } = await run({
                ...cleanCtx,
                proxy: { isProxy: true, proxyType: 'VPN' },
            });
            const cfg = getConfiguration().checkers.enableProxyIspCookiesChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            expect(score).toBe(cfg.penalties.proxyDetected);
            expect(reasons).toContain('PROXY_DETECTED');
        });

        it('adds multiSourceBonus2to3 for 2 proxy sources', async () => {
            const cfg = getConfiguration().checkers.enableProxyIspCookiesChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            const { score } = await run({
                ...cleanCtx,
                proxy: { isProxy: true, proxyType: 'VPN,TOR' },
            });

            const expected = cfg.penalties.proxyDetected + cfg.penalties.multiSourceBonus2to3;
            expect(score).toBe(expected);
        });

        it('adds multiSourceBonus2to3 for 3 proxy sources', async () => {
            const cfg = getConfiguration().checkers.enableProxyIspCookiesChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            const { score } = await run({
                ...cleanCtx,
                proxy: { isProxy: true, proxyType: 'VPN,TOR,Proxy' },
            });

            const expected = cfg.penalties.proxyDetected + cfg.penalties.multiSourceBonus2to3;
            expect(score).toBe(expected);
        });

        it('adds multiSourceBonus4plus for 4+ proxy sources', async () => {
            const cfg = getConfiguration().checkers.enableProxyIspCookiesChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const { score } = await run({
                ...cleanCtx,
                proxy: { isProxy: true, proxyType: 'VPN,TOR,Proxy,Relay' },
            });
            const expected = cfg.penalties.proxyDetected + cfg.penalties.multiSourceBonus4plus;
            expect(score).toBe(expected);
        });

        it('does NOT add multisource bonus when proxyType is empty', async () => {
            const cfg = getConfiguration().checkers.enableProxyIspCookiesChecks;
            expect(cfg.enable).toBe(true)

            if (!cfg.enable) return;
            const { score } = await run({
                ...cleanCtx,
                proxy: { isProxy: true, proxyType: '' },
            });

            expect(score).toBe(cfg.penalties.proxyDetected);
        });
    });

    describe('hosting provider', () => {

        it('penalises hosting=true', async () => {

            const { score, reasons } = await run({
                ...cleanCtx,
                geoData: { ...cleanCtx.geoData, hosting: true },
            });

            const cfg = getConfiguration().checkers.enableProxyIspCookiesChecks;
            expect(cfg.enable).toBe(true)

            if (!cfg.enable) return;
            expect(score).toBe(cfg.penalties.hostingDetected);
            expect(reasons).toContain('HOSTING_DETECTED');
        });
    });

    describe('unknown ISP / Org', () => {
        it('penalises missing ISP', async () => {
            
            const { score, reasons } = await run({
                ...cleanCtx,
                geoData: { ...cleanCtx.geoData, isp: '' },
            });

            const cfg = getConfiguration().checkers.enableProxyIspCookiesChecks;
            expect(cfg.enable).toBe(true)

            if (!cfg.enable) return;
            expect(score).toBe(cfg.penalties.ispUnknown);
            expect(reasons).toContain('ISP_UNKNOWN');
        });

        it('penalises missing org', async () => {

            const { score, reasons } = await run({
                ...cleanCtx,
                geoData: { ...cleanCtx.geoData, org: '' },
            });

            const cfg = getConfiguration().checkers.enableProxyIspCookiesChecks;
            expect(cfg.enable).toBe(true)

            if (!cfg.enable) return;
            expect(score).toBe(cfg.penalties.orgUnknown);
            expect(reasons).toContain('ORG_UNKNOWN');
        });
    });

    describe('score accumulation', () => {
        it('accumulates all penalties for a worst case request', async () => {

            const { score, reasons } = await run({
                cookie: '',
                proxy: { isProxy: true, proxyType: 'VPN,TOR,Proxy,Relay' },
                geoData: { isp: '', org: '', hosting: true },
            });

            const cfg = getConfiguration().checkers.enableProxyIspCookiesChecks;
            expect(cfg.enable).toBe(true)

            if (!cfg.enable) return;
            const expected =
                cfg.penalties.cookieMissing +
                cfg.penalties.proxyDetected +
                cfg.penalties.multiSourceBonus4plus +
                cfg.penalties.hostingDetected +
                cfg.penalties.ispUnknown +
                cfg.penalties.orgUnknown;
            expect(score).toBe(expected);
            expect(reasons).toContain('COOKIE_MISSING');
            expect(reasons).toContain('PROXY_DETECTED');
            expect(reasons).toContain('HOSTING_DETECTED');
            expect(reasons).toContain('ISP_UNKNOWN');
            expect(reasons).toContain('ORG_UNKNOWN');
        });
    });

    describe('configuration', () => {

        it('returns zero for all checks when disabled', async () => {
            const config = getConfiguration();
            (config.checkers.enableProxyIspCookiesChecks as any).enable = false;
            const { score, reasons } = await checker.run(
                createMockContext({ cookie: '', proxy: { isProxy: true, proxyType: 'VPN,TOR' }, geoData: { isp: '', org: '' } }),
                config
            );
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
            (config.checkers.enableProxyIspCookiesChecks as any).enable = true;
        });
        
    });
    
});
