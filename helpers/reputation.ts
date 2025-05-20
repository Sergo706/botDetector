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
      console.info(
        `[REPUTATION] CACHE HIT cookie=${cookie} score=${cached.score} →  (botScore=${botScore})`);
      
      if(cached.isBot) {
        return;
      }
   
    if (!cached.isBot && cached.score > 0 && cached.score < botScore) {
      console.info(
        `[REPUTATION] updating cache score cookie=${cookie} score=${cached.score} →  (botScore=${botScore})`);
      const newReputation = Math.max(0, cached.score - settings.restoredReputaionPoints); 

      if (newReputation !== cached.score) {
        await updateScore(newReputation, cookie);
        console.info(
          `[REPUTATION] updating cache score to DB cookie=${cookie} score=${cached.score} →  (botScore=${botScore})`);
        reputationCache.set(cookie, {
          isBot: cached.isBot,
          score: newReputation
        });
      }
      console.info(`[REPUTATION.TS]: finished Updating Score from cache to DB cookie: ${cookie} NEW SCORE: ${newReputation}`)
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
let reputation = Number(visitor.suspicos_activity_score);


if (isBot) return;

if (!settings.setNewComputedScore) { 
reputationCache.set(cookie, {
    isBot:  isBot,
    score: reputation
});
}
console.table({
  label: '[REP-GATE]',
  isBot: isBot,
  score: reputation,
  'score>0': reputation > 0,
  'score<ban': reputation < botScore,
  healPts: settings.restoredReputaionPoints
});


if (!isBot && reputation > 0 && reputation < botScore) {
  console.info(
    `[REPUTATION] calculating new score cookie=${cookie} score=${reputation} →  (botScore=${botScore})`);
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
