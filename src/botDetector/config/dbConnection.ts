import { getBotDetectorConfig } from './secret.js';
import mysql2 from 'mysql2/promise';
import type { Pool as PromisePool } from 'mysql2/promise';
let pool: mysql2.Pool;
let mainPool: PromisePool | undefined;

/**
 * Returns the main promise-based MySQL pool used by the botDetector lib.
 * This pool must be injected via `configuration({ store: { main: ... } })`.
 */
export function getPool(): PromisePool {
  if (mainPool) return mainPool;

  const { store } = getBotDetectorConfig()

  if (!store?.main) {
    throw new Error('botDetector lib: store.main (MySQL pool) must be provided in configuration()');
  }

  mainPool = store.main;
  console.log('botDetector lib connected to main DB pool');
  return mainPool;
}

