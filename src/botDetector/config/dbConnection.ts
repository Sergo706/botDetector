import { getConfiguration } from './config.js';
import type { Pool as PromisePool } from 'mysql2/promise';

let mainPool: PromisePool | undefined;

/**
 * Returns the main promise-based MySQL pool used by the botDetector lib.
 * This pool must be injected via `configuration({ store: { main: ... } })`.
 */
export function getPool(): PromisePool {
  if (mainPool) return mainPool;

  const { storeAndTelegram } = getConfiguration()

  if (!storeAndTelegram.store.main) {
    throw new Error('botDetector lib: store.main (MySQL pool) must be provided in configuration()');
  }

  mainPool = storeAndTelegram.store.main;
  console.log('botDetector lib connected to main DB pool');
  return mainPool;
}
