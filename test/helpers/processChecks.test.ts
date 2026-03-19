import { it, describe, expect } from 'vitest';
import { getConfiguration } from '~~/src/botDetector/config/config.js';
import { processChecks } from '~~/src/botDetector/helpers/processChecks.js';
import { BadBotDetected, GoodBotDetected } from '~~/src/botDetector/helpers/exceptions.js';
import { BanReasonCode, IBotChecker } from '~~/src/botDetector/types/checkersTypes.js';
import { createMockContext } from '../test-utils/test-utils.js';


function makeChecker(name: string, score: number, reasons: BanReasonCode[]): IBotChecker<BanReasonCode> {
    return {
        name,
        phase: 'cheap',
        isEnabled: () => true,
        run: async () => ({ score, reasons }),
    };
}

describe('processChecks', () => {
    const ctx = createMockContext();

    describe('score accumulation', () => {
        it('returns 0 when the checker list is empty', async () => {
            const reasons: BanReasonCode[] = [];
            const score = await processChecks([], ctx, getConfiguration(), 0, reasons);
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });

        it('preserves a non-zero initial score with no checkers', async () => {
            const score = await processChecks([], ctx, getConfiguration(), 5, []);
            expect(score).toBe(5);
        });

        it('accumulates scores from multiple checkers', async () => {
            const score = await processChecks(
                [makeChecker('A', 2, ['COOKIE_MISSING']), makeChecker('B', 3, ['ISP_UNKNOWN'])],
                ctx, getConfiguration(), 0, [],
            );
            expect(score).toBe(5);
        });

        it('accumulates on top of an initial score passed by the caller', async () => {
            const score = await processChecks(
                [makeChecker('A', 3, [])],
                ctx, getConfiguration(), 4, [],
            );
            expect(score).toBe(7);
        });

        it('collects all reason codes from every checker into the shared array', async () => {
            const reasons: BanReasonCode[] = [];
            await processChecks(
                [makeChecker('A', 1, ['COOKIE_MISSING']), makeChecker('B', 1, ['PROXY_DETECTED'])],
                ctx, getConfiguration(), 0, reasons,
            );
            expect(reasons).toContain('COOKIE_MISSING');
            expect(reasons).toContain('PROXY_DETECTED');
        });

        it('handles a single zero-score checker without mutating the reasons array', async () => {
            const reasons: BanReasonCode[] = [];
            const score = await processChecks(
                [makeChecker('ZeroScore', 0, [])],
                ctx, getConfiguration(), 0, reasons,
            );
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });
    });


    describe('early stop when banScore is reached', () => {
        it('stops processing remaining checkers once botScore >= banScore', async () => {
            const config = getConfiguration();
            const executed: string[] = [];

            const checkers: IBotChecker<BanReasonCode>[] = [
                {
                    name: 'First',
                    phase: 'cheap',
                    isEnabled: () => true,
                    run: async () => { executed.push('First'); return { score: config.banScore, reasons: [] }; },
                },
                {
                    name: 'Second',
                    phase: 'cheap',
                    isEnabled: () => true,
                    run: async () => { executed.push('Second'); return { score: 5, reasons: [] }; },
                },
            ];

            await processChecks(checkers, ctx, config, 0, []);
            expect(executed).toContain('First');
            expect(executed).not.toContain('Second');
        });

        it('resolves for a pure score-based ban without BAD_BOT_DETECTED', async () => {
            const cfg = getConfiguration();
            const result = await processChecks(
                [makeChecker('HighScore', cfg.banScore * 2, [])],
                ctx, cfg, 0, [],
            );
            expect(result).toBeGreaterThanOrEqual(cfg.banScore);
        });

        it('includes reasons from the score-based-ban checker in the reasons array', async () => {
            const cfg = getConfiguration();
            const reasons: BanReasonCode[] = [];
            await processChecks(
                [makeChecker('ProxyChecker', cfg.banScore, ['PROXY_DETECTED'])],
                ctx, cfg, 0, reasons,
            );
            expect(reasons).toContain('PROXY_DETECTED');
        });
    });


    describe('GoodBotDetected exception', () => {
        it('throws GoodBotDetected when a checker returns GOOD_BOT_IDENTIFIED', async () => {
            await expect(
                processChecks([makeChecker('goodBot', 0, ['GOOD_BOT_IDENTIFIED'])], ctx, getConfiguration(), 0, [])
            ).rejects.toThrow(GoodBotDetected);
        });

        it('does not process subsequent checkers after GoodBotDetected', async () => {
            const executed: string[] = [];
            const checkers: IBotChecker<BanReasonCode>[] = [
                {
                    name: 'GoodBot',
                    phase: 'cheap',
                    isEnabled: () => true,
                    run: async () => { executed.push('GoodBot'); return { score: 0, reasons: ['GOOD_BOT_IDENTIFIED'] }; },
                },
                {
                    name: 'ShouldNotRun',
                    phase: 'cheap',
                    isEnabled: () => true,
                    run: async () => { executed.push('ShouldNotRun'); return { score: 0, reasons: [] }; },
                },
            ];
            await expect(processChecks(checkers, ctx, getConfiguration(), 0, [])).rejects.toThrow(GoodBotDetected);
            expect(executed).not.toContain('ShouldNotRun');
        });
    });


    describe('BadBotDetected exception', () => {
        it('throws BadBotDetected when a checker returns BAD_BOT_DETECTED', async () => {
            await expect(
                processChecks([makeChecker('badBot', 0, ['BAD_BOT_DETECTED'])], ctx, getConfiguration(), 0, [])
            ).rejects.toThrow(BadBotDetected);
        });

        it('preserves reasons accumulated BEFORE a BadBotDetected exception', async () => {
            const reasons: BanReasonCode[] = [];
            await expect(
                processChecks(
                    [makeChecker('ProxyChecker', 2, ['PROXY_DETECTED']), makeChecker('badBot', 0, ['BAD_BOT_DETECTED'])],
                    ctx, getConfiguration(), 0, reasons,
                ),
            ).rejects.toThrow(BadBotDetected);
            expect(reasons).toContain('PROXY_DETECTED');
        });

        it('does not process subsequent checkers after BadBotDetected', async () => {
            const executed: string[] = [];
            const checkers: IBotChecker<BanReasonCode>[] = [
                {
                    name: 'BadBot',
                    phase: 'cheap',
                    isEnabled: () => true,
                    run: async () => { executed.push('BadBot'); return { score: 0, reasons: ['BAD_BOT_DETECTED'] }; },
                },
                {
                    name: 'ShouldNotRun',
                    phase: 'cheap',
                    isEnabled: () => true,
                    run: async () => { executed.push('ShouldNotRun'); return { score: 0, reasons: [] }; },
                },
            ];
            await expect(processChecks(checkers, ctx, getConfiguration(), 0, [])).rejects.toThrow(BadBotDetected);
            expect(executed).not.toContain('ShouldNotRun');
        });
    });


    describe('async checker support', () => {
        it('awaits async checkers correctly and accumulates their scores', async () => {
            const asyncChecker: IBotChecker<BanReasonCode> = {
                name: 'AsyncChecker',
                phase: 'cheap',
                isEnabled: () => true,
                run: async () => {
                    await new Promise(res => setTimeout(res, 5));
                    return { score: 6, reasons: ['PROXY_DETECTED'] };
                },
            };

            const reasons: BanReasonCode[] = [];
            const score = await processChecks([asyncChecker], ctx, getConfiguration(), 0, reasons);
            expect(score).toBe(6);
            expect(reasons).toContain('PROXY_DETECTED');
        });
    });


    describe('phaseLabel parameter', () => {
        it('accepts a custom phase label without throwing', async () => {
            await expect(
                processChecks([], ctx, getConfiguration(), 0, [], 'custom-phase')
            ).resolves.toBe(0);
        });
    });


    describe('unexpected checker exceptions', () => {
        it('propagates an unexpected error thrown by a checker to the caller', async () => {
            const broken: IBotChecker<BanReasonCode> = {
                name: 'BrokenChecker', phase: 'cheap', isEnabled: () => true,
                run: () => { throw new Error('unexpected internal error'); },
            };
            await expect(
                processChecks([broken], ctx, getConfiguration(), 0, [], 'test')
            ).rejects.toThrow('unexpected internal error');
        });
    });
});
