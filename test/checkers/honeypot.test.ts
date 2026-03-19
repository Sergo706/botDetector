import { it, describe, expect } from 'vitest';
import { getConfiguration } from '~~/src/botDetector/config/config.js';
import { HoneypotChecker } from '@checkers/honeypot.js';
import { createMockContext } from '../test-utils/test-utils.js';

const checker = new HoneypotChecker();

function run(path: string, paths: string[] = ['/trap', '/hidden-admin', '/.env']) {
    const config = getConfiguration();
    (config.checkers.honeypot as any).enable = true;
    (config.checkers.honeypot as any).paths = paths;
    return checker.run(
        createMockContext({ req: { path, get: () => '' } as any }),
        config
    );
}

describe('HoneypotChecker', () => {

    describe('no paths configured', () => {
        it('returns zero when paths array is empty', () => {
            const { score, reasons } = run('/trap', []);
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });
    });

    describe('non honeypot path', () => {
        it('returns zero for a normal route', () => {
            const { score, reasons } = run('/api/health');
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });

        it('returns zero for a prefix that is not an exact match', () => {
            const { score, reasons } = run('/trap-extra');
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });

        it('returns zero for a path that starts with a honeypot prefix but is longer', () => {
            const { score, reasons } = run('/hidden-admin-panel');
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });
    });

    describe('Honeypot hit', () => {
        it('sets HONEYPOT_PATH_HIT and BAD_BOT_DETECTED on exact match', () => {
            const { reasons } = run('/trap');
            expect(reasons).toContain('HONEYPOT_PATH_HIT');
            expect(reasons).toContain('BAD_BOT_DETECTED');
        });

        it('score remains 0 ban is signal only via BAD_BOT_DETECTED reason', () => {
            const { score } = run('/trap');
            expect(score).toBe(0);
        });

        it('matches /.env path', () => {
            const { reasons } = run('/.env');
            expect(reasons).toContain('HONEYPOT_PATH_HIT');
        });

        it('is case insensitive', () => {
            const { reasons } = run('/TRAP');
            expect(reasons).toContain('HONEYPOT_PATH_HIT');
        });

        it('matches when honeypot path is uppercase and request is lowercase', () => {
            const config = getConfiguration();
            (config.checkers.honeypot as any).enable = true;
            (config.checkers.honeypot as any).paths = ['/ADMIN'];
            const { reasons } = checker.run(
                createMockContext({ req: { path: '/admin', get: () => '' } as any }),
                config
            );
            expect(reasons).toContain('HONEYPOT_PATH_HIT');
        });
    });

    describe('Configuration', () => {
        it('returns zero for a hit path when checker is disabled', () => {
            const config = getConfiguration();
            (config.checkers.honeypot as any).enable = false;
            (config.checkers.honeypot as any).paths = ['/trap'];
            const { score, reasons } = checker.run(
                createMockContext({ req: { path: '/trap', get: () => '' } as any }),
                config
            );
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
            (config.checkers.honeypot as any).enable = true;
        });

        it('isEnabled reflects config state', () => {
            const config = getConfiguration();
            (config.checkers.honeypot as any).enable = false;
            expect(checker.isEnabled(config)).toBe(false);
            (config.checkers.honeypot as any).enable = true;
            expect(checker.isEnabled(config)).toBe(true);
        });
    });
});
