import { LRUCache } from 'lru-cache';


export interface CachedResult {
    ip: string;
    trustedBot: boolean;
  }

  export const dnsCache = new LRUCache<string, CachedResult>({
    max: 2000,               
    ttl: 1000 * 60 * 60 * 2  
  });