import { getDb } from '../config/config.js';
import { prep } from './dialectUtils.js';

export async function warmUp() {
const db = getDb();
await Promise.all(
  Array.from({ length: 10 }, () => db.sql`SELECT 1`)
);

await prep(db,
  `SELECT last_seen, request_count
     FROM visitors
    WHERE canary_id = ?
    LIMIT 1`
).get('00000000‑warm‑up‑row');

console.info('botDetector is ready!');
}