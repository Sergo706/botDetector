import { settings } from "../settings.js";
import { pool } from "../config/dbConnection.js";
import type { RowDataPacket } from 'mysql2';
import { updateScore } from "../db/updateVisitorScore.js";
import { sendLog } from "../utils/telegramLogger.js";
import { reputationCache } from "./cache/reputationCache.js";


interface VisitorRow extends RowDataPacket {
  is_bot: number;
  suspicos_activity_score: number;  
}

export async function userReputaion(cookie: string): Promise<void> {
  const botScore = settings.banScore

  const cached = reputationCache.get(cookie);
    if (cached) {
      if(cached.isBot) {
        return;
      }
   
    if (!cached.isBot && cached.score > 0 && cached.score < botScore) {
      const newReputation = Math.max(0, cached.score - settings.restoredReputaionPoints); 

      if (newReputation !== cached.score) {
        await updateScore(newReputation, cookie);
        
        reputationCache.set(cookie, {
          isBot: cached.isBot,
          score: newReputation
        });
      }
      console.info(`[REPUTATION.TS]: Updated Score from cache to DB cookie: ${cookie} NEW SCORE: ${newReputation}`)
    }
    return; 
  }
    

    try { 
const VisitorQuery: string = `
SELECT is_bot, 
suspicos_activity_score
 FROM visitors
  WHERE canary_id = ?
  LIMIT 1`

const [rows] = await pool.execute<VisitorRow[]>(VisitorQuery,[cookie])
const visitor = rows[0];

if (!visitor || visitor === undefined)  {
  console.warn(`[REPUTATION.TS] no visitor record for canary_id=${cookie}`);
  return;
}

const isBot = visitor.is_bot === 0 ? false : true;
let reputation = visitor.suspicos_activity_score;


if (isBot) return;

reputationCache.set(cookie, {
    isBot:  isBot,
    score: reputation
});




if (!isBot && reputation > 0 && reputation < botScore) {
  const newReputation = Math.max(0, reputation - settings.restoredReputaionPoints); 
  if (newReputation !== reputation) { 
    await updateScore(newReputation, cookie)
    console.info('[REPUTATION.TS]: Update Score for cookie', cookie, 'New Score:', newReputation)
    reputationCache.set(cookie, {
      isBot: isBot,
      score: newReputation
    });
  }
}
} catch(err) {
    sendLog('An error occured updating visitor reputation', `\nError Messege: ${err}`)
    console.error(`An error occured updating visitor reputation, \n Error Messege: ${err}`)
}
}
