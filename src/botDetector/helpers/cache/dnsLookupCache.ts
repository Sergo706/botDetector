import { getStorage } from '~~/src/botDetector/config/config.js';

export interface CachedResult {
  ip: string;
  trustedBot: boolean;
}

const DNS_TTL_SECONDS = 60 * 60 * 2;
const PREFIX = 'dns:';

export const dnsCache = {
  async get(ip: string): Promise<CachedResult | null> {
    return getStorage().getItem<CachedResult>(`${PREFIX}${ip}`);
  },

  async set(ip: string, entry: CachedResult): Promise<void> {
    await getStorage().setItem(`${PREFIX}${ip}`, entry, { ttl: DNS_TTL_SECONDS });
  },

  async delete(ip: string): Promise<void> {
    await getStorage().removeItem(`${PREFIX}${ip}`);
  },

  async clear(): Promise<void> {
    await getStorage().clear();
  }
};