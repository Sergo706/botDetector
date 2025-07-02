import { pool } from '../config/dbConnection.js';
export async function warmUp() {
    await Promise.all(Array.from({ length: 10 }, () => pool.query('SELECT 1')));
    await pool.execute(`SELECT last_seen, request_count
     FROM visitors
    WHERE canary_id = ?
    LIMIT 1`, ['00000000‑warm‑up‑row']);
    console.info('DB pool and statements warmed!');
}
