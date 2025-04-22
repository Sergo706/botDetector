import { pool } from '../../config/dbConnection.js';
import { sendLog } from '../../utils/telegramLogger.js';

export async function updateScore( score: number, cookie: string) {
   const params = [ score, cookie ].map(v => v === undefined ? null : v);

    try { 
 await pool.execute(`UPDATE visitors SET suspicos_activity_score = ? WHERE canary_id = ?`, params);
 } catch(err) {
    sendLog('ERROR UPDATING SCORE', `An error occured when trying to update the score column in the visitors table. ${err}`)
    throw err;
 }
}

  