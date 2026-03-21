import { reputationCache } from "./cache/reputationCache.js";
import { getLogger } from "../utils/logger.js";
import { getBatchQueue, getConfiguration, getDb } from "../config/config.js";
import { prep } from "../db/dialectUtils.js";

interface VisitorRow {
  is_bot: number;
  suspicious_activity_score: number;
}

export async function userReputation(cookie: string): Promise<void> {
  const log = getLogger().child({service: `BOT DETECTOR`, branch: `reputation`});
  const db = getDb();
  const {banScore, restoredReputationPoints, setNewComputedScore} = getConfiguration();

  const botScore = banScore;

  const cached = await reputationCache.get(cookie);
    if (cached) {
      log.info(`CACHE HIT cookie=${cookie} score=${String(cached.score)} →  (botScore=${String(botScore)})`);
      if(cached.isBot) {
        return;
      }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!cached.isBot && cached.score > 0 && cached.score < botScore) {
      log.info(`updating cache score cookie=${cookie} score=${String(cached.score)} →  (botScore=${String(botScore)})`);
      const newReputation = Math.max(0, cached.score - restoredReputationPoints);

      if (newReputation !== cached.score) {
        void getBatchQueue().addQueue(cookie, '', 'score_update', { score: newReputation, cookie }, 'deferred');
        log.info(`updating cache score to DB cookie=${cookie} score=${String(cached.score)} →  (botScore=${String(botScore)})`);
        reputationCache.set(cookie, {
          isBot: cached.isBot,
          score: newReputation
        }).catch((err: unknown) => {
          log.error({ err }, 'Failed to save reputationCache in storage');
        });
      }
      log.info(`finished Updating Score from cache to DB cookie: ${cookie} NEW SCORE: ${String(newReputation)}`);
    }
    return;
  }


    try {
        const VisitorQuery = `
        SELECT is_bot,
        suspicious_activity_score
        FROM visitors
          WHERE canary_id = ?
          LIMIT 1`;

        const visitor = await prep(db, VisitorQuery).get(cookie) as VisitorRow | undefined;

        if (!visitor)  {
          log.warn(`no visitor record for canary_id=${cookie}`);
          return;
        }

        const isBot = visitor.is_bot === 0 ? false : true;
        const reputation = visitor.suspicious_activity_score;


        if (isBot) return;

        if (!setNewComputedScore) {
            reputationCache.set(cookie, {
                isBot:  isBot,
                score: reputation
            }).catch((err: unknown) => {
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
        });


        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!isBot && reputation > 0 && reputation < botScore) {
          log.info(`calculating new score cookie=${cookie} score=${String(reputation)} →  (botScore=${String(botScore)})`);
          const newReputation = Math.max(0, reputation - restoredReputationPoints);

          if (newReputation !== reputation) {
            void getBatchQueue().addQueue(cookie, '', 'score_update', { score: newReputation, cookie }, 'deferred');
            log.info(`Update Score for cookie', ${cookie}, 'New Score:', ${String(newReputation)}`);

            reputationCache.set(cookie, {
              isBot: isBot,
              score: newReputation
            }).catch((err: unknown) => {
                log.error({ err }, 'Failed to save reputationCache in storage');
            });
          }

        }
      } catch(err) {
          log.error({err},`An error occurred updating visitor reputation`);
      }
}