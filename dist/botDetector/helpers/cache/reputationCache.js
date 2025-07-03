import { LRUCache } from "lru-cache";
import { settings } from "../../../settings.js";
export const reputationCache = new LRUCache({
    max: 10000,
    ttl: settings.checksTimeRateControl.checkEvery
});
