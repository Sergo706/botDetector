import { getLogger } from '../utils/logger.js';
import { getDb } from '../config/config.js';
import { prep } from './dialectUtils.js';

export async function updateIsBot(isBot: boolean, cookie: string) {
    const params = [isBot, cookie].map(v => v === undefined ? null : v);
    const db = getDb();
    const log = getLogger().child({ service: 'BOT DETECTOR', branch: 'db', type: 'updateIsBot' });

    try { 
        await prep(db, `UPDATE visitors SET is_bot = ? WHERE canary_id = ?`).run(...params)
    } catch (err: any) {
        log.error({ error: err }, 'ERROR UPDATING IS_BOT');
        throw err;
    }
}

  