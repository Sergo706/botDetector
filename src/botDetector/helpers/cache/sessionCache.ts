import { LRUCache } from 'lru-cache';

export interface SessionEntry {
  lastPath: string;
}

// 10-minute TTL — long enough to track a navigation session
export const sessionCache = new LRUCache<string, SessionEntry>({
  max: 10_000,
  ttl: 1000 * 60 * 10,
  updateAgeOnGet: true,
});
