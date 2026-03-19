import { it, describe, expect, afterEach } from 'vitest';
import { BatchQueue } from '~~/src/botDetector/db/batchQueue.js';
import { deleteBanned, deleteVisitor, makeVisitor, getVisitor, getBanned } from '../test-utils/database-utils.js';
import { getConfiguration } from '~~/src/botDetector/config/config.js';


const cookies: string[] = [];
const bannedCookies: string[] = [];

afterEach(async () => {
    await Promise.all(bannedCookies.splice(0).map(c => deleteBanned(c)));
    await Promise.all(cookies.splice(0).map(deleteVisitor));
});


describe('BatchQueue', () => {
    describe('flush(), no op when empty', () => {
        it('resolves immediately with an empty queue', async () => {
            const q = new BatchQueue();
            await expect(q.flush()).resolves.toBeUndefined();
        });

        it('multiple flush() calls on empty queue do not throw', async () => {
            const q = new BatchQueue();
            await q.flush();
            await q.flush();
        });
    });

    describe('visitor_upsert', () => {
        it('writes a visitor row on deferred flush', async () => {
            const cookie = 'bq-upsert-' + Date.now();
            cookies.push(cookie);
            const q = new BatchQueue();

            await q.addQueue(cookie, '127.0.0.1', 'visitor_upsert', { insert: makeVisitor(cookie) }, 'deferred');
            await q.flush();

            const row = await getVisitor(cookie);
            expect(row).not.toBeNull();
            expect(row.canary_id).toBe(cookie);
        });

        it('does not error on duplicate canary_id', async () => {
            const cookie = 'bq-upsert-dup-' + Date.now();
            cookies.push(cookie);
            const q = new BatchQueue();

            await q.addQueue(cookie, '127.0.0.1', 'visitor_upsert', { insert: makeVisitor(cookie) }, 'deferred');
            await q.flush();
            await q.addQueue(cookie, '127.0.0.1', 'visitor_upsert', { insert: makeVisitor(cookie) }, 'deferred');
            await expect(q.flush()).resolves.toBeUndefined();
        });
    });

    describe('score_update', () => {
        it('updates suspicious_activity_score for an existing visitor', async () => {
            const cookie = 'bq-score-' + Date.now();
            cookies.push(cookie);

            const insertQ = new BatchQueue();
            await insertQ.addQueue(cookie, '127.0.0.1', 'visitor_upsert', { insert: makeVisitor(cookie) }, 'deferred');
            await insertQ.flush();

            const q = new BatchQueue();
            await q.addQueue(cookie, '', 'score_update', { score: 7, cookie }, 'deferred');
            await q.flush();

            const row = await getVisitor(cookie);
            expect(Number(row.suspicious_activity_score)).toBe(7);
        });
    });

    describe('is_bot_update', () => {
        it('sets is_bot=true for an existing visitor', async () => {
            const cookie = 'bq-isbot-' + Date.now();
            cookies.push(cookie);

            const insertQ = new BatchQueue();
            await insertQ.addQueue(cookie, '127.0.0.1', 'visitor_upsert', { insert: makeVisitor(cookie) }, 'deferred');
            await insertQ.flush();

            const q = new BatchQueue();
            await q.addQueue(cookie, '', 'is_bot_update', { isBot: true, cookie }, 'deferred');
            await q.flush();

            const row = await getVisitor(cookie);
            expect(Number(row.is_bot)).toBe(1);
        });

        it('sets is_bot=false for a visitor previously marked as bot', async () => {
            const cookie = 'bq-isbot-false-' + Date.now();
            cookies.push(cookie);

            const insertQ = new BatchQueue();
            await insertQ.addQueue(cookie, '127.0.0.1', 'visitor_upsert', { insert: { ...makeVisitor(cookie), is_bot: true } }, 'deferred');
            await insertQ.flush();

            const q = new BatchQueue();
            await q.addQueue(cookie, '', 'is_bot_update', { isBot: false, cookie }, 'deferred');
            await q.flush();

            const row = await getVisitor(cookie);
            expect(Number(row.is_bot)).toBe(0);
        });
    });

    describe('update_banned_ip', () => {
        it('writes a banned record on immediate flush', async () => {
            const cookie = 'bq-banned-' + Date.now();
            cookies.push(cookie);
            bannedCookies.push(cookie);

            const insertQ = new BatchQueue();
            await insertQ.addQueue(cookie, '1.2.3.4', 'visitor_upsert', { insert: makeVisitor(cookie) }, 'immediate');

            const q = new BatchQueue();
            await q.addQueue(cookie, '1.2.3.4', 'update_banned_ip', {
                cookie,
                ipAddress: '1.2.3.4',
                country: 'testland',
                user_agent: 'EvilBot/1.0',
                info: { reasons: ['FIREHOL_L1_THREAT'], score: 40 },
            }, 'immediate');

            const row = await getBanned(cookie);
            expect(row).not.toBeNull();
            expect(row.canary_id).toBe(cookie);
            expect(row.ip_address).toBe('1.2.3.4');
            expect(row.country).toBe('testland');
            expect(row.user_agent).toBe('EvilBot/1.0');
            expect(row.score).toBe(40);
            const reasons = JSON.parse(row.reason);
            expect(reasons).toContain('FIREHOL_L1_THREAT');
        });
    });

    describe('immediate priority', () => {
        it('flushes synchronously on addQueue without waiting for the timer', async () => {
            const cookie = 'bq-immediate-' + Date.now();
            cookies.push(cookie);
            const q = new BatchQueue();

            await q.addQueue(cookie, '127.0.0.1', 'visitor_upsert', { insert: makeVisitor(cookie) }, 'immediate');

            const row = await getVisitor(cookie);
            expect(row).not.toBeNull();
            expect(row.canary_id).toBe(cookie);
            expect(row.ip_address).toBe('127.0.0.1');
        });
    });

    describe('deduplication', () => {
        it('only keeps the latest job for the same key before flush', async () => {
            const cookie = 'bq-dedup-' + Date.now();
            cookies.push(cookie);

            const insertQ = new BatchQueue();
            await insertQ.addQueue(cookie, '127.0.0.1', 'visitor_upsert', { insert: makeVisitor(cookie) }, 'deferred');
            await insertQ.flush();

            const q = new BatchQueue();
            await q.addQueue(cookie, '', 'score_update', { score: 99, cookie }, 'deferred');
            await q.addQueue(cookie, '', 'score_update', { score: 3,  cookie }, 'deferred');
            await q.flush();

            const row = await getVisitor(cookie);
            expect(Number(row.suspicious_activity_score)).toBe(3);
        });
    });

    describe('size limit', () => {
        it('auto flushes when buffer reaches maxBufferSize', async () => {
            const maxSize = getConfiguration().batchQueue.maxBufferSize;

            const batchCookies: string[] = [];
            const q = new BatchQueue();

            for (let i = 0; i < maxSize; i++) {
                const c = `bq-buf-${Date.now()}-${i}`;
                batchCookies.push(c);
                cookies.push(c);
                await q.addQueue(c, '127.0.0.1', 'visitor_upsert', { insert: makeVisitor(c) }, 'deferred');
            }

            for (const c of batchCookies) {
                const row = await getVisitor(c);
                expect(row).not.toBeNull();
                expect(row.canary_id).toBe(c);
            }
        });
    });

    describe('shutdown()', () => {
        it('drains remaining deferred jobs before resolving', async () => {
            const cookie = 'bq-shutdown-' + Date.now();
            cookies.push(cookie);
            const q = new BatchQueue();

            await q.addQueue(cookie, '127.0.0.1', 'visitor_upsert', { insert: makeVisitor(cookie) }, 'deferred');
            await q.shutdown();

            const row = await getVisitor(cookie);
            expect(row).not.toBeNull();
            expect(row.canary_id).toBe(cookie);
            expect(row.ip_address).toBe('127.0.0.1');
        });
    });

    describe('concurrent flush guard', () => {
        it('second flush() call while first is in progress does not double write', async () => {
            const cookie = 'bq-concurrent-' + Date.now();
            cookies.push(cookie);

            const insertQ = new BatchQueue();
            await insertQ.addQueue(cookie, '127.0.0.1', 'visitor_upsert', { insert: makeVisitor(cookie) }, 'deferred');
            await insertQ.flush();

            const q = new BatchQueue();
            await q.addQueue(cookie, '', 'score_update', { score: 5, cookie }, 'deferred');

            await Promise.all([q.flush(), q.flush()]);

            const row = await getVisitor(cookie);
            expect(Number(row.suspicious_activity_score)).toBe(5);
        });
    });
});
