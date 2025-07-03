import { LRUCache } from 'lru-cache';
export const botIPCache = new LRUCache({
    max: 5000,
    ttl: 1000 * 60 * 60 * 24 * 90
});
