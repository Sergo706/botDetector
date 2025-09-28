import { LRUCache } from "lru-cache";
import { getConfiguration } from "../../config/config.js";

export interface CachedResult {
    isBot: boolean;
    score: number;
  }
  
  function config() {
    const {checksTimeRateControl} = getConfiguration()
    return checksTimeRateControl.checkEvery;
  }
  
  export const reputationCache = new LRUCache<string, CachedResult>({
    max: 10_000,               
    ttl: config()   
  });