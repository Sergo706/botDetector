import consola from 'consola';
import { getStorage } from '~~/src/botDetector/config/config.js';

export interface SessionEntry {
  lastPath: string;
}

const SESSION_TTL_SECONDS = 600;
const PREFIX = 'session:';

export const sessionCache = {
  async get(sessionId: string): Promise<SessionEntry | null> {
    const key = `${PREFIX}${sessionId}`;
    const storage = getStorage();
    const data = await storage.getItem<SessionEntry>(key);

    if (data) {
      storage.setItem(key, data, { ttl: SESSION_TTL_SECONDS }).catch((err: unknown) => {
        consola.warn(`Failed to update session TTL for ${key}`, err);
      });
    }

    return data;
  },

  async set(sessionId: string, entry: SessionEntry): Promise<void> {
    const key = `${PREFIX}${sessionId}`;
    await getStorage().setItem(key, entry, { ttl: SESSION_TTL_SECONDS });
  },

  async delete(sessionId: string): Promise<void> {
    const key = `${PREFIX}${sessionId}`;
    await getStorage().removeItem(key);
  },

  async clear(): Promise<void> {
    await getStorage().clear();
  }

};