import { describe, it, expect, beforeEach } from 'vitest';
import { visitorCache, CachedResult as VisitorCached } from '~~/src/botDetector/helpers/cache/cannaryCache.js';
import { reputationCache, CachedResult as ReputationCached } from '~~/src/botDetector/helpers/cache/reputationCache.js';
import { sessionCache, SessionEntry } from '~~/src/botDetector/helpers/cache/sessionCache.js';
import { timingCache } from '~~/src/botDetector/helpers/cache/timingCache.js';
import { dnsCache, CachedResult as DnsCached } from '~~/src/botDetector/helpers/cache/dnsLookupCache.js';
import { rateCache, CachedResult as RateCached } from '~~/src/botDetector/helpers/cache/rateLimitarCache.js';


describe('visitorCache', () => {
    const key = 'test-visitor-cookie';
    const entry: VisitorCached = { banned: false, visitor_id: 'v-123' };

    beforeEach(async () => {
        await visitorCache.delete(key);
    });

    it('returns null for a missing key', async () => {
        expect(await visitorCache.get('nonexistent')).toBeNull();
    });

    it('stores and retrieves an entry', async () => {
        await visitorCache.set(key, entry);
        const result = await visitorCache.get(key);
        expect(result).toEqual(entry);
    });

    it('overwrites an existing entry', async () => {
        await visitorCache.set(key, entry);
        const updated: VisitorCached = { banned: true, visitor_id: 'v-123' };
        await visitorCache.set(key, updated);
        expect(await visitorCache.get(key)).toEqual(updated);
    });

    it('deletes an entry', async () => {
        await visitorCache.set(key, entry);
        await visitorCache.delete(key);
        expect(await visitorCache.get(key)).toBeNull();
    });

    it('clear removes all entries', async () => {
        await visitorCache.set(key, entry);
        await visitorCache.set('other', { banned: true, visitor_id: 'v-456' });
        await visitorCache.clear();
        expect(await visitorCache.get(key)).toBeNull();
        expect(await visitorCache.get('other')).toBeNull();
    });
});


describe('reputationCache', () => {
    const key = 'test-rep-cookie';
    const entry: ReputationCached = { isBot: false, score: 5 };

    beforeEach(async () => {
        await reputationCache.delete(key);
    });

    it('returns null for a missing key', async () => {
        expect(await reputationCache.get('nonexistent')).toBeNull();
    });

    it('stores and retrieves an entry', async () => {
        await reputationCache.set(key, entry);
        const result = await reputationCache.get(key);
        expect(result).toEqual(entry);
    });

    it('overwrites an existing entry', async () => {
        await reputationCache.set(key, entry);
        const updated: ReputationCached = { isBot: true, score: 90 };
        await reputationCache.set(key, updated);
        expect(await reputationCache.get(key)).toEqual(updated);
    });

    it('deletes an entry', async () => {
        await reputationCache.set(key, entry);
        await reputationCache.delete(key);
        expect(await reputationCache.get(key)).toBeNull();
    });

    it('clear removes all entries', async () => {
        await reputationCache.set(key, entry);
        await reputationCache.set('other', { isBot: false, score: 0 });
        await reputationCache.clear();
        expect(await reputationCache.get(key)).toBeNull();
        expect(await reputationCache.get('other')).toBeNull();
    });
});


describe('sessionCache', () => {
    const key = 'test-session-id';
    const entry: SessionEntry = { lastPath: '/dashboard' };

    beforeEach(async () => {
        await sessionCache.delete(key);
    });

    it('returns null for a missing key', async () => {
        expect(await sessionCache.get('nonexistent')).toBeNull();
    });

    it('stores and retrieves an entry', async () => {
        await sessionCache.set(key, entry);
        const result = await sessionCache.get(key);
        expect(result).toEqual(entry);
    });

    it('overwrites an existing entry', async () => {
        await sessionCache.set(key, entry);
        const updated: SessionEntry = { lastPath: '/settings' };
        await sessionCache.set(key, updated);
        expect(await sessionCache.get(key)).toEqual(updated);
    });

    it('get refreshes the TTL without error', async () => {
        await sessionCache.set(key, entry);
        const first = await sessionCache.get(key);
        const second = await sessionCache.get(key);
        expect(first).toEqual(entry);
        expect(second).toEqual(entry);
    });

    it('deletes an entry', async () => {
        await sessionCache.set(key, entry);
        await sessionCache.delete(key);
        expect(await sessionCache.get(key)).toBeNull();
    });

    it('clear removes all entries', async () => {
        await sessionCache.set(key, entry);
        await sessionCache.set('other', { lastPath: '/home' });
        await sessionCache.clear();
        expect(await sessionCache.get(key)).toBeNull();
        expect(await sessionCache.get('other')).toBeNull();
    });
});


