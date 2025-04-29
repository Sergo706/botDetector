import { isBotFromTrustedDomain } from "../helpers/checkGoodBotDomain.js";
import suffix from '../db/json/suffix.json' with { type: 'json' };
import { settings } from '../settings.js';
import { isBotIPTrusted } from "../helpers/checkBotsIps.js";

const userAgents: string[] = Object.values(suffix)
  .flatMap((e: any) =>
    Array.isArray(e.useragent) ? e.useragent : [e.useragent]
  )
  .map(u => u.toLowerCase());


export async function validateGoodBots(browserType: string, browserName: string, ipAddress: string): Promise<{ score: number, isBadBot: boolean, isGoodBot: boolean }> {

  let score: number = 0;

  const type = browserType.toLowerCase();
  if (type !== 'crawler' && type !== 'fetcher') {
    return { score: 0, isBadBot: false, isGoodBot: false };
  }

  const name = browserName.toLowerCase();
  const botsWithoutSuffix  = ['duckduckbot','gptbot','oai-searchbot','chatgpt-user'].includes(name);
  const botsWithSuffix = userAgents.some(suf => name.includes(suf));


    //If settings.banUnlistedBots is true any bot not listed in suffix.json or botsWithoutSuffix will be banned.
    //Everything else exact names and any unknown bots when banning is off—hits the IP-range check.
    if (settings.banUnlistedBots && !botsWithoutSuffix && !botsWithSuffix) {
        return { score: 0, isBadBot: true, isGoodBot: false };   
    }

    let trusted: boolean;

    if (botsWithSuffix) {
      trusted = await isBotFromTrustedDomain(ipAddress);
    } else {
      trusted = isBotIPTrusted(ipAddress);
    }

    if (!trusted) {
      return {
        score: settings.penalties.badGoodbot,
        isBadBot: true,
        isGoodBot: false
      };
    }

  return {score, isBadBot: false, isGoodBot: true};
}
