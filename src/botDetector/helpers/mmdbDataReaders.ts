import maxmind, { Reader } from 'maxmind';
import { open, type RootDatabase } from 'lmdb';
import type { BgpRecord, CityGeoRecord, GeoRecord, TorRecord, ThreatRecord, CrawlersRecord, ProxyRecord, UserAgentRecord, JA4 } from '@riavzon/shield-base';
import type { BannedRecord, HighRiskRecord } from '../types/generator.js';
import { existsSync } from "node:fs";
import { resolveDataPath } from '@db/findDataPath.js';

export type ThreatRecordModified = ThreatRecord & { network: string }

export interface DataReaders {
    asnDataBase(ip: string): BgpRecord | null;
    cityDataBase(ip: string): CityGeoRecord | null;
    countryDataBase(ip: string): GeoRecord | null;
    goodBotsDataBase(ip: string): CrawlersRecord | null;
    torDataBase(ip: string): TorRecord | null;
    proxyDataBase(ip: string): ProxyRecord | null;
    fireholAnonDataBase(ip: string): ThreatRecordModified | null;
    fireholLvl1DataBase(ip: string): ThreatRecordModified | null;
    fireholLvl2DataBase(ip: string): ThreatRecordModified | null;
    fireholLvl3DataBase(ip: string): ThreatRecordModified | null;
    fireholLvl4DataBase(ip: string): ThreatRecordModified | null;
    bannedDataBase(ip: string): BannedRecord | null;
    highRiskDataBase(ip: string): HighRiskRecord | null;
    getUserAgentLmdb(): RootDatabase<UserAgentRecord, string>;
    getJa4Lmdb(): RootDatabase<JA4, string>;
}

export interface AppReaders {
    asn: Reader<BgpRecord & maxmind.Response>;
    city: Reader<CityGeoRecord & maxmind.Response>;
    country: Reader<GeoRecord & maxmind.Response>;
    goodBots: Reader<CrawlersRecord & maxmind.Response>;
    tor: Reader<TorRecord & maxmind.Response>;
    proxy: Reader<ProxyRecord & maxmind.Response>;
    fireholAnon: Reader<ThreatRecordModified & maxmind.Response>;
    fireholLvl1: Reader<ThreatRecordModified & maxmind.Response>;
    fireholLvl2: Reader<ThreatRecordModified & maxmind.Response>;
    fireholLvl3: Reader<ThreatRecordModified & maxmind.Response>;
    fireholLvl4: Reader<ThreatRecordModified & maxmind.Response>;
    banned?: Reader<BannedRecord & maxmind.Response>;
    highRisk?: Reader<HighRiskRecord & maxmind.Response>;
    userAgentLmdb: RootDatabase<UserAgentRecord, string>;
    ja4Lmdb: RootDatabase<JA4, string>;
}


export class DataSources implements DataReaders {
   private readonly readers: AppReaders;
   private constructor(readers: AppReaders) {
    this.readers = readers;
  }

  public static async initialize(): Promise<DataSources> {
    const options = { watchForUpdates: process.env.NODE_ENV !== 'test' };
    
    const [asn, city, country, goodBots, tor, proxy, fireholAnon, fireholLvl1, fireholLvl2, fireholLvl3, fireholLvl4] = await Promise.all([
      maxmind.open<BgpRecord & maxmind.Response>(resolveDataPath('asn.mmdb'), options),
      maxmind.open<CityGeoRecord & maxmind.Response>(resolveDataPath('city.mmdb'), options),
      maxmind.open<GeoRecord & maxmind.Response>(resolveDataPath('country.mmdb'), options),
      maxmind.open<CrawlersRecord& maxmind.Response>(resolveDataPath('goodBots.mmdb'), options),
      maxmind.open<TorRecord & maxmind.Response>(resolveDataPath('tor.mmdb'), options),
      maxmind.open<ProxyRecord & maxmind.Response>(resolveDataPath('proxy.mmdb'), options),
      maxmind.open<ThreatRecordModified & maxmind.Response>(resolveDataPath('firehol_anonymous.mmdb'), options),
      maxmind.open<ThreatRecordModified & maxmind.Response>(resolveDataPath('firehol_l1.mmdb'), options),
      maxmind.open<ThreatRecordModified & maxmind.Response>(resolveDataPath('firehol_l2.mmdb'), options),
      maxmind.open<ThreatRecordModified & maxmind.Response>(resolveDataPath('firehol_l3.mmdb'), options),
      maxmind.open<ThreatRecordModified & maxmind.Response>(resolveDataPath('firehol_l4.mmdb'), options),
    ]);

    const bannedPath = resolveDataPath('banned.mmdb');
    const highRiskPath = resolveDataPath('highRisk.mmdb');

    const [banned, highRisk] = await Promise.all([
      existsSync(bannedPath) ? maxmind.open<BannedRecord & maxmind.Response>(bannedPath, options): Promise.resolve(undefined),
      existsSync(highRiskPath) ? maxmind.open<HighRiskRecord & maxmind.Response>(highRiskPath, options): Promise.resolve(undefined),
    ]);

    const userAgentLmdb = open<UserAgentRecord, string>({
      path: resolveDataPath('useragent-db/useragent.mdb'),
      name: 'useragent',
      compression: true,
      readOnly: true,
      useVersions: true,
      sharedStructuresKey: Symbol.for('structures'),
      pageSize: 4096,
      cache: {
          validated: true
      },
      noReadAhead: true,
      maxReaders: 2024,
    });

    const ja4Lmdb = open<JA4, string>({
      path: resolveDataPath('ja4-db/ja4.mdb'),
      name: 'ja4',
      compression: true,
      readOnly: true,
      useVersions: true,
      sharedStructuresKey: Symbol.for('structures'),
      pageSize: 4096,
      cache: {
          validated: true
      },
      noReadAhead: true,
      maxReaders: 2024,
    });

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
       fireholLvl4,
       banned,
       highRisk,
       userAgentLmdb,
       ja4Lmdb,
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

  public fireholAnonDataBase(ip: string): ThreatRecordModified | null {
    const result: ThreatRecordModified | null = this.readers.fireholAnon.get(ip);
    return result;
  }

  public fireholLvl1DataBase(ip: string): ThreatRecordModified | null {
    const result: ThreatRecordModified | null = this.readers.fireholLvl1.get(ip);
    return result;
  }

  public fireholLvl2DataBase(ip: string): ThreatRecordModified | null {
    const result: ThreatRecordModified | null = this.readers.fireholLvl2.get(ip);
    return result;
  }

  public fireholLvl3DataBase(ip: string): ThreatRecordModified | null {
    const result: ThreatRecordModified | null = this.readers.fireholLvl3.get(ip);
    return result;
  }

  public fireholLvl4DataBase(ip: string): ThreatRecordModified | null {
    const result: ThreatRecordModified | null = this.readers.fireholLvl4.get(ip);
    return result;
  }

  public bannedDataBase(ip: string): BannedRecord | null {
    return this.readers.banned?.get(ip) ?? null;
  }

  public highRiskDataBase(ip: string): HighRiskRecord | null {
    return this.readers.highRisk?.get(ip) ?? null;
  }

  public getUserAgentLmdb(): RootDatabase<UserAgentRecord, string> {
    return this.readers.userAgentLmdb;
  }

  public getJa4Lmdb(): RootDatabase<JA4, string> {
    return this.readers.ja4Lmdb;
  }

}
