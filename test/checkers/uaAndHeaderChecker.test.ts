import { it, describe, expect } from 'vitest';
import { getConfiguration } from '~~/src/botDetector/config/config.js';
import { UaAndHeaderChecker } from '@checkers/UaAndHeaderChecker/headersAndUACalc.js';
import { createMockContext, makeReq } from '../test-utils/test-utils.js';



const checker = new UaAndHeaderChecker();

function run(reqOpts: Parameters<typeof makeReq>[0]) {
    const req = makeReq(reqOpts);
    return checker.run(createMockContext({ req }), getConfiguration());
}

describe('UaAndHeaderChecker', () => {

    describe('clean legitimate request', () => {
        it('returns zero score for a chrome request with full rich headers', async () => {
            const { score, reasons } = await run({});

            const cfg = getConfiguration().checkers.enableUaAndHeaderChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });
    });

    describe('headless browser detection', () => {
        for (const keyword of ['headless', 'puppeteer', 'selenium', 'playwright', 'phantomjs']) {

            it(`flags HEADLESS_BROWSER_DETECTED for UA containing "${keyword}"`, async () => {
                const { score, reasons } = await run({ ua: `Mozilla/5.0 ${keyword}Chrome/124` });

                const cfg = getConfiguration().checkers.enableUaAndHeaderChecks;
                expect(cfg.enable).toBe(true)
                if (!cfg.enable) return;

                expect(score).toBeGreaterThanOrEqual(cfg.penalties.headlessBrowser);
                expect(reasons).toContain('HEADLESS_BROWSER_DETECTED');
            });

        }

        it('is case insensitive', async () => {
            const { reasons,score } = await run({ ua: 'HeAdLeSsChrome/124' });

            const cfg = getConfiguration().checkers.enableUaAndHeaderChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBeGreaterThanOrEqual(cfg.penalties.headlessBrowser);
            expect(reasons).toContain('HEADLESS_BROWSER_DETECTED');
        });
    });

    describe('short / missing useragent', () => {

        it('flags SHORT_USER_AGENT for a ua shorter than 10 characters', async () => {
            const { score, reasons } = await run({ ua: 'curl/7' });

            const cfg = getConfiguration().checkers.enableUaAndHeaderChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBeGreaterThanOrEqual(cfg.penalties.shortUserAgent);
            expect(reasons).toContain('SHORT_USER_AGENT');
        });

        it('flags SHORT_USER_AGENT for an empty UA', async () => {
            const { reasons,score } = await run({ ua: '' });

            const cfg = getConfiguration().checkers.enableUaAndHeaderChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBeGreaterThanOrEqual(cfg.penalties.shortUserAgent);
            expect(reasons).toContain('SHORT_USER_AGENT');
        });

    });

    describe('TLS check', () => {
        it('flags TLS_CHECK_FAILED for an unknown HTTP version', async () => {
            const { score, reasons } = await run({ httpVersion: '1.0' });

            const cfg = getConfiguration().checkers.enableUaAndHeaderChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBeGreaterThanOrEqual(cfg.penalties.tlsCheckFailed);
            expect(reasons).toContain('TLS_CHECK_FAILED');
        });

        it('flags TLS_CHECK_FAILED for an unrecognised cipher', async () => {
            const { score, reasons } = await run({ headers: { 'x-client-cipher': 'UNKNOWN-CIPHER' } });

            const cfg = getConfiguration().checkers.enableUaAndHeaderChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBe(cfg.penalties.tlsCheckFailed);
            expect(reasons).toContain('TLS_CHECK_FAILED');
        });

        it('flags TLS_CHECK_FAILED for an obsolete TLS version', async () => {
            const { score, reasons } = await run({ headers: { 'x-client-tls-version': 'TLS1.0' } });

            const cfg = getConfiguration().checkers.enableUaAndHeaderChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            
            expect(score).toBe(cfg.penalties.tlsCheckFailed);
            expect(reasons).toContain('TLS_CHECK_FAILED');
        });

        it('does NOT flag TLS for HTTP/1.1 with a valid cipher', async () => {
            const { reasons,score } = await run({
                httpVersion: '1.1',
                headers: {
                    'x-client-cipher': 'TLS_AES_256_GCM_SHA384',
                    'x-client-tls-version': 'TLS1.3',
                    'connection': 'keep-alive',
                }
            });

            const cfg = getConfiguration().checkers.enableUaAndHeaderChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBe(0);
            expect(reasons).not.toContain('TLS_CHECK_FAILED');
        });
    });

    describe('Path traversal detection', () => {

        it('flags PATH_TRAVELER_FOUND for a generic directory traversal', async () => {
            const { score, reasons } = await run({ originalUrl: '/api/../../etc/passwd' });

            const cfg = getConfiguration().checkers.enableUaAndHeaderChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBeGreaterThan(0);
            expect(reasons).toContain('PATH_TRAVELER_FOUND');
        });

        it('flags PATH_TRAVELER_FOUND for encoded traversal', async () => {
            const { reasons } = await run({ originalUrl: '/api/%2e%2e/etc/passwd' });

            const cfg = getConfiguration().checkers.enableUaAndHeaderChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(reasons).toContain('PATH_TRAVELER_FOUND');
        });

        it('flags PATH_TRAVELER_FOUND for a .git path probe', async () => {
            const { score, reasons } = await run({ originalUrl: '/.git/config' });

            const cfg = getConfiguration().checkers.enableUaAndHeaderChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBeGreaterThan(0);
            expect(reasons).toContain('PATH_TRAVELER_FOUND');
        });

        it('flags PATH_TRAVELER_FOUND for a wp-admin probe', async () => {
            const { reasons } = await run({ originalUrl: '/wp-admin/' });

            const cfg = getConfiguration().checkers.enableUaAndHeaderChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(reasons).toContain('PATH_TRAVELER_FOUND');
        });

        it('does NOT flag a normal API path', async () => {
            const { reasons } = await run({ originalUrl: '/api/v1/users/profile' });
            expect(reasons).not.toContain('PATH_TRAVELER_FOUND');
        });
    });

    describe('header analysis, weird headers', () => {

        it('flags when Postman token is present', async () => {
            const { score } = await run({ headers: { 'postman-token': 'some-token-value' } });

            const cfg = getConfiguration().checkers.enableUaAndHeaderChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            
            expect(score).toBe(getConfiguration().headerOptions.postManOrInsomiaHeaders);
        });

        it('flags when Accept is the wildcard */*', async () => {
            const { score } = await run({ headers: { 'accept': '*/*' } });

            const cfg = getConfiguration().checkers.enableUaAndHeaderChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBe(getConfiguration().headerOptions.omittedAcceptHeader);
        });
    });

    describe('score accumulation', () => {
        it('accumulates multiple signals for a fully synthetic bot request', async () => {
            const { score, reasons } = await run({
                ua: 'HeadlessChrome/124',
                httpVersion: '1.0',
                headers: {
                    'postman-token': 'test',
                    'x-client-cipher': 'RC4',
                    'x-client-tls-version': 'SSL3',
                    'accept': '*/*',
                },
            });
            const cfg = getConfiguration().checkers.enableUaAndHeaderChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBeGreaterThan(0);
            expect(reasons).toContain('HEADLESS_BROWSER_DETECTED');
            expect(reasons).toContain('TLS_CHECK_FAILED');
        });
    });

    describe('configuration', () => {
        it('returns zero when disabled', async () => {
            const config = getConfiguration();
            (config.checkers.enableUaAndHeaderChecks as any).enable = false;
            const req = makeReq({ ua: 'HeadlessChrome/124' });

            const { score, reasons } = await checker.run(createMockContext({ req }), config);
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);

            (config.checkers.enableUaAndHeaderChecks as any).enable = true;
        });

        it('isEnabled reflects config state', () => {
            const config = getConfiguration();
            (config.checkers.enableUaAndHeaderChecks as any).enable = false;
            expect(checker.isEnabled(config)).toBe(false);
            (config.checkers.enableUaAndHeaderChecks as any).enable = true;
            expect(checker.isEnabled(config)).toBe(true);
        });
    });
});
