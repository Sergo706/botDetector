import ipAddresses from '../db/json/ip-database.json' with { type: 'json' }
import { botIPCache } from './cache/botIpCache.js';
import ipRangeCheck from 'ip-range-check' 
import { getConfiguration } from "../config/config.js";

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
  
  const {banUnlistedBots} = getConfiguration()
  const ranges = banUnlistedBots
    ? combinedIps
    : lastCheck;
  
  const validIP = ipRangeCheck(ipAddress, ranges);

  botIPCache.set(ipAddress, { validIP });

  return validIP;
}
