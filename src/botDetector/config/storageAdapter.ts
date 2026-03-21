import { createStorage } from 'unstorage';
import memoryDriver from 'unstorage/drivers/memory';
import type { Driver } from 'unstorage';
import type { CacheConfig } from '../types/storageTypes.js';


export async function initStorage(config?: CacheConfig) {

    if (!config) {
        return createStorage({ driver: memoryDriver() });
    }

    const { driver, ...opts } = config;
    let mod: { default: (opts?: any) => Driver };

    switch (driver) {
        case 'redis':
            mod = await import('unstorage/drivers/redis');
            break;
        case 'upstash':
            mod = await import('unstorage/drivers/upstash');
            break;
        case 'lru':
            mod = await import('unstorage/drivers/lru-cache');
            break;
        case 'fs':
            mod = await import('unstorage/drivers/fs-lite');
            break;
        case 'cloudflare-kv-binding':
            mod = await import('unstorage/drivers/cloudflare-kv-binding');
            break;
        case 'cloudflare-kv-http':
            mod = await import('unstorage/drivers/cloudflare-kv-http');
            break;
        case 'cloudflare-r2-binding':
            mod = await import('unstorage/drivers/cloudflare-r2-binding');
            break;
        case 'vercel':
            mod = await import('unstorage/drivers/vercel-runtime-cache');
            break;
        default:
            driver satisfies never;
            throw new Error(`Unsupported storage driver: ${driver}`);
    }

    return createStorage({ driver: mod.default(opts) });
}
