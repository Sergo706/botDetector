import { dnsCache } from '@helpers/cache/dnsLookupCache.js';
import suffix from '~~/src/botDetector/db/json/suffix.json' with { type: 'json' };
import dns from 'node:dns/promises';
import { getDataSources } from '../../config/config.js';

export class GoodBotsBase {
 private getDomains(suffix: Record<string, any>): string[] { 
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

  private domains = this.getDomains(suffix).map(d => `.${d.toLowerCase()}`);



  protected async isBotFromTrustedDomain(ip: string): Promise<boolean> {
        const cached = dnsCache.get(ip)
        if (cached) {
            return cached.trustedBot;
        }

        try {
    
            const hostnames = await dns.reverse(ip);          
        
            const matchingHosts = hostnames.filter(host =>
                this.domains.some(domain => host.endsWith(domain))
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

  protected isBotIPTrusted(ipAddress: string): boolean {
    
    const dataSources = getDataSources();
    const isKnownBot = dataSources.goodBotsDataBase(ipAddress) !== null;
  
    return isKnownBot; 
  }
}