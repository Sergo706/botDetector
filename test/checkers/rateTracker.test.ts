import { it, describe, expect, beforeEach, afterEach } from 'vitest';
import { getConfiguration } from '~~/src/botDetector/config/config.js';
import { BehavioralDbChecker } from '@checkers/rateTracker.js';
import { rateCache } from '~~/src/botDetector/helpers/cache/rateLimitarCache.js';
import { poolConnection } from '../config.js';
import { createMockContext } from '../test-utils/test-utils.js';
import { deleteVisitor } from '../test-utils/database-utils.js';

const checker = new BehavioralDbChecker();

const TEST_COOKIE_FAST = 'test-rate-fast-' + Date.now();
const TEST_COOKIE_SLOW = 'test-rate-slow-' + Date.now();

async function insertVisitor(cookie: string, requestCount: number, lastSeenMsAgo: number) {
    const lastSeen = new Date(Date.now() - lastSeenMsAgo);
    await poolConnection.execute(
        `INSERT INTO visitors (canary_id, ip_address, request_count, last_seen)
         VALUES (?, '127.0.0.9', ?, ?)
         ON DUPLICATE KEY UPDATE request_count = ?, last_seen = ?`,
        [cookie, requestCount, lastSeen, requestCount, lastSeen]
    );
}


beforeEach(() => {
    rateCache.clear();
});

afterEach(async () => {
    await deleteVisitor(TEST_COOKIE_FAST);
    await deleteVisitor(TEST_COOKIE_SLOW);
    rateCache.clear();
});

function run(cookie: string) {
    const config = getConfiguration();
    (config.checkers.enableBehaviorRateCheck as any).enable = true;
    return checker.run(createMockContext({ cookie }), config);
}

describe('BehavioralDbChecker', () => {
    
    describe('no visitor record', () => {
        it('returns zero when canary cookie does not exist in DB', async () => {
            const { score, reasons } = await run('non-existent-cookie-xyz-123');
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });
    });

    describe('behavior within limits', () => {
        it('returns zero when request_count is below threshold', async () => {
            const cfg = getConfiguration().checkers.enableBehaviorRateCheck;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            await insertVisitor(TEST_COOKIE_SLOW, 1, 500);

            const { score, reasons } = await run(TEST_COOKIE_SLOW);
            expect(score).toBe(0);
            expect(reasons).not.toContain('BEHAVIOR_TOO_FAST');
        });

        it('returns zero when last_seen is outside the behavioral window', async () => {
            const cfg = getConfiguration().checkers.enableBehaviorRateCheck;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            const threshold = cfg.behavioral_threshold;
            const window = cfg.behavioral_window;

            await insertVisitor(TEST_COOKIE_FAST, threshold + 10, window + 5000);

            const { score, reasons } = await run(TEST_COOKIE_FAST);
            expect(score).toBe(0);
            expect(reasons).not.toContain('BEHAVIOR_TOO_FAST');
        });
    });

    describe('bot like request rate', () => {

        it('flags BEHAVIOR_TOO_FAST when request_count exceeds threshold within window', async () => {
            const cfg = getConfiguration().checkers.enableBehaviorRateCheck;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            const threshold = cfg.behavioral_threshold;
            await insertVisitor(TEST_COOKIE_FAST, threshold + 1, 500);

            const { score, reasons } = await run(TEST_COOKIE_FAST);
            expect(score).toBe(cfg.penalties);
            expect(reasons).toContain('BEHAVIOR_TOO_FAST');
        });

    });

    describe('cache', () => {
        it('uses cached result on subsequent calls', async () => {
            const cfg = getConfiguration().checkers.enableBehaviorRateCheck;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            const threshold = cfg.behavioral_threshold;
            await insertVisitor(TEST_COOKIE_FAST, threshold + 1, 500);

  
            const first = await run(TEST_COOKIE_FAST);
            expect(first.score).toBe(cfg.penalties);


            await deleteVisitor(TEST_COOKIE_FAST);
            const second = await run(TEST_COOKIE_FAST);

            expect(second.score).toBe(cfg.penalties);
            expect(second.reasons).toContain('BEHAVIOR_TOO_FAST');
        });

        it('pre seeded high score cache entry returns the cached score without a db query', async () => {
            const cfg = getConfiguration().checkers.enableBehaviorRateCheck;
            expect(cfg.enable).toBe(true)
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

        it('expired cache entry falls through to db', async () => {
            const cfg = getConfiguration().checkers.enableBehaviorRateCheck;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            rateCache.set(TEST_COOKIE_SLOW, {
                score: cfg.penalties,
                timestamp: Date.now() - cfg.behavioral_window - 10000,
                request_count: cfg.behavioral_threshold + 5,
            });

            await insertVisitor(TEST_COOKIE_SLOW, 1, 500);
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
