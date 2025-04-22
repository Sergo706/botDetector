import { isGoogleBot } from "../helpers/isGoogleBot.js";
import { settings } from '../settings.js';

export async function validateGoodBots(browserType: string, browserName: string, ipAddress: string): Promise<{ score: number, isBadBot: boolean, isGoodBot: boolean }> {
  let score: number = 0;

  if (browserType === 'crawler' || browserType === 'fetcher') {
    if (browserName === "googlebot" || browserName === 'google' || browserName.startsWith('google')) {
      const trusted = await isGoogleBot(ipAddress);
      if (!trusted) { 
        const score = settings.penalties.badGoodbot;

        return {score, isBadBot: true, isGoodBot: false};
      }
    } 
    // await updateScore(0, cookie);
    return {score, isBadBot: false, isGoodBot: true};
  }

  return {score, isBadBot: false, isGoodBot: false};
}