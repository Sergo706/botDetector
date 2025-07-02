import { LRUCache } from 'lru-cache';

export interface CachedResult {
  validIP: boolean;
}

export const botIPCache = new LRUCache<string, CachedResult>({
  max: 5000,               
  ttl: 1000 * 60 * 60 * 24 * 90     
});