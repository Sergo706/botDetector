import { LRUCache } from "lru-cache";
export interface CachedResult {
    isBot: boolean;
    score: number;
}
export declare const reputationCache: LRUCache<string, CachedResult, unknown>;
