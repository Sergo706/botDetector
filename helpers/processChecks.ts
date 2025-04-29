import { settings } from "../settings.js";
import { BanReasonCode } from "../types/checkersTypes.js";


export async function processChecks(
 checks: Array<() => Promise<{ score: number; reasons?: BanReasonCode[] }>>,
    botScore: number,
    reasons: BanReasonCode[],
    phaseLabel = 'phase' 
  ): Promise<number> {

    const reqId = Date.now();                
    console.time(`${phaseLabel}-${reqId}`);
    let banLimit = settings.banScore

    for (const runCheck of checks) {
      const label = runCheck.name || 'anon';
      console.time(`${label}-${reqId}`);

      const { score, reasons: rs = [] } = await runCheck();
      console.timeEnd(`${label}-${reqId}`);
      console.log(`Check →`, `${label}-${reqId}`, 'score=', score, 'reasons=', rs);
  
      botScore += score;
      rs.forEach(r => reasons.push(r));
  
      if (botScore >= banLimit) {
        console.log(`[DEBUG] Bot detected with score ${botScore}`);
        break;
      }
    }
    return botScore;
  }