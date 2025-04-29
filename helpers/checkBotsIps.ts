import ipAddresses from '../db/json/ip-database.json' with { type: 'json' };
import { botIPCache } from './cache/botIpCache.js';
import ipRangeCheck from 'ip-range-check' 
import { settings } from '../settings.js';

const combinedIps: string[] = [
    ...ipAddresses.openai.flatMap(e => e.prefixes.map(p => p.ipv4Prefix)),
    ...ipAddresses.duckDuckGo,
  ];

  const lastCheck: string[] = [
    ...ipAddresses.googleips.flatMap(e => e.prefixes.map(p => p.ipv4Prefix ?? p.ipv6Prefix)),
    ...ipAddresses.apple.flatMap(e => e.prefixes.map(p => p.ipv4Prefix)),
    ...ipAddresses.ahrefs.flatMap(e => e.prefixes.map(p => p.ipv4Prefix)),
    ...ipAddresses.commonCrawler,
    ...ipAddresses.xAndTwitter,
    ...ipAddresses.facebook,
    ...ipAddresses.pinterest,
    ...ipAddresses.telegram,
    ...ipAddresses.semrush,
  ];
  

export function isBotIPTrusted(ipAddress: string): boolean {
const cached = botIPCache.get(ipAddress)
if (cached) {
    return cached.validIP;
  }
  const ranges = settings.banUnlistedBots
    ? combinedIps
    : lastCheck;
  
  const validIP = ipRangeCheck(ipAddress, ranges);

  botIPCache.set(ipAddress, { validIP });

  return validIP;
}

//   const openAiIps = ipAddresses.openai.flatMap(entry =>
//     entry.prefixes.map(prefix => prefix.ipv4Prefix || prefix.ipv6Prefix)
//   );

//   const duckDuckGoIps = ipAddresses.duckDuckGo;

//   const ipv4: string[] = [];
//   const ipv6: string[] = [];

//   // Combine OpenAI and DuckDuckGo IPs
//   const combinedIps = [...openAiIps, ...duckDuckGoIps];

//   // Separate IPv4 and IPv6 addresses
//   combinedIps.forEach(ip => {
//     if (ip.includes(':')) {
//       ipv6.push(ip); // IPv6 addresses contain colons
//     } else {
//       ipv4.push(ip); // IPv4 addresses do not contain colons
//     }
//   });

//   return { ipv4, ipv6 };
// }

// const { ipv4, ipv6 } = getOpenAiAndDuckDuckGoIps();
// console.log('IPv4:', ipv4);
// console.log('IPv6:', ipv6);