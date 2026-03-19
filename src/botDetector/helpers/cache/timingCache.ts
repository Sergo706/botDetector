import { getStorage } from '~~/src/botDetector/config/config.js';

const TIMING_TTL_SECONDS = 60 * 15;
const PREFIX = 'timing:';

export const timingCache = {
  async get(visitorId: string): Promise<number[] | null> {
    const key = `${PREFIX}${visitorId}`;
    return await getStorage().getItem<number[]>(key);
  },

  async set(visitorId: string, entry: number[]): Promise<void> {
    const key = `${PREFIX}${visitorId}`;
    await getStorage().setItem(key, entry, { ttl: TIMING_TTL_SECONDS });
  },

  async delete(visitorId: string): Promise<void> {
    const key = `${PREFIX}${visitorId}`;
    await getStorage().removeItem(key);
  },

  async clear(): Promise<void> {
    await getStorage().clear();
  }

};