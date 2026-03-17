import { getPool } from '../config/dbConnection.js';
import { getLogger } from '../utils/logger.js';

export async function updateScore(score: number, cookie: string) {
  const params = [score, cookie].map(v => v === undefined ? null : v);
  const pool = getPool();
  const log = getLogger().child({ service: 'BOT DETECTOR', branch: 'db', type: 'updateScore' });

  try {
    await pool.execute(`UPDATE visitors SET suspicious_activity_score = ? WHERE canary_id = ?`, params);
  } catch (err: any) {
    log.error({ error: err }, 'ERROR UPDATING SCORE');
    throw err;
  }
}

  