import { describe, it, expect, beforeAll } from 'vitest';
import { CheckerRegistry } from '~~/src/botDetector/checkers/CheckerRegistry.js';
import { getConfiguration } from '~~/src/botDetector/config/config.js';
import type { IBotChecker } from '~~/src/botDetector/types/checkersTypes.js';
import type { ValidationContext } from '~~/src/botDetector/types/botDetectorTypes.js';
import type { BotDetectorConfig } from '~~/src/botDetector/types/configSchema.js';


beforeAll(async () => {
    await import('~~/src/botDetector.js');
});

describe('CheckerRegistry', () => {
    describe('phase distribution', () => {
        it('registers at least 11 cheap phase checkers', () => {
            const cheap = CheckerRegistry.getEnabled('cheap', getConfiguration());
            expect(cheap.length).toBe(11);
        });

        it('registers at least 6 heavy phase checkers', () => {
            const heavy = CheckerRegistry.getEnabled('heavy', getConfiguration());
            expect(heavy.length).toBe(6);
        });

        it('Bad User Agent list is in the cheap phase', () => {
            const names = CheckerRegistry.getEnabled('cheap', getConfiguration()).map(c => c.name);
            expect(names).toContain('Bad User Agent list');
        });

        it('geo checker is in the heavy phase', () => {
            const heavy = CheckerRegistry.getEnabled('heavy', getConfiguration());
            const names = heavy.map(c => c.name);
            expect(names).toContain('Geo-Location Verification');
        });

        it('every cheap phase checker has phase === "cheap"', () => {
            const cheap = CheckerRegistry.getEnabled('cheap', getConfiguration());
            for (const c of cheap) {
                expect(c.phase).toBe('cheap');
            }
        });

        it('ASN Classification is registered in the cheap phase', () => {
            const names = CheckerRegistry.getEnabled('cheap', getConfiguration()).map(c => c.name);
            expect(names).toContain('ASN Classification');
        });
    });

    describe('isEnabled() gating', () => {
        it('excludes a checker when its config flag is disabled', () => {
            const cfg = getConfiguration();
            const original = (cfg.checkers.enableAsnClassification as any).enable;

            (cfg.checkers.enableAsnClassification as any).enable = false;
            const names = CheckerRegistry.getEnabled('cheap', cfg).map(c => c.name);
            expect(names).not.toContain('ASN Classification');

            (cfg.checkers.enableAsnClassification as any).enable = original;
        });

        it('re includes a checker as soon as its config flag is re-enabled', () => {
            const cfg = getConfiguration();
            (cfg.checkers.enableAsnClassification as any).enable = false;
            (cfg.checkers.enableAsnClassification as any).enable = true;

            const names = CheckerRegistry.getEnabled('cheap', cfg).map(c => c.name);
            expect(names).toContain('ASN Classification');
        });

        it('disabling the geo checker removes it from the heavy phase list', () => {
            const cfg = getConfiguration();
            const original = (cfg.checkers.enableGeoChecks as any).enable;

            (cfg.checkers.enableGeoChecks as any).enable = false;
            const names = CheckerRegistry.getEnabled('heavy', cfg).map(c => c.name);
            expect(names).not.toContain('Geo-Location Verification');

            (cfg.checkers.enableGeoChecks as any).enable = original;
        });
    });


    describe('custom checker registration', () => {
        let enabled = false;

        beforeAll(() => {
            const checker: IBotChecker<any> = {
                name: '__test_custom_cheap__',
                phase: 'cheap',
                isEnabled: () => enabled,
                run: (_ctx: ValidationContext, _cfg: BotDetectorConfig) =>
                    Promise.resolve({ score: 7, reasons: ['CUSTOM_SIGNAL'] }),
            };
            CheckerRegistry.register(checker);
        });

        it('is excluded from getEnabled when enabled=false', () => {
            const names = CheckerRegistry.getEnabled('cheap', getConfiguration()).map(c => c.name);
            expect(names).not.toContain('__test_custom_cheap__');
        });

        it('appears in cheap phase getEnabled when enabled=true', () => {
            enabled = true;
            const names = CheckerRegistry.getEnabled('cheap', getConfiguration()).map(c => c.name);
            expect(names).toContain('__test_custom_cheap__');
            enabled = false;
        });

        it('does NOT appear in the heavy phase regardless of enabled state', () => {
            enabled = true;
            const names = CheckerRegistry.getEnabled('heavy', getConfiguration()).map(c => c.name);
            expect(names).not.toContain('__test_custom_cheap__');
            enabled = false;
        });

        it('run() delivers the registered score and reasons', async () => {
            enabled = true;
            const cfg = getConfiguration();
            const checker = CheckerRegistry.getEnabled('cheap', cfg)
                .find(c => c.name === '__test_custom_cheap__')!;

            expect(checker).toBeDefined();
            const result = await checker.run({} as any, cfg);
            expect(result.score).toBe(7);
            expect(result.reasons).toContain('CUSTOM_SIGNAL');
            enabled = false;
        });

        it('a heavy phase custom checker is absent from cheap phase list', () => {
            const heavy: IBotChecker<any> = {
                name: '__test_custom_heavy__',
                phase: 'heavy',
                isEnabled: () => true,
                run: () => Promise.resolve({ score: 3, reasons: [] }),
            };
            CheckerRegistry.register(heavy);

            const cheapNames = CheckerRegistry.getEnabled('cheap', getConfiguration()).map(c => c.name);
            expect(cheapNames).not.toContain('__test_custom_heavy__');

            const heavyNames = CheckerRegistry.getEnabled('heavy', getConfiguration()).map(c => c.name);
            expect(heavyNames).toContain('__test_custom_heavy__');
        });
    });
});
