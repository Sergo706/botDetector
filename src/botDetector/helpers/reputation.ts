import { reputationCache } from "./cache/reputationCache.js";
import { getLogger } from "../utils/logger.js";
import { getBatchQueue, getConfiguration, getDb } from "../config/config.js";
import { prep } from "../db/dialectUtils.js";

interface VisitorRow {
  is_bot: number;
  suspicious_activity_score: number;
}

export async function userReputation(cookie: string): Promise<void> {
  const log = getLogger().child({service: `BOT DETECTOR`, branch: `reputation`})
  const db = getDb()
  const {banScore, restoredReputationPoints, setNewComputedScore} = getConfiguration()

  const botScore = banScore

  const cached = await reputationCache.get(cookie);
    if (cached) {
      log.info(`CACHE HIT cookie=${cookie} score=${cached.score} →  (botScore=${botScore})`)
      if(cached.isBot) {
        return;
      }

    if (!cached.isBot && cached.score > 0 && cached.score < botScore) {
      log.info(`updating cache score cookie=${cookie} score=${cached.score} →  (botScore=${botScore})`)
      const newReputation = Math.max(0, cached.score - restoredReputationPoints);

      if (newReputation !== cached.score) {
        getBatchQueue().addQueue(cookie, '', 'score_update', { score: newReputation, cookie }, 'deferred');
        log.info(`updating cache score to DB cookie=${cookie} score=${cached.score} →  (botScore=${botScore})`)
        reputationCache.set(cookie, {
          isBot: cached.isBot,
          score: newReputation
        }).catch((err) => {
          log.error({ err }, 'Failed to save reputationCache in storage');
        });
      }
      log.info(`finished Updating Score from cache to DB cookie: ${cookie} NEW SCORE: ${newReputation}`)
    }
    return;
  }


    try {
        const VisitorQuery: string = `
        SELECT is_bot,
        suspicious_activity_score
        FROM visitors
          WHERE canary_id = ?
          LIMIT 1`

        const visitor = await prep(db, VisitorQuery).get(cookie) as VisitorRow | undefined

        if (!visitor || visitor === undefined)  {
          log.warn(`no visitor record for canary_id=${cookie}`)
          return;
        }

        const isBot = visitor.is_bot === 0 ? false : true;
        let reputation = Number(visitor.suspicious_activity_score);


        if (isBot) return;

        if (!setNewComputedScore) {
            reputationCache.set(cookie, {
                isBot:  isBot,
                score: reputation
            }).catch((err) => {
              log.error({ err }, 'Failed to save reputationCache in storage');
            });
        }

        log.info({
          label: '[REP-GATE]',
          isBot: isBot,
          score: reputation,
          'score>0': reputation > 0,
          'score<ban': reputation < botScore,
          healPts: restoredReputationPoints
        })


        if (!isBot && reputation > 0 && reputation < botScore) {
          log.info(`calculating new score cookie=${cookie} score=${reputation} →  (botScore=${botScore})`)
          const newReputation = Math.max(0, reputation - restoredReputationPoints);

          if (newReputation !== reputation) {
            getBatchQueue().addQueue(cookie, '', 'score_update', { score: newReputation, cookie }, 'deferred');
            log.info(`Update Score for cookie', ${cookie}, 'New Score:', ${newReputation}`)

            reputationCache.set(cookie, {
              isBot: isBot,
              score: newReputation
            }).catch((err) => {
                log.error({ err }, 'Failed to save reputationCache in storage');
            });
          }

        }
      } catch(err) {
          log.error({err},`An error occurred updating visitor reputation`)
      }
}