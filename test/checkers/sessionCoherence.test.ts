import { it, describe, expect, beforeEach } from 'vitest';
import { getConfiguration } from '~~/src/botDetector/config/config.js';
import { SessionCoherenceChecker } from '@checkers/sessionCoherence.js';
import { sessionCache } from '~~/src/botDetector/helpers/cache/sessionCache.js';
import { createMockContext } from '../test-utils/test-utils.js';

const checker = new SessionCoherenceChecker();


beforeEach(async () => {
    await sessionCache.clear();
});

function run(opts: {
    cookie: string;
    path: string;
    referer?: string;
    secFetchSite?: string;
    hostname?: string;

}) {
    const config = getConfiguration();
    (config.checkers.enableSessionCoherence as any).enable = true;

   return checker.run(
        createMockContext({
            cookie: opts.cookie,
            req: {
                path: opts.path,
                hostname: opts.hostname || 'example.com',
                get: (name: string) => {
                    const lowerName = name.toLowerCase();
                    if (lowerName === 'referer') return opts.referer ?? '';
                    if (lowerName === 'sec-fetch-site') return opts.secFetchSite ?? '';
                    return '';
                },
            } as any,
        }),
        config
    );
}

describe('SessionCoherenceChecker', () => {
    describe('no cookie', () => {

        it('skips check when cookie is missing', async () => {
            const config = getConfiguration();
            (config.checkers.enableSessionCoherence as any).enable = true;
            const { score, reasons } = await checker.run(
                createMockContext({ cookie: undefined, req: { path: '/page', get: () => '' } as any }),
                config
            );
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });
    });

    describe('first visit', () => {
        it('returns zero on first request', async () => {
            const { score, reasons } = await run({ cookie: 'sess-1', path: '/home' });
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });

        it('stores the current path in the cache after the first visit', async () => {
            await run({ cookie: 'sess-2', path: '/home' });
            expect(await sessionCache.get('sess-2')).toEqual({ lastPath: '/home' });
        });
    });

    describe('subsequent visit', () => {
        it('penalises a subsequent visit when the Referer header is absent', async () => {
            await run({ cookie: 'sess-3', path: '/home' });
            const { score, reasons } = await run({ cookie: 'sess-3', path: '/about' });

            const cfg = getConfiguration().checkers.enableSessionCoherence;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBe(cfg.penalties.missingReferer);
            expect(reasons).toContain('SESSION_COHERENCE_MISSING_REFERER');
        });
    });

    describe('referer matches cached last path', () => {
        it('returns zero when Referer pathname matches the previous path exactly', async () => {
            await run({ cookie: 'sess-4', path: '/home' });
            const { score, reasons } = await run({
                cookie: 'sess-4',
                path: '/about',
                referer: 'https://example.com/home',
                hostname: 'example.com'
            });
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });

        it('updates cache to current path after a coherent visit', async () => {
            await run({ cookie: 'sess-5', path: '/home' });
            await run({ cookie: 'sess-5', path: '/about', referer: 'https://example.com/home', hostname: 'example.com' });
            expect(await sessionCache.get('sess-5')).toEqual({ lastPath: '/about' });
        });
    });

    describe('referer does NOT match cached last path', () => {
        it('penalises when referer pathname differs from the last cached path', async () => {
            await run({ cookie: 'sess-6', path: '/home' });

            const { score, reasons } = await run({
                cookie: 'sess-6',
                path: '/checkout',
                referer: 'https://example.com/totally-different-page',
                hostname: 'example.com'
            });

            const cfg = getConfiguration().checkers.enableSessionCoherence;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBe(cfg.penalties.pathMismatch);
            expect(reasons).toContain('SESSION_COHERENCE_PATH_MISMATCH');
        });

        it('still updates the cache to the new path after a violation', async () => {
            await run({ cookie: 'sess-7', path: '/home' });
            await run({ cookie: 'sess-7', path: '/checkout', referer: 'https://example.com/random', hostname: 'example.com' });
            expect(await sessionCache.get('sess-7')).toEqual({ lastPath: '/checkout' });
        });
    });

    describe('malformed referer url', () => {
        it('penalises when the referer url is malformed and cannot be parsed', async () => {

            await run({ cookie: 'sess-8', path: '/home' });
            const { score, reasons } = await run({
                cookie: 'sess-8',
                path: '/next',
                referer: 'not-a-valid-url',
            });

            const cfg = getConfiguration().checkers.enableSessionCoherence;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBe(cfg.penalties.missingReferer);
            expect(reasons).toContain('SESSION_COHERENCE_INVALID_REFERER');
        });
    });

    describe('sessions do not interfere', () => {

        it('violations in one session do not affect another session', async () => {
            await run({ cookie: 'sess-A', path: '/home', hostname: 'example.com' });
            await run({ cookie: 'sess-A', path: '/checkout', referer: 'https://example.com/random', hostname: 'example.com' });

            await run({ cookie: 'sess-B', path: '/landing', hostname: 'example.com' });
            const { score } = await run({ cookie: 'sess-B', path: '/products', referer: 'https://example.com/landing', hostname: 'example.com' });
            expect(score).toBe(0);
        });

    });

    describe('sec-fetch-site and domain coherence', () => {
        it('penalises missing referer when Sec-Fetch-Site is same origin', async () => {

            const { score, reasons } = await run({
                cookie: 'sess-same-origin',
                path: '/home',
                secFetchSite: 'same-origin'
            });
            const cfg = getConfiguration().checkers.enableSessionCoherence;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBe(cfg.penalties.missingReferer);
            expect(reasons).toContain('SESSION_COHERENCE_MISSING_REFERER');
        });

        it('penalises domain mismatch (referer hostname != current hostname)', async () => {
            await run({ cookie: 'sess-dom', path: '/home', hostname: 'site.com' });

            const { score, reasons } = await run({
                cookie: 'sess-dom',
                path: '/about',
                hostname: 'site.com',
                referer: 'https://attacker.com/home',
            });

            const cfg = getConfiguration().checkers.enableSessionCoherence;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBe(cfg.penalties.domainMismatch);
            expect(reasons).toContain('SESSION_COHERENCE_DOMAIN_MISMATCH');
        });
    });

    describe('configuration', () => {

        it('returns zero for a mismatch when checker is disabled', async () => {
            await run({ cookie: 'sess-dis', path: '/home' });
            const config = getConfiguration();
            (config.checkers.enableSessionCoherence as any).enable = false;

            const { score, reasons } = await checker.run(
                createMockContext({
                    cookie: 'sess-dis',
                    req: { path: '/checkout', hostname: 'example.com', get: (n: string) => n === 'Referer' ? 'https://example.com/random' : '' } as any,
                }),
                config
            );
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
            (config.checkers.enableSessionCoherence as any).enable = true;
        });

    });
});