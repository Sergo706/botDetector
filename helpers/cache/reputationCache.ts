import { LRUCache } from "lru-cache";
import { settings } from "../../settings.js";

export interface CachedResult {
    isBot: boolean;
    score: number;
  }
  
  export const reputationCache = new LRUCache<string, CachedResult>({
    max: 10_000,               
    ttl: settings.checksTimeRateControl.checkEvery      
  });