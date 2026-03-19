import { getStorage } from '~~/src/botDetector/config/config.js';

export interface CachedResult {
  score: number;
  timestamp: number;
  request_count: number;
}

const RATE_TTL_SECONDS = 60 * 2;
const PREFIX = 'rate:';

export const rateCache = {
  async get(cookie: string): Promise<CachedResult | null> {
    return getStorage().getItem<CachedResult>(`${PREFIX}${cookie}`);
  },

  async set(cookie: string, entry: CachedResult): Promise<void> {
    await getStorage().setItem(`${PREFIX}${cookie}`, entry, { ttl: RATE_TTL_SECONDS });
  },

  async delete(cookie: string): Promise<void> {
    await getStorage().removeItem(`${PREFIX}${cookie}`);
  },

  async clear(): Promise<void> {
    await getStorage().clear();
  }
};