import { pool } from '../config/dbConnection.js';
import { sendLog } from '../utils/telegramLogger.js';
export async function updateBannedIP(cookie, ipAddress, country, user_agent, info) {
    const reasonPayload = JSON.stringify(info.reasons);
    const params = [cookie, ipAddress, country, user_agent, reasonPayload, info.score].map(v => v === undefined ? null : v);
    try {
        await pool.execute(`INSERT INTO banned (canary_id, ip_address, country, user_agent, reason, score)
     VALUES (?, ?, ?, ?, ?, ?)
     
     ON DUPLICATE KEY UPDATE
     ip_address = VALUES(ip_address),
     country = VALUES(country),
     user_agent = VALUES(user_agent),
     score = VALUES(score),
     reason = VALUES(reason)`, params);
        await sendLog('Updated Database TABLE - banned', `A user been banned and the "banned" table has been updated. New ban saved for IP ${ipAddress} (score ${info.score}`);
    }
    catch (err) {
        await sendLog('ERROR UPDATING "banned" TABLE', err);
        throw err;
    }
}
