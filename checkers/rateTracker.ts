import pool from '../../../config/dbConnection.js';
import { RowDataPacket } from 'mysql2';
import { settings } from '../settings.js';

interface VisitorRow extends RowDataPacket {
  first_seen: Date;
  request_count: number;
}

const BEHAVIOURAL_THRESHOLD = settings.penalties.behaviorTooFast.behavioural_threshold;      
const BEHAVIOURAL_WINDOW    = settings.penalties.behaviorTooFast.behavioural_window;  
const BEHAVIOURAL_PENALTY   = settings.penalties.behaviorTooFast.behaviorPenalty;     


export async function behaviouralDbScore(cookie: string): Promise<number> {
  try { 
  // 1) Read existing first_seen and request_count
  const [rows] = await pool.execute<VisitorRow[]>(
    `SELECT first_seen, request_count
    FROM visitors
      WHERE canary_id = ?
      LIMIT 1;`,
    [cookie]
  );
  const visitor = rows[0];
  
  if (!visitor) return 0;
  
  // 2) Increment our count and update last_seen
  const newCount = visitor.request_count + 1;
  await pool.execute(
    `UPDATE visitors
        SET request_count = ?, last_seen = NOW()
      WHERE canary_id = ?`,
    [newCount, cookie]
  );

  // 3) Decide whether they’ve fired too fast
  const age = Date.now() - visitor.first_seen.getTime();
  if (newCount > BEHAVIOURAL_THRESHOLD && age <= BEHAVIOURAL_WINDOW) {
    return BEHAVIOURAL_PENALTY;
  } 
  } catch(err) {
    console.error('[ERROR] behaviouralDbScore failed:', err);
    throw err; //
  }

  return 0;
}
