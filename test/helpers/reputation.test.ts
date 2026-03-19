import { it, describe, expect, beforeEach, afterEach } from 'vitest';
import { getConfiguration } from '~~/src/botDetector/config/config.js';
import { userReputation } from '~~/src/botDetector/helpers/reputation.js';
import { getReputationCache } from '~~/src/botDetector/helpers/cache/reputationCache.js';
import { deleteVisitor, getVisitor, seedVisitorWithReputation } from '../test-utils/database-utils.js';

const TEST_COOKIE_CLEAN = 'rep-test-clean-' + Date.now();
const TEST_COOKIE_SUSPECT = 'rep-test-suspect-' + Date.now();
const TEST_COOKIE_BOT = 'rep-test-bot-' + Date.now();


beforeEach(() => {
    getReputationCache().clear();
});

afterEach(async () => {
    await Promise.all([
        deleteVisitor(TEST_COOKIE_CLEAN),
        deleteVisitor(TEST_COOKIE_SUSPECT),
        deleteVisitor(TEST_COOKIE_BOT),
    ]);
    getReputationCache().clear();
});

describe('userReputation', () => {

    describe('unknown visitor', () => {
        it('resolves without throwing for an unknown cookie', async () => {
            await expect(userReputation('no-such-cookie-xyz-' + Date.now())).resolves.toBeUndefined();
        });
    });

    describe('is_bot=true visitor', () => {
        it('returns early without modifying cache when visitor is already banned', async () => {
            await seedVisitorWithReputation(TEST_COOKIE_BOT, 1, 50);
            await userReputation(TEST_COOKIE_BOT);
            expect(getReputationCache().get(TEST_COOKIE_BOT)).toBeUndefined();
        });
    });

    describe('clean visitor', () => {
        it('resolves without error for a visitor with zero score', async () => {
            await seedVisitorWithReputation(TEST_COOKIE_CLEAN, 0, 0);
            await expect(userReputation(TEST_COOKIE_CLEAN)).resolves.toBeUndefined();
        });

        it('does not reduce score below 0 when score is already 0', async () => {
            await seedVisitorWithReputation(TEST_COOKIE_CLEAN, 0, 0);
            await userReputation(TEST_COOKIE_CLEAN);
            const row = await getVisitor(TEST_COOKIE_CLEAN);
            expect(row).not.toBeNull();
            expect(Number(row.suspicious_activity_score)).toBeGreaterThanOrEqual(0);
        });
    });

    describe('reputation healing', () => {
        it('reduces score for a non bot visitor with score > 0', async () => {
            const config = getConfiguration();
            const startScore = 5;
            await seedVisitorWithReputation(TEST_COOKIE_SUSPECT, 0, startScore);
            await userReputation(TEST_COOKIE_SUSPECT);

            const cached = getReputationCache().get(TEST_COOKIE_SUSPECT);
            expect(cached).toBeDefined()
            if (cached) {
                const expectedScore = Math.max(0, startScore - config.restoredReputationPoints);
                expect(cached.score).toBe(expectedScore);
            }
        });

        it('does not heal when score >= banScore', async () => {
            const config = getConfiguration();
            const banScore = config.banScore;
            await seedVisitorWithReputation(TEST_COOKIE_SUSPECT, 0, banScore);
            await userReputation(TEST_COOKIE_SUSPECT);

            const row = await getVisitor(TEST_COOKIE_SUSPECT);
            expect(row).not.toBeNull();
            expect(Number(row.suspicious_activity_score)).toBeGreaterThanOrEqual(banScore);
        });

        it('populates reputation cache after a db lookup', async () => {
            await seedVisitorWithReputation(TEST_COOKIE_SUSPECT, 0, 3);
            await userReputation(TEST_COOKIE_SUSPECT);

            const cached = getReputationCache().get(TEST_COOKIE_SUSPECT);
            expect(cached).toBeDefined()
            if (cached) {
                expect(typeof cached.isBot).toBe('boolean');
                expect(typeof cached.score).toBe('number');
            }
        });
    });

    describe('cache hit path', () => {
        it('uses cache and heals score without hitting db', async () => {
            const config = getConfiguration();
            const cachedScore = 4;

            getReputationCache().set(TEST_COOKIE_CLEAN, { isBot: false, score: cachedScore });
            await userReputation(TEST_COOKIE_CLEAN);
            const cached = getReputationCache().get(TEST_COOKIE_CLEAN);
            expect(cached).toBeDefined()
            if (cached) {
                const expected = Math.max(0, cachedScore - config.restoredReputationPoints);
                expect(cached.score).toBe(expected);
            }
        });

        it('returns immediately for a cached confirmed bot without DB access', async () => {
            getReputationCache().set(TEST_COOKIE_BOT, { isBot: true, score: 50 });
            await expect(userReputation(TEST_COOKIE_BOT)).resolves.toBeUndefined();

            const cached = getReputationCache().get(TEST_COOKIE_BOT);
            expect(cached?.isBot).toBe(true);
            expect(cached?.score).toBe(50);
        });
    });
});
