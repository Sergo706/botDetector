import { LRUCache } from "lru-cache";
import { getConfiguration } from "../../config/config.js";

export interface CachedResult {
    isBot: boolean;
    score: number;
  }
  
let cache: LRUCache<string, CachedResult> | undefined;

export function getReputationCache() {
    if (cache) return cache;

    const {checksTimeRateControl} = getConfiguration()

    cache = new LRUCache({ max: 10_000, ttl: checksTimeRateControl.checkEvery }); 
    return cache; 
  }