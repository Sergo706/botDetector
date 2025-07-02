import { LRUCache } from 'lru-cache';
export const rateCache = new LRUCache({
    max: 10000,
    ttl: 1000 * 60 * 2,
    updateAgeOnGet: true
});
