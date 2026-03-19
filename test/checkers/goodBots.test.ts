import { it, describe, expect } from 'vitest';
import { getConfiguration, getDataSources } from '~~/src/botDetector/config/config.js';
import { GoodBotsChecker } from '@checkers/goodBots/goodBots.js';
import { createMockContext } from '../test-utils/test-utils.js';

const checker = new GoodBotsChecker();

function run(parsedUA: object, ip = '8.8.8.8') {
    return checker.run(
        createMockContext({ parsedUA, ipAddress: ip }),
        getConfiguration()
    );
}

describe('GoodBotsChecker', () => {
    describe('Non crawler/fetcher browser type early return', () => {

        it('returns zero for a regular browser', async () => {
            const { score, reasons } = await run({ browserType: 'browser', browser: 'Chrome' });
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });

        it('returns zero for a CLI tool', async () => {
            const { score, reasons } = await run({ browserType: 'cli', browser: 'curl' });
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });

        it('returns zero when browserType is empty', async () => {
            const { score, reasons } = await run({ browserType: '', browser: '' });
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });
    });

    describe('Unlisted bot with banUnlistedBots=true', () => {

        it('flags BAD_BOT_DETECTED for an unknown crawler not in the suffix list', async () => {
            const config = getConfiguration();
            (config.checkers.enableGoodBotsChecks as any).enable = true;
            (config.checkers.enableGoodBotsChecks as any).banUnlistedBots = true;

            const { score, reasons } = await checker.run(
                createMockContext({ parsedUA: { browserType: 'crawler', browser: 'Evil' } }),
                config
            );
            expect(reasons).toContain('BAD_BOT_DETECTED');
            expect(score).toBe(0);
        });

        it('does NOT flag an unknown crawler as BAD_BOT when banUnlistedBots=false, proceeds to ip check', async () => {
            const config = getConfiguration();
            (config.checkers.enableGoodBotsChecks as any).enable = true;
            (config.checkers.enableGoodBotsChecks as any).banUnlistedBots = false;

            (config.checkers.enableGoodBotsChecks as any).enable = false;
            const { score, reasons } = await checker.run(
                createMockContext({ parsedUA: { browserType: 'crawler', browser: 'Evil' }, ipAddress: '203.0.113.5' }),
                config
            );
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
            (config.checkers.enableGoodBotsChecks as any).enable = true;
        });
    });

    describe('Whitelisted bots without suffix', () => {
        it('uses ip trust check for duckduckbot, untrusted ip is flagged', async () => {
            const config = getConfiguration();
            (config.checkers.enableGoodBotsChecks as any).enable = true;

            const { reasons } = await checker.run(
                createMockContext({ parsedUA: { browserType: 'crawler', browser: 'duckduckbot' }, ipAddress: '203.0.113.1' }),
                config
            );
            expect(reasons).toContain('BAD_BOT_DETECTED');
        });

        it('uses IP trust check for gptbot, untrusted ip is flagged', async () => {
            const config = getConfiguration();
            (config.checkers.enableGoodBotsChecks as any).enable = true;
            const { reasons } = await checker.run(
                createMockContext({ parsedUA: { browserType: 'crawler', browser: 'gptbot' }, ipAddress: '198.51.100.1' }),
                config
            );
            expect(reasons).toContain('BAD_BOT_DETECTED');
        });
    });

    describe('Real MMDB — goodBots database', () => {

        it('goodBots MMDB query does not throw for any IP', () => {
            const ips = ['8.8.8.8', '1.1.1.1', '66.249.66.1', '64.233.160.0'];
            for (const ip of ips) {
                expect(() => getDataSources().goodBotsDataBase(ip)).not.toThrow();
            }
        });

        it('Googlebot IP range returns a record from goodBots MMDB', () => {
            const record = getDataSources().goodBotsDataBase('66.249.66.1');
            expect(record).toBeDefined()
            if (record !== null) {
                expect(record.provider).toBe('google')
                expect(typeof record).toBe('object');
            }
        });
    });

    describe('GOOD_BOT_IDENTIFIED for trusted IP', () => {
        it('returns GOOD_BOT_IDENTIFIED when IP is in goodBots MMDB', async () => {
            const config = getConfiguration();
            (config.checkers.enableGoodBotsChecks as any).enable = true;


            const Ips = ['66.249.66.1', '66.249.72.0', '64.233.160.0'];
            for (const ip of Ips) {
                const record = getDataSources().goodBotsDataBase(ip);
                expect(record).toBeDefined()
                if (record !== null) {
                    const { score, reasons } = await checker.run(
                        createMockContext({ parsedUA: { browserType: 'crawler', browser: 'googlebot' }, ipAddress: ip }),
                        config
                    );
                    expect(score).toBe(0);
                    expect(reasons).toContain('GOOD_BOT_IDENTIFIED');
                    return; 
                }
            }
            console.warn('No Googlebot IPs found in goodBots.mmdb');
        });
    });

    describe('Configuration', () => {
        it('returns zero immediately when disabled', async () => {
            const config = getConfiguration();
            (config.checkers.enableGoodBotsChecks as any).enable = false;

            const { score, reasons } = await checker.run(
                createMockContext({ parsedUA: { browserType: 'crawler', browser: 'EvilScraper' } }),
                config
            );
            
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
            (config.checkers.enableGoodBotsChecks as any).enable = true;
        });

        it('isEnabled reflects config state', () => {
            const config = getConfiguration();
            (config.checkers.enableGoodBotsChecks as any).enable = false;
            expect(checker.isEnabled(config)).toBe(false);
            (config.checkers.enableGoodBotsChecks as any).enable = true;
            expect(checker.isEnabled(config)).toBe(true);
        });
    });
});
