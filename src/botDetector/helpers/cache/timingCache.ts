import { LRUCache } from 'lru-cache';

// Stores the last N request timestamps (ms) per canary
export const timingCache = new LRUCache<string, number[]>({
  max: 10_000,
  ttl: 1000 * 60 * 15,
  updateAgeOnGet: true,
});
