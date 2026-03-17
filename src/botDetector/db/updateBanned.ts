import { getPool } from '../config/dbConnection.js';
import { getLogger } from '../utils/logger.js';
import type { BannedInfo } from '../types/checkersTypes.js';

export async function updateBannedIP(
  cookie: string,
  ipAddress: string,
  country: string,
  user_agent: string,
  info: BannedInfo
) {
  const pool = getPool();
  const log = getLogger().child({ service: 'BOT DETECTOR', branch: 'db', type: 'updateBannedIP' });
  const reasonPayload = JSON.stringify(info.reasons);
  const params = [cookie, ipAddress, country, user_agent, reasonPayload, info.score].map(v => v === undefined ? null : v);
  
  try { 
    await pool.execute(
      `INSERT INTO banned (canary_id, ip_address, country, user_agent, reason, score)
       VALUES (?, ?, ?, ?, ?, ?)
       
       ON DUPLICATE KEY UPDATE
       ip_address = VALUES(ip_address),
       country = VALUES(country),
       user_agent = VALUES(user_agent),
       score = VALUES(score),
       reason = VALUES(reason)`,
      params
    );
    log.info(`Updated Database TABLE - banned. A user has been banned for IP ${ipAddress} (score ${info.score})`);
  } catch (err: any) {
    log.error({ error: err }, 'ERROR UPDATING "banned" TABLE');
    throw err;
  }
}
