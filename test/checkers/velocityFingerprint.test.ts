import { it, describe, expect, beforeEach } from 'vitest';
import { getConfiguration } from '~~/src/botDetector/config/config.js';
import { VelocityFingerprintChecker } from '@checkers/velocityFingerprint.js';
import { timingCache } from '~~/src/botDetector/helpers/cache/timingCache.js';
import { createMockContext } from '../test-utils/test-utils.js';

const checker = new VelocityFingerprintChecker();

beforeEach(() => {
    timingCache.clear();
});

function run(cookie: string) {
    const config = getConfiguration();
    (config.checkers.enableVelocityFingerprint as any).enable = true;
    return checker.run(createMockContext({ cookie }), config);
}


function seedTimestamps(cookie: string, count: number, spacingMs: number, endOffset = 0): void {
    const now = Date.now() - endOffset;
    
    const timestamps: number[] = [];
    for (let i = count - 1; i >= 0; i--) {
        timestamps.push(now - i * spacingMs);
    }
    timingCache.set(cookie, timestamps);
}

describe('VelocityFingerprintChecker', () => {
    describe('insufficient samples', () => {
        it('returns zero when no prior timestamps exist', () => {
            const { score, reasons } = run('cookie-new');
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });

        it('returns zero when cache has exactly 4 timestamps', () => {
            timingCache.set('cookie-few', [1000, 2000, 3000, 4000]);
            const { score, reasons } = run('cookie-few');
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });

        it('returns zero when cache has exactly 3 timestamps', () => {
            timingCache.set('cookie-3', [1000, 2000, 3000]);
            const { score, reasons } = run('cookie-3');
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });
    });

    describe('metronomic timing', () => {
        it('flags TIMING_TOO_REGULAR for perfectly even 500ms intervals', () => {
            const cookie = 'bot';
            seedTimestamps(cookie, 9, 500, 500);
            const { score, reasons } = run(cookie);

            const cfg = getConfiguration().checkers.enableVelocityFingerprint;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBe(cfg.penalties);
            expect(reasons).toContain('TIMING_TOO_REGULAR');
        });

        it('flags for 100ms intervals', () => {
            const cookie = 'bot-fast';
            seedTimestamps(cookie, 9, 100, 100);
            const { score, reasons } = run(cookie);

            const cfg = getConfiguration().checkers.enableVelocityFingerprint;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBe(cfg.penalties);
            expect(reasons).toContain('TIMING_TOO_REGULAR');
        });

        it('flags for 2000ms intervals', () => {
            const cookie = 'bot-slow';
            seedTimestamps(cookie, 9, 2000, 2000);
            const { score, reasons } = run(cookie);
            
            const cfg = getConfiguration().checkers.enableVelocityFingerprint;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            expect(reasons).toContain('TIMING_TOO_REGULAR');
        });
    });

    describe('irregular timing', () => {
        it('does NOT flag highly variable request timing', () => {
            const cookie = 'human-var';
            const t = Date.now();

            timingCache.set(cookie, [
                t - 20000, t - 19950, t - 14950, t - 14900,
                t - 9900,  t - 9850,  t - 4850,  t - 4800,
                t - 100
            ]);

            const { score, reasons } = run(cookie);
            expect(score).toBe(0);
            expect(reasons).not.toContain('TIMING_TOO_REGULAR');
        });

        it('does NOT flag when mean is 0', () => {
            const cookie = 'zero-mean';
            const t = Date.now() - 1000;
            timingCache.set(cookie, [t, t, t, t, t, t, t, t, t]);

            const { score, reasons } = run(cookie);
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });
    });

    describe('cookie isolation', () => {
        it('metronomic session does not affect a different session', () => {
            seedTimestamps('bot-isolated', 9, 500, 500);
            run('bot-isolated');

            const { score } = run('clean-isolated');
            expect(score).toBe(0);
        });
    });

    describe('no cookie', () => {
        it('returns zero when cookie is empty string', () => {
            const config = getConfiguration();
            (config.checkers.enableVelocityFingerprint as any).enable = true;
            const { score, reasons } = checker.run(
                createMockContext({ cookie: '' }),
                config
            );
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });
    });

    describe('configuration', () => {
        it('returns zero when disabled even for a metronomic session', () => {
            const cookie = 'bot-disabled';
            seedTimestamps(cookie, 9, 500, 500);

            const config = getConfiguration();
            (config.checkers.enableVelocityFingerprint as any).enable = false;
            const { score, reasons } = checker.run(createMockContext({ cookie }), config);
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });

        it('isEnabled reflects config state', () => {
            const config = getConfiguration();
            (config.checkers.enableVelocityFingerprint as any).enable = false;
            expect(checker.isEnabled(config)).toBe(false);
            (config.checkers.enableVelocityFingerprint as any).enable = true;
            expect(checker.isEnabled(config)).toBe(true);
        });
    });
});
