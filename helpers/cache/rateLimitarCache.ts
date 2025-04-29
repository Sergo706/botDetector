import { LRUCache } from 'lru-cache';

export interface CachedResult {
  score: number;
  timestamp: number;
  request_count: number;
}

export const rateCache = new LRUCache<string, CachedResult>({
  max: 10_000,               
  ttl: 1000 * 60 * 2,
  updateAgeOnGet: true      
});