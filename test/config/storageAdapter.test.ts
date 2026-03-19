import { describe, it, expect, afterEach } from 'vitest';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { getStorage } from '~~/src/botDetector/config/config.js';
import { initStorage } from '~~/src/botDetector/config/storageAdapter.js';

const FS_BASE = join('/tmp', 'bot-detector-storage-test-' + process.pid);

afterEach(async () => {
    await getStorage().clear();
    try { rmSync(FS_BASE, { recursive: true, force: true }); } catch {}
});

describe('storage', () => {
    describe('getStorage(), defaults to memory', () => {
        it('sets and gets a string value', async () => {
            const s = getStorage();
            await s.setItem('test:str', 'hello');
            expect(await s.getItem('test:str')).toBe('hello');
        });

        it('hasItem returns true/false without fetching the payload', async () => {
            const s = getStorage();
            await s.setItem('known_bot:google', { ip: '8.8.8.8' });
            expect(await s.hasItem('known_bot:google')).toBe(true);
            expect(await s.hasItem('known_bot:bing')).toBe(false);
        });

        it('getKeys can get all keys or filter by base/namespace', async () => {
            const s = getStorage();
            await s.clear();
            await s.setItem('rate:ip1', { score: 10 });
            await s.setItem('rate:ip2', { score: 20 });
            await s.setItem('session:xyz', { path: '/' });

            const allKeys = await s.getKeys();
            expect(allKeys).toHaveLength(3);

   
            const rateKeys = await s.getKeys('rate:');
            expect(rateKeys).toEqual(expect.arrayContaining(['rate:ip1', 'rate:ip2']));
            expect(rateKeys).not.toContain('session:xyz');
        });

        it('clear() deletes all data', async () => {
            const s = getStorage();
            await s.setItem('temp:1', 'data');
            await s.clear();
            expect(await s.hasItem('temp:1')).toBe(false);
        });

        it('sets and gets an object value', async () => {
            const s = getStorage();
            await s.setItem('session:abc', { lastPath: '/dashboard' });
            expect(await s.getItem('session:abc')).toStrictEqual({ lastPath: '/dashboard' });
        });

        it('returns null for a missing key', async () => {
            expect(await getStorage().getItem('nonexistent:key')).toBeNull();
        });

        it('removeItem deletes the key', async () => {
            const s = getStorage();
            await s.setItem('rate:x', { score: 99 });
            await s.removeItem('rate:x');
            expect(await s.getItem('rate:x')).toBeNull();
        });

        it('overwrites an existing key', async () => {
            const s = getStorage();
            await s.setItem('canary:user', { banned: false, visitor_id: 'v1' });
            await s.setItem('canary:user', { banned: true, visitor_id: 'v1' });
            expect(await s.getItem<{ banned: boolean }>('canary:user')).toStrictEqual({ banned: true, visitor_id: 'v1' });
        });

        it('namespaced keys do not collide', async () => {
            const s = getStorage();
            await s.setItem('session:abc', { lastPath: '/a' });
            await s.setItem('rate:abc',    { score: 5 });
            expect(await s.getItem('session:abc')).toStrictEqual({ lastPath: '/a' });
            expect(await s.getItem('rate:abc')).toStrictEqual({ score: 5 });
        });
    });

    describe('initStorage(), lru driver', () => {
        it('sets and gets an object', async () => {
            const s = await initStorage({ driver: 'lru', max: 500 });
            await s.setItem('session:xyz', { lastPath: '/home' });
            expect(await s.getItem('session:xyz')).toStrictEqual({ lastPath: '/home' });
        });

        it('item expires after TTL', async () => {
            const s = await initStorage({ driver: 'lru', max: 500, ttl: 1 });
            await s.setItem('rate:expire', { score: 10 }, { ttl: 1 });
            await new Promise(r => setTimeout(r, 1100));
            expect(await s.getItem('rate:expire')).toBeNull();
        });

        it('item within TTL is still accessible', async () => {
            const s = await initStorage({ driver: 'lru', max: 500, ttl: 60 });
            await s.setItem('timing:alive', [1, 2, 3], { ttl: 60 });
            expect(await s.getItem('timing:alive')).toStrictEqual([1, 2, 3]);
        });

        it('removeItem works', async () => {
            const s = await initStorage({ driver: 'lru', max: 500 });
            await s.setItem('dns:1.2.3.4', { ip: '1.2.3.4', trustedBot: false });
            await s.removeItem('dns:1.2.3.4');
            expect(await s.getItem('dns:1.2.3.4')).toBeNull();
        });
    });

    describe('initStorage(),fs driver', () => {
        it('persists a value to disk', async () => {
            const s = await initStorage({ driver: 'fs', base: FS_BASE });
            await s.setItem('rep:user1', { isBot: false, score: 12 });
            expect(await s.getItem('rep:user1')).toStrictEqual({ isBot: false, score: 12 });
        });

        it('removeItem deletes the backing file', async () => {
            const s = await initStorage({ driver: 'fs', base: FS_BASE });
            await s.setItem('canary:abc', { banned: false, visitor_id: 'v2' });
            await s.removeItem('canary:abc');
            expect(await s.getItem('canary:abc')).toBeNull();
        });

        it('data survives re init from the same base path', async () => {
            const s1 = await initStorage({ driver: 'fs', base: FS_BASE });
            await s1.setItem('session:persist', { lastPath: '/checkout' });

            const s2 = await initStorage({ driver: 'fs', base: FS_BASE });
            expect(await s2.getItem('session:persist')).toStrictEqual({ lastPath: '/checkout' });
        });

        it('serializes complex objects', async () => {
            const s = getStorage();
            
            const now = new Date();
            await s.setItem('time:now', { createdAt: now });
            const retrievedTime = await s.getItem<{ createdAt: string }>('time:now');
            expect(typeof retrievedTime?.createdAt).toBe('string');
            expect(retrievedTime?.createdAt).toBe(now.toISOString());

            const ipSet = new Set(['1.1.1.1', '2.2.2.2']);
            await s.setItem('set:ips', { ips: ipSet });
            const retrievedSet = await s.getItem<any>('set:ips');
            expect(retrievedSet?.ips).not.toBeInstanceOf(Set);
        });
    });

    describe('ttl extensions', () => {
        it('updates the TTL when overwriting an existing key', async () => {
            const s = await initStorage({ driver: 'lru', max: 500 });
            
            await s.setItem('ban:ip', { active: true }, { ttl: 1 });
            
            await new Promise(r => setTimeout(r, 500));
            await s.setItem('ban:ip', { active: true }, { ttl: 2 });
            
            await new Promise(r => setTimeout(r, 1000));
            
            expect(await s.getItem('ban:ip')).not.toBeNull();
        });
    });
    
    describe('initStorage(), unsupported driver', () => {
        it('throws with the driver name in the message', async () => {
            await expect(initStorage({ driver: 'cassandra' } as any))
                .rejects.toThrow('Unsupported storage driver: cassandra');
        });
    });
});