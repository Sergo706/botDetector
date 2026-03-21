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
    device: result.device.type ?? 'desktop',
    deviceVendor: result.device.vendor,
    deviceModel: result.device.model,
    browser: result.browser.name,
    browserType: result.browser.type,
    browserVersion: result.browser.version,
    os: result.os.name,
    botAI: isAIBot(result),
    bot: isBot(result),
    allResults: result,
  };

}
export default parseUA;



