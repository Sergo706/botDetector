import { LRUCache } from 'lru-cache';
import { settings } from '../../../settings.js';
export const visitorCache = new LRUCache({
    max: 10000,
    ttl: settings.checksTimeRateControl.checkEvery
});
