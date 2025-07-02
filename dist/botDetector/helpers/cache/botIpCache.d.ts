import { LRUCache } from 'lru-cache';
export interface CachedResult {
    validIP: boolean;
}
export declare const botIPCache: LRUCache<string, CachedResult, unknown>;
