import { LRUCache } from 'lru-cache';
import { settings } from '../../settings.js';

export interface CachedResult {
  banned: boolean;
  expires: number;
}

export const visitorCache = new LRUCache<string, CachedResult>({
  max: 10_000,               
  ttl: settings.checksTimeRateControl.checkEvery      
});