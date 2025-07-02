import dns from 'node:dns/promises';
import suffix from '../db/json/suffix.json' with { type: 'json' };
import { dnsCache } from './cache/dnsLookupCache.js';

 function getDomains(suffix: Record<string, any>): string[] { 
  const allDomains: string[] = [];

  for (const key in suffix) {

  const entry = suffix[key]
  const entrySuffix = entry.suffix

  if (Array.isArray(entrySuffix)) {
    allDomains.push(...entrySuffix);

  } else if (typeof entrySuffix === 'string') {
    allDomains.push(entrySuffix)
  }
}
  return allDomains;
 }

const domains = getDomains(suffix).map(d => `.${d.toLowerCase()}`);


export async function isBotFromTrustedDomain(ip: string): Promise<boolean> {
  const cached = dnsCache.get(ip)
  if (cached) {
    return cached.trustedBot;
  }
  try {

    const hostnames = await dns.reverse(ip);          

    const matchingHosts = hostnames.filter(host =>
      domains.some(domain => host.endsWith(domain))
    );
    if (matchingHosts.length === 0) {
      dnsCache.set(ip, { ip, trustedBot: false });
      return false;
    }
    for (const host of matchingHosts) {
      const addresses = await dns.lookup(host, { all: true }); 
      if (addresses.some(a => a.address === ip)) {
        dnsCache.set(ip, { ip, trustedBot: true });
        return true; 
      } 
    }
  } catch(err) {
    console.log(err)
  }
  dnsCache.set(ip, { ip, trustedBot: false });
  return false;
}