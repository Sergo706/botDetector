import { getLogger } from '../utils/logger.js';
import type { BannedInfo } from '../types/checkersTypes.js';
import { getDb } from '../config/config.js';
import { prep, onUpsert, excluded } from './dialectUtils.js';

export async function updateBannedIP(
  cookie: string,
  ipAddress: string,
  country: string,
  user_agent: string,
  info: BannedInfo
) {
  const db = getDb();
  const log = getLogger().child({ service: 'BOT DETECTOR', branch: 'db', type: 'updateBannedIP' });
  const reasonPayload = JSON.stringify(info.reasons);
  const params = [cookie, ipAddress, country, user_agent, reasonPayload, info.score] satisfies (string | number)[];
  
  const ex = (col: string) => excluded(db, col);
  const upsert = onUpsert(db, 'canary_id');
  try {
    await prep(db,
      `INSERT INTO banned (canary_id, ip_address, country, user_agent, reason, score)
       VALUES (?, ?, ?, ?, ?, ?)
       ${upsert}
       ip_address = ${ex('ip_address')},
       country = ${ex('country')},
       user_agent = ${ex('user_agent')},
       score = ${ex('score')},
       reason = ${ex('reason')}`
    ).run(...params);
    log.info(`Updated Database TABLE - banned. A user has been banned for IP ${ipAddress} (score ${String(info.score)})`);
  } catch (err: unknown) {
    log.error({ error: err }, 'ERROR UPDATING "banned" TABLE');
    throw err;
  }
}
