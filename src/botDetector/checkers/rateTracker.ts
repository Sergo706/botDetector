import { getPool } from '../config/dbConnection.js';
import { RowDataPacket } from 'mysql2';
import { settings } from '../../settings.js';
import { rateCache } from '../helpers/cache/rateLimitarCache.js';

interface VisitorRow extends RowDataPacket {
  last_seen: Date;
  request_count: number;
}

const BEHAVIOURAL_THRESHOLD = settings.penalties.behaviorTooFast.behavioural_threshold;      
const BEHAVIOURAL_WINDOW    = settings.penalties.behaviorTooFast.behavioural_window;  
const BEHAVIOURAL_PENALTY   = settings.penalties.behaviorTooFast.behaviorPenalty;     



  export async function behaviouralDbScore(cookie: string): Promise<number> {
    let score: number = 0;
    const pool = getPool()
    const cached = rateCache.get(cookie);
    
    if (cached) {
      console.log('[CACHE HIT] behaviouralDbScore');
      const ageSinceLastSeen = Date.now() - cached.timestamp;
        if (cached.request_count > BEHAVIOURAL_THRESHOLD && ageSinceLastSeen <= BEHAVIOURAL_WINDOW) {
          return cached.score;
        }
    } else {  console.log('[CACHE MISS or EXPIRED] behaviouralDbScore');}
   
    try {
      const [rows] = await pool.execute<VisitorRow[]>(
        `SELECT last_seen, request_count
         FROM visitors
         WHERE canary_id = ?
         LIMIT 1;`,
        [cookie]
      );
      const visitor = rows[0];
  
      if (!visitor) return score;
  

      const ageSinceLastSeen = Date.now() - visitor.last_seen.getTime();
      if (visitor.request_count > BEHAVIOURAL_THRESHOLD && ageSinceLastSeen <= BEHAVIOURAL_WINDOW) {
        score = BEHAVIOURAL_PENALTY;
      }
      rateCache.set(cookie, {
        score,
        timestamp: Date.now(),
        request_count: visitor.request_count,
      });

    } catch (err) {
      console.error('[ERROR] behaviouralDbScore failed:', err);
      throw err;
    }
  
    return score;
  }


