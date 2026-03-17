import { getPool } from '../config/dbConnection.js';
import { getLogger } from '../utils/logger.js';

export async function updateIsBot(isBot: boolean, cookie: string) {
    const params = [isBot, cookie].map(v => v === undefined ? null : v);
    const pool = getPool();
    const log = getLogger().child({ service: 'BOT DETECTOR', branch: 'db', type: 'updateIsBot' });

    try { 
        await pool.execute(`UPDATE visitors SET is_bot = ? WHERE canary_id = ?`, params);
    } catch (err: any) {
        log.error({ error: err }, 'ERROR UPDATING IS_BOT');
        throw err;
    }
}

  