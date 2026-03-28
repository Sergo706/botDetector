import { getLogger } from '../utils/logger.js';
import { getDb } from '../config/config.js';
import { prep } from './dialectUtils.js';

export async function updateScore(score: number, cookie: string) {
  const params = [score, cookie] satisfies (string | number)[];
  const db = getDb();
  const log = getLogger().child({ service: 'BOT DETECTOR', branch: 'db', type: 'updateScore' });

  try {
    await prep(db, `UPDATE visitors SET suspicious_activity_score = ? WHERE canary_id = ?`).run(...params);
  } catch (err: unknown) {
    log.error({ err }, 'ERROR UPDATING SCORE');
    throw err;
  }
}

  