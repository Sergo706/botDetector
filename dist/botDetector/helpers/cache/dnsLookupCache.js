import { LRUCache } from 'lru-cache';
export const dnsCache = new LRUCache({
    max: 2000,
    ttl: 1000 * 60 * 60 * 2
});
