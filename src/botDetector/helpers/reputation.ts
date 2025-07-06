import { settings } from "../../settings.js";
import { getPool } from "../config/dbConnection.js";
import type { RowDataPacket } from 'mysql2';
import { updateScore } from "../db/updateVisitorScore.js";
import { sendLog } from "../utils/telegramLogger.js";
import { reputationCache } from "./cache/reputationCache.js";
import { getLogger } from "../utils/logger.js";

interface VisitorRow extends RowDataPacket {
  is_bot: number;
  suspicos_activity_score: number;  
}

export async function userReputaion(cookie: string): Promise<void> {
  const log = getLogger().child({service: `BOT DETECTOR`, branch: `reputation`})
  const pool = getPool()
  const botScore = settings.banScore

  const cached = reputationCache.get(cookie);
    if (cached) {
      log.info(`CACHE HIT cookie=${cookie} score=${cached.score} →  (botScore=${botScore})`)      
      if(cached.isBot) {
        return;
      }
   
    if (!cached.isBot && cached.score > 0 && cached.score < botScore) {
      log.info(`updating cache score cookie=${cookie} score=${cached.score} →  (botScore=${botScore})`)   
      const newReputation = Math.max(0, cached.score - settings.restoredReputaionPoints); 

      if (newReputation !== cached.score) {
        await updateScore(newReputation, cookie);
        log.info(`updating cache score to DB cookie=${cookie} score=${cached.score} →  (botScore=${botScore})`)
        reputationCache.set(cookie, {
          isBot: cached.isBot,
          score: newReputation
        });
      }
      log.info(`finished Updating Score from cache to DB cookie: ${cookie} NEW SCORE: ${newReputation}`)
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
  log.warn(`no visitor record for canary_id=${cookie}`)
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
log.info({
  label: '[REP-GATE]',
  isBot: isBot,
  score: reputation,
  'score>0': reputation > 0,
  'score<ban': reputation < botScore,
  healPts: settings.restoredReputaionPoints
})


if (!isBot && reputation > 0 && reputation < botScore) {
  log.info(`calculating new score cookie=${cookie} score=${reputation} →  (botScore=${botScore})`)
  const newReputation = Math.max(0, reputation - settings.restoredReputaionPoints); 
  if (newReputation !== reputation) { 
    await updateScore(newReputation, cookie)
      log.info(`Update Score for cookie', ${cookie}, 'New Score:', ${newReputation}`)
    reputationCache.set(cookie, {
      isBot: isBot,
      score: newReputation
    });
  }
}
} catch(err) {
    sendLog('An error occured updating visitor reputation', `\nError Messege: ${err}`)
    log.error({err},`An error occured updating visitor reputation`)
}
}