describe('timingCache', () => {
    const key = 'test-timing-visitor';
    const entry = [100, 200, 350];

    beforeEach(async () => {
        await timingCache.delete(key);
    });

    it('returns null for a missing key', async () => {
        expect(await timingCache.get('nonexistent')).toBeNull();
    });

    it('stores and retrieves timing array', async () => {
        await timingCache.set(key, entry);
        expect(await timingCache.get(key)).toEqual(entry);
    });

    it('overwrites with new timestamps', async () => {
        await timingCache.set(key, entry);
        const updated = [100, 200, 350, 400];
        await timingCache.set(key, updated);
        expect(await timingCache.get(key)).toEqual(updated);
    });

    it('deletes an entry', async () => {
        await timingCache.set(key, entry);
        await timingCache.delete(key);
        expect(await timingCache.get(key)).toBeNull();
    });

    it('clear removes all entries', async () => {
        await timingCache.set(key, entry);
        await timingCache.set('other', [500]);
        await timingCache.clear();
        expect(await timingCache.get(key)).toBeNull();
        expect(await timingCache.get('other')).toBeNull();
    });
});


describe('dnsCache', () => {
    const key = '8.8.8.8';
    const entry: DnsCached = { ip: '8.8.8.8', trustedBot: true };

    beforeEach(async () => {
        await dnsCache.delete(key);
    });

    it('returns null for a missing key', async () => {
        expect(await dnsCache.get('nonexistent')).toBeNull();
    });

    it('stores and retrieves a DNS entry', async () => {
        await dnsCache.set(key, entry);
        expect(await dnsCache.get(key)).toEqual(entry);
    });

    it('overwrites an existing entry', async () => {
        await dnsCache.set(key, entry);
        const updated: DnsCached = { ip: '8.8.8.8', trustedBot: false };
        await dnsCache.set(key, updated);
        expect(await dnsCache.get(key)).toEqual(updated);
    });

    it('deletes an entry', async () => {
        await dnsCache.set(key, entry);
        await dnsCache.delete(key);
        expect(await dnsCache.get(key)).toBeNull();
    });

    it('clear removes all entries', async () => {
        await dnsCache.set(key, entry);
        await dnsCache.set('1.1.1.1', { ip: '1.1.1.1', trustedBot: false });
        await dnsCache.clear();
        expect(await dnsCache.get(key)).toBeNull();
        expect(await dnsCache.get('1.1.1.1')).toBeNull();
    });
});


describe('rateCache', () => {
    const key = 'test-rate-cookie';
    const entry: RateCached = { score: 10, timestamp: Date.now(), request_count: 5 };

    beforeEach(async () => {
        await rateCache.delete(key);
    });

    it('returns null for a missing key', async () => {
        expect(await rateCache.get('nonexistent')).toBeNull();
    });

    it('stores and retrieves a rate entry', async () => {
        await rateCache.set(key, entry);
        const result = await rateCache.get(key);
        expect(result).toEqual(entry);
        expect(result!.score).toBe(10);
        expect(result!.request_count).toBe(5);
    });

    it('overwrites with updated count', async () => {
        await rateCache.set(key, entry);
        const updated: RateCached = { ...entry, request_count: 6, score: 15 };
        await rateCache.set(key, updated);
        const result = await rateCache.get(key);
        expect(result!.request_count).toBe(6);
        expect(result!.score).toBe(15);
    });

    it('deletes an entry', async () => {
        await rateCache.set(key, entry);
        await rateCache.delete(key);
        expect(await rateCache.get(key)).toBeNull();
    });

    it('clear removes all entries', async () => {
        await rateCache.set(key, entry);
        await rateCache.set('other', { score: 0, timestamp: Date.now(), request_count: 1 });
        await rateCache.clear();
        expect(await rateCache.get(key)).toBeNull();
        expect(await rateCache.get('other')).toBeNull();
    });
});
