import { LRUCache } from 'lru-cache';
export interface CachedResult {
    banned: boolean;
    visitor_id: number;
}
export declare const visitorCache: LRUCache<string, CachedResult, unknown>;
