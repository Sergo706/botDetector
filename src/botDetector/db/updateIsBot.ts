import { getLogger } from '../utils/logger.js';
import { getDb } from '../config/config.js';
import { prep } from './dialectUtils.js';

export async function updateIsBot(isBot: boolean, cookie: string) {
    const params = [isBot, cookie] satisfies (string | boolean)[];
    const db = getDb();
    const log = getLogger().child({ service: 'BOT DETECTOR', branch: 'db', type: 'updateIsBot' });

    try { 
        await prep(db, `UPDATE visitors SET is_bot = ? WHERE canary_id = ?`).run(...params);
    } catch (err: unknown) {
        log.error({ err }, 'ERROR UPDATING IS_BOT');
        throw err;
    }
}

  