import { BanReasonCode, IBotChecker } from "../types/checkersTypes.js";
import { getLogger } from "../utils/logger.js";
import { performance } from 'perf_hooks';
import { getConfiguration } from "../config/config.js";
import { ValidationContext } from "../types/botDetectorTypes.js";
import { BotDetectorConfig } from "../types/configSchema.js";
import { BadBotDetected, GoodBotDetected } from "./exceptions.js";

export async function processChecks(
  checkers: IBotChecker<any>[],
  ctx: ValidationContext<any>,
  config: BotDetectorConfig,
  botScore: number,
  reasons: BanReasonCode[],
  phaseLabel = 'phase' 
): Promise<number> {

    const {banScore} = getConfiguration()
    const log = getLogger().child({service: `BOT DETECTOR`, branch: 'checks'})
    const reqId = Date.now(); 

    const phaseStart = performance.now()
    log.info({ phase: phaseLabel, reqId, event: 'start' });
                 
    const banLimit = banScore

    for (const checker of checkers) {
      const label = checker.name;

      const checkStart = performance.now()
      log.info({ reqId, check: label, event: 'start' })

      const { score, reasons: rs = [] } = await checker.run(ctx, config);

      const checkEnd = performance.now()
      log.info({reqId,check: label,event: 'end',durationMs: +(checkEnd - checkStart).toFixed(3),score,reasons: rs,})

      botScore += score;
      rs.forEach(r => reasons.push(r as BanReasonCode));
  
      if (rs.includes('GOOD_BOT_IDENTIFIED')) throw new GoodBotDetected();
      if (rs.includes('BAD_BOT_DETECTED')) throw new BadBotDetected();

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