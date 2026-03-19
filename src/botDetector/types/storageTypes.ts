import type redisDriver from 'unstorage/drivers/redis';
import type lruDriver from 'unstorage/drivers/lru-cache';
import type fsLiteDriver from 'unstorage/drivers/fs-lite';
import type upstashDriver from 'unstorage/drivers/upstash';
import type vercelRuntimeCacheDriver from "unstorage/drivers/vercel-runtime-cache";
import type cloudflareR2BindingDriver from "unstorage/drivers/cloudflare-r2-binding";
import type cloudflareKVBindingDriver from "unstorage/drivers/cloudflare-kv-binding";
import type cloudflareKVHTTPDriver from "unstorage/drivers/cloudflare-kv-http";


type Opts<T extends (opts?: any) => any> = NonNullable<Parameters<T>[0]>;

export type SupportedDrivers = {
    upstash: Opts<typeof upstashDriver>;
    'lru': Opts<typeof lruDriver>;
    redis: Opts<typeof redisDriver>;
    'fs': Opts<typeof fsLiteDriver>;
    'cloudflare-kv-binding': Opts<typeof cloudflareKVBindingDriver>
    'cloudflare-kv-http': Opts<typeof cloudflareKVHTTPDriver>
    'cloudflare-r2-binding': Opts<typeof cloudflareR2BindingDriver>
    'vercel': Opts<typeof vercelRuntimeCacheDriver>
};

export type CacheConfig = {
    [K in keyof SupportedDrivers]: { driver: K } & SupportedDrivers[K]
}[keyof SupportedDrivers];