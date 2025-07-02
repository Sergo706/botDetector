import { ParsedUAResult } from '../types/UAparserTypes.js';
import { UAParser, UAParserExt } from 'ua-parser-js';
import { isAIBot, isBot } from 'ua-parser-js/helpers';
import { CLIs, Crawlers, Fetchers, Libraries } from 'ua-parser-js/extensions';


export function parseUA(userAgent: string | number): ParsedUAResult  {

  
  const botParser = new UAParser(
    [Crawlers, CLIs, Fetchers, Libraries] as UAParserExt
  );
  
  const uaString = typeof userAgent === 'string'
    ? userAgent
    : String(userAgent);


  const result = botParser.setUA(uaString).getResult();

  return {
    device: result.device?.type || 'desktop',
    deviceVendor: result.device?.vendor || 'unknown',
    deviceModel: result.device?.model || 'unknown',
    browser: result.browser?.name || 'unknown',
    browserType: result.browser?.type || 'unknown',
    browserVersion: result.browser?.version || 'unknown',
    os: result.os?.name || 'unknown',
    botAI: isAIBot(result),
    bot: isBot(result),
    
    allResults: result,
  };

}
export default parseUA;



