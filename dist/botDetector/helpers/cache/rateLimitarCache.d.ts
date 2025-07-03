import { LRUCache } from 'lru-cache';
export interface CachedResult {
    score: number;
    timestamp: number;
    request_count: number;
}
export declare const rateCache: LRUCache<string, CachedResult, unknown>;
