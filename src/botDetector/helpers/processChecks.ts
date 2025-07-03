import { settings } from "../../settings.js";
import { BanReasonCode } from "../types/checkersTypes.js";
import { getLogger } from "../utils/logger.js";
import { performance } from 'perf_hooks';

export async function processChecks(
 checks: Array<() => Promise<{ score: number; reasons?: BanReasonCode[] }>>,
    botScore: number,
    reasons: BanReasonCode[],
    phaseLabel = 'phase' 
  ): Promise<number> {

    const log = getLogger().child({service: `BOT DETECTOR`, branch: 'checks'})
    const reqId = Date.now(); 

    const phaseStart = performance.now()
    log.info({ phase: phaseLabel, reqId, event: 'start' });
                 
    let banLimit = settings.banScore

    for (const runCheck of checks) {
      const label = runCheck.name || 'anon';

      const checkStart = performance.now()
      log.info({ reqId, check: label, event: 'start' })

      const { score, reasons: rs = [] } = await runCheck();

      const checkEnd = performance.now()
      log.info({reqId,check: label,event: 'end',durationMs: +(checkEnd - checkStart).toFixed(3),score,reasons: rs,})

      botScore += score;
      rs.forEach(r => reasons.push(r));
  
      if (botScore >= banLimit) {
      log.warn({ reqId, botScore }, 'Bot detected — aborting checks');
        break;
      }
    }
  const phaseEnd = performance.now()
  log.info({
    reqId,
    phase: phaseLabel,
    event: 'end',
    durationMs: +(phaseEnd - phaseStart).toFixed(3),
    Score: botScore
  })
    return botScore;
  }