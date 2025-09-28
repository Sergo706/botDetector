import { LRUCache } from 'lru-cache';
import { getConfiguration } from '../../config/config.js';

export interface CachedResult {
  banned: boolean;
  visitor_id: number;
}

function config() {
  const {checksTimeRateControl} = getConfiguration()
  return checksTimeRateControl.checkEvery;
}

export const visitorCache = new LRUCache<string, CachedResult>({
  max: 10_000,               
  ttl: config()     
});