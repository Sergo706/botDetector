import { getStorage, getConfiguration } from '../../config/config.js';

export interface CachedResult {
  banned: boolean;
  visitor_id: string;
}

const PREFIX = 'visitor:';

export const visitorCache = {
  async get(cookie: string): Promise<CachedResult | null> {
    return getStorage().getItem<CachedResult>(`${PREFIX}${cookie}`);
  },

  async set(cookie: string, entry: CachedResult): Promise<void> {
    const { checksTimeRateControl } = getConfiguration();
    await getStorage().setItem(`${PREFIX}${cookie}`, entry, { ttl: Math.floor(checksTimeRateControl.checkEvery / 1000) });
  },

  async delete(cookie: string): Promise<void> {
    await getStorage().removeItem(`${PREFIX}${cookie}`);
  },

  async clear(): Promise<void> {
    await getStorage().clear();
  }
};