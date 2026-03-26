import { it, describe, expect, beforeEach, afterEach } from 'vitest';
import { getConfiguration } from '~~/src/botDetector/config/config.js';
import { BehavioralDbChecker } from '@checkers/rateTracker.js';
import { rateCache } from '~~/src/botDetector/helpers/cache/rateLimitarCache.js';
import { createMockContext } from '../test-utils/test-utils.js';

const checker = new BehavioralDbChecker();

const TEST_COOKIE_FAST = 'test-rate-fast-' + Date.now();
const TEST_COOKIE_SLOW = 'test-rate-slow-' + Date.now();

beforeEach(() => {
    rateCache.clear();
});

afterEach(async () => {
    rateCache.clear();
});

function run(cookie: string) {
    const config = getConfiguration();
    (config.checkers.enableBehaviorRateCheck as any).enable = true;
    return checker.run(createMockContext({ cookie }), config);
}

describe('BehavioralDbChecker', () => {

    describe('no cache entry', () => {
        it('returns zero when no cache entry exists for cookie', async () => {
            const { score, reasons } = await run('non-existent-cookie-xyz-123');
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });
    });

    describe('behavior within limits', () => {
        it('returns zero when request_count is below threshold', async () => {
            const cfg = getConfiguration().checkers.enableBehaviorRateCheck;
            expect(cfg.enable).toBe(true);
            if (!cfg.enable) return;

            rateCache.set(TEST_COOKIE_SLOW, {
                score: 0,
                timestamp: Date.now(),
                request_count: 1,
            });

            const { score, reasons } = await run(TEST_COOKIE_SLOW);
            expect(score).toBe(0);
            expect(reasons).not.toContain('BEHAVIOR_TOO_FAST');
        });

        it('returns zero when timestamp is outside the behavioral window', async () => {
            const cfg = getConfiguration().checkers.enableBehaviorRateCheck;
            expect(cfg.enable).toBe(true);
            if (!cfg.enable) return;

            const threshold = cfg.behavioral_threshold;
            const window = cfg.behavioral_window;

            rateCache.set(TEST_COOKIE_FAST, {
                score: cfg.penalties,
                timestamp: Date.now() - window - 5000,
                request_count: threshold + 10,
            });

            const { score, reasons } = await run(TEST_COOKIE_FAST);
            expect(score).toBe(0);
            expect(reasons).not.toContain('BEHAVIOR_TOO_FAST');
        });
    });

    describe('bot like request rate', () => {
        it('flags BEHAVIOR_TOO_FAST when request_count exceeds threshold within window', async () => {
            const cfg = getConfiguration().checkers.enableBehaviorRateCheck;
            expect(cfg.enable).toBe(true);
            if (!cfg.enable) return;

            const threshold = cfg.behavioral_threshold;
            rateCache.set(TEST_COOKIE_FAST, {
                score: 0,
                timestamp: Date.now(),
                request_count: threshold,
            });

            const { score, reasons } = await run(TEST_COOKIE_FAST);
            expect(score).toBe(cfg.penalties);
            expect(reasons).toContain('BEHAVIOR_TOO_FAST');
        });
    });

    describe('cache', () => {
        it('returns consistent score across repeated calls from cache', async () => {
            const cfg = getConfiguration().checkers.enableBehaviorRateCheck;
            expect(cfg.enable).toBe(true);
            if (!cfg.enable) return;

            const threshold = cfg.behavioral_threshold;
            rateCache.set(TEST_COOKIE_FAST, {
                score: cfg.penalties,
                timestamp: Date.now(),
                request_count: threshold + 1,
            });

            const first = await run(TEST_COOKIE_FAST);
            expect(first.score).toBe(cfg.penalties);
            expect(first.reasons).toContain('BEHAVIOR_TOO_FAST');

            const second = await run(TEST_COOKIE_FAST);
            expect(second.score).toBe(cfg.penalties);
            expect(second.reasons).toContain('BEHAVIOR_TOO_FAST');
        });

        it('increments count on each call within window and crosses threshold without a db query', async () => {
            const cfg = getConfiguration().checkers.enableBehaviorRateCheck;
            expect(cfg.enable).toBe(true);
            if (!cfg.enable) return;

            const threshold = cfg.behavioral_threshold;

            rateCache.set(TEST_COOKIE_FAST, {
                score: 0,
                timestamp: Date.now(),
                request_count: threshold - 1,
            });

            const first = await run(TEST_COOKIE_FAST);
            expect(first.score).toBe(0);

            const second = await run(TEST_COOKIE_FAST);
            expect(second.score).toBe(cfg.penalties);
            expect(second.reasons).toContain('BEHAVIOR_TOO_FAST');
        });

        it('pre seeded high score cache entry returns the cached score without a db query', async () => {
            const cfg = getConfiguration().checkers.enableBehaviorRateCheck;
            expect(cfg.enable).toBe(true);
            if (!cfg.enable) return;

            const cookie = 'cache-only-cookie-' + Date.now();
            rateCache.set(cookie, {
                score: cfg.penalties,
                timestamp: Date.now(),
                request_count: cfg.behavioral_threshold + 5,
            });

            const { score, reasons } = await run(cookie);
            expect(score).toBe(cfg.penalties);
            expect(reasons).toContain('BEHAVIOR_TOO_FAST');
        });

        it('expired cache resets to fresh window and returns zero without querying db', async () => {
            const cfg = getConfiguration().checkers.enableBehaviorRateCheck;
            expect(cfg.enable).toBe(true);
            if (!cfg.enable) return;

            const threshold = cfg.behavioral_threshold;
            const window = cfg.behavioral_window;

            rateCache.set(TEST_COOKIE_SLOW, {
                score: cfg.penalties,
                timestamp: Date.now() - window - 10_000,
                request_count: threshold + 100,
            });

            const { score, reasons } = await run(TEST_COOKIE_SLOW);
            expect(score).toBe(0);
            expect(reasons).not.toContain('BEHAVIOR_TOO_FAST');
        });
    });

    describe('configuration', () => {
        it('returns zero when disabled', async () => {
            const config = getConfiguration();
            (config.checkers.enableBehaviorRateCheck as any).enable = false;
            const { score, reasons } = await checker.run(createMockContext({ cookie: TEST_COOKIE_FAST }), config);
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
            (config.checkers.enableBehaviorRateCheck as any).enable = true;
        });
    });
});