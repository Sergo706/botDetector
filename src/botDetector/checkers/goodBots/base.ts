import { dnsCache } from '@helpers/cache/dnsLookupCache.js';
import dns from 'node:dns/promises';
import { getDataSources } from '../../config/config.js';
import { getLogger } from '@utils/logger.js';
import type { Suffix } from '../../types/suffixes.js';

export class GoodBotsBase {
 private getDomains(suffix: Suffix): string[] {
        const allDomains: string[] = [];

        for (const key in suffix) {

        const entry = suffix[key];
        const entrySuffix = entry.suffix;

        if (Array.isArray(entrySuffix)) {
            allDomains.push(...entrySuffix);

        } else if (typeof entrySuffix === 'string') {
            allDomains.push(entrySuffix);
        }
        }
        return allDomains;
  }

  private domains: string[];

  private _logger?: ReturnType<typeof getLogger>;
  protected get logger(): ReturnType<typeof getLogger> {
    this._logger ??= getLogger().child({ service: 'botDetector', branch: 'checker', type: 'GoodBotsBase' });
    return this._logger;
  }

  constructor(protected suffixes: Suffix) {
    this.domains = this.getDomains(this.suffixes).map(d => `.${d.toLowerCase()}`);
  }

  protected async isBotFromTrustedDomain(ip: string): Promise<boolean> {
        const cached = await dnsCache.get(ip);
        if (cached) {
            return cached.trustedBot;
        }

        try {
    
            const hostnames = await dns.reverse(ip);          
        
            const matchingHosts = hostnames.filter(host =>
                this.domains.some(domain => host.endsWith(domain))
            );

            if (matchingHosts.length === 0) {
                dnsCache.set(ip, { ip, trustedBot: false }).catch((err: unknown) => {
                    this.logger.error({ err }, 'Failed to save dnsCache in storage');
                });
                return false;
            }
            for (const host of matchingHosts) {
                const addresses = await dns.lookup(host, { all: true });

                if (addresses.some(a => a.address === ip)) {
                    dnsCache.set(ip, { ip, trustedBot: true }).catch((err: unknown) => {
                        this.logger.error({ err }, 'Failed to save dnsCache in storage');
                    });

                    return true;
                }
            }
        } catch(err: unknown) {
            this.logger.error({ err }, 'DNS reverse lookup failed');
        }
            dnsCache.set(ip, { ip, trustedBot: false }).catch((err: unknown) => {
                this.logger.error({ err }, 'Failed to save dnsCache in storage');
            });
            return false;
  }

  protected isBotIPTrusted(ipAddress: string): boolean {
    
    const dataSources = getDataSources();
    const isKnownBot = dataSources.goodBotsDataBase(ipAddress) !== null;
  
    return isKnownBot; 
  }
}