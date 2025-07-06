import { getPool } from '../config/dbConnection.js';
import { sendLog } from '../utils/telegramLogger.js';

export async function updateIsBot(isBot: boolean, cookie: string) {
    const params = [isBot, cookie].map(v => v === undefined ? null : v);
    const pool =  getPool()
    try { 
        await pool.execute(`UPDATE visitors SET is_bot = ? WHERE canary_id = ?`, params);
    } catch (err) {
        sendLog('ERROR UPDATING IS_BOT', `An error occurred when trying to update the is_bot column in the visitors table. ${err}`);
        throw err;
    }
}

  