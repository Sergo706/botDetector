import { getPool } from '../config/dbConnection.js';
import { sendLog } from '../utils/telegramLogger.js';

export async function updateScore( score: number, cookie: string) {
   const params = [ score, cookie ].map(v => v === undefined ? null : v);
   const pool = getPool()
    try { 
 await pool.execute(`UPDATE visitors SET suspicious_activity_score = ? WHERE canary_id = ?`, params);
 } catch(err) {
    sendLog('ERROR UPDATING SCORE', `An error occurred when trying to update the score column in the visitors table. ${err}`)
    throw err;
 }
}

  