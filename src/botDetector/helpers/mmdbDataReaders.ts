import maxmind, { Reader } from 'maxmind';
import type { BgpRecord, CityGeoRecord, GeoRecord, TorRecord, ThreatRecord, CrawlersRecord, ProxyRecord } from '@riavzon/shield-base'
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DataReaders {
    asnDataBase(ip: string): BgpRecord | null; 
    cityDataBase(ip: string): CityGeoRecord | null;
    countryDataBase(ip: string): GeoRecord | null;
    goodBotsDataBase(ip: string): CrawlersRecord | null;
    torDataBase(ip: string): TorRecord | null;
    proxyDataBase(ip: string): ProxyRecord | null;
    fireholAnonDataBase(ip: string): ThreatRecord | null;
    fireholLvl1DataBase(ip: string): ThreatRecord | null;
    fireholLvl2DataBase(ip: string): ThreatRecord | null;
    fireholLvl3DataBase(ip: string): ThreatRecord | null;
    fireholLvl4DataBase(ip: string): ThreatRecord | null;
}

export interface AppReaders {
    asn: Reader<BgpRecord & maxmind.Response>;
    city: Reader<CityGeoRecord & maxmind.Response>;
    country: Reader<GeoRecord & maxmind.Response>;
    goodBots: Reader<CrawlersRecord & maxmind.Response>;
    tor: Reader<TorRecord & maxmind.Response>;
    proxy: Reader<ProxyRecord & maxmind.Response>;
    fireholAnon: Reader<ThreatRecord & maxmind.Response>;
    fireholLvl1: Reader<ThreatRecord & maxmind.Response>;
    fireholLvl2: Reader<ThreatRecord & maxmind.Response>;
    fireholLvl3: Reader<ThreatRecord & maxmind.Response>;
    fireholLvl4: Reader<ThreatRecord & maxmind.Response>;
}


export class DataSources implements DataReaders {
   private readonly readers: AppReaders;
   private constructor(readers: AppReaders) {
    this.readers = readers;
  }

  public static async initialize(): Promise<DataSources> {
    const basePath = path.resolve(__dirname, '..', 'db', 'mmdb')
    const options = { watchForUpdates: process.env.NODE_ENV !== 'test' };

    const [asn, city, country, goodBots, tor, proxy, fireholAnon, fireholLvl1, fireholLvl2, fireholLvl3, fireholLvl4] = await Promise.all([
      maxmind.open<BgpRecord & maxmind.Response>(path.join(basePath, 'asn.mmdb'), options),
      maxmind.open<CityGeoRecord & maxmind.Response>(path.join(basePath, 'city.mmdb'), options),
      maxmind.open<GeoRecord & maxmind.Response>(path.join(basePath, 'country.mmdb'), options),
      maxmind.open<CrawlersRecord& maxmind.Response>(path.join(basePath, 'goodBots.mmdb'), options),
      maxmind.open<TorRecord & maxmind.Response>(path.join(basePath, 'tor.mmdb'), options),
      maxmind.open<ProxyRecord & maxmind.Response>(path.join(basePath, 'proxy.mmdb'), options),
      maxmind.open<ThreatRecord & maxmind.Response>(path.join(basePath, 'firehol_anonymous.mmdb'), options),
      maxmind.open<ThreatRecord & maxmind.Response>(path.join(basePath, 'firehol_l1.mmdb'), options),
      maxmind.open<ThreatRecord & maxmind.Response>(path.join(basePath, 'firehol_l2.mmdb'), options),
      maxmind.open<ThreatRecord & maxmind.Response>(path.join(basePath, 'firehol_l3.mmdb'), options),
      maxmind.open<ThreatRecord & maxmind.Response>(path.join(basePath, 'firehol_l4.mmdb'), options),
    ]);
      
    
    return new DataSources({
       asn,
       city,
       country,
       goodBots,
       tor,
       proxy,
       fireholAnon,
       fireholLvl1,
       fireholLvl2,
       fireholLvl3,
       fireholLvl4
    });
  }
    
  public asnDataBase(ip: string): BgpRecord | null {
    const result: BgpRecord | null = this.readers.asn.get(ip);
    return result;
  }

  public cityDataBase(ip: string): CityGeoRecord | null {
    const result: CityGeoRecord | null = this.readers.city.get(ip);
    return result;
  }

  public countryDataBase(ip: string): GeoRecord | null {
    const result: GeoRecord | null = this.readers.country.get(ip);
    return result;
  }

  public goodBotsDataBase(ip: string): CrawlersRecord | null {
    const result: CrawlersRecord | null = this.readers.goodBots.get(ip);
    return result;
  }

  public torDataBase(ip: string): TorRecord | null {
    const result: TorRecord | null = this.readers.tor.get(ip);
    return result;
  }

  public proxyDataBase(ip: string): ProxyRecord | null {
    const result: ProxyRecord | null = this.readers.proxy.get(ip);
    return result;
  }

  public fireholAnonDataBase(ip: string): ThreatRecord | null {
    const result: ThreatRecord | null = this.readers.fireholAnon.get(ip);
    return result;
  }

  public fireholLvl1DataBase(ip: string): ThreatRecord | null {
    const result: ThreatRecord | null = this.readers.fireholLvl1.get(ip);
    return result;
  }

  public fireholLvl2DataBase(ip: string): ThreatRecord | null {
    const result: ThreatRecord | null = this.readers.fireholLvl2.get(ip);
    return result;
  }

  public fireholLvl3DataBase(ip: string): ThreatRecord | null {
    const result: ThreatRecord | null = this.readers.fireholLvl3.get(ip);
    return result;
  }

  public fireholLvl4DataBase(ip: string): ThreatRecord | null {
    const result: ThreatRecord | null = this.readers.fireholLvl4.get(ip);
    return result;
  }

} 
