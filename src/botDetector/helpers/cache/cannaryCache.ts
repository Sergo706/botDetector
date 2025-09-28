import { LRUCache } from 'lru-cache';
import { getConfiguration } from '../../config/config.js';

export interface CachedResult {
  banned: boolean;
  visitor_id: number;
}

let cache: LRUCache<string, CachedResult> | undefined;

export function getVisitorCache() {
    if (cache) return cache;

    const {checksTimeRateControl} = getConfiguration()
    cache = new LRUCache({ max: 10_000, ttl: checksTimeRateControl.checkEvery }); 

    return cache; 
    
}