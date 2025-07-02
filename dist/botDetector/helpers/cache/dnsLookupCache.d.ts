import { LRUCache } from 'lru-cache';
export interface CachedResult {
    ip: string;
    trustedBot: boolean;
}
export declare const dnsCache: LRUCache<string, CachedResult, unknown>;
