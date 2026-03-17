import type { GeoResponse } from "../types/geoTypes.js";
import { getDataSources } from "../config/config.js";

const norm = (string?: string) => string?.trim().toLowerCase();
  
export function getData(ip: string): GeoResponse {
  const dataSource = getDataSources()
  const countryLvl = dataSource.countryDataBase(ip);
  const cityLvl = dataSource.cityDataBase(ip);
  const asn = dataSource.asnDataBase(ip);
  const proxy = dataSource.proxyDataBase(ip);
  const tor = dataSource.torDataBase(ip);


  return {
    country: norm(countryLvl?.name ?? cityLvl?.name),
    countryCode: norm(countryLvl?.country_code ?? cityLvl?.country_code),
    region: norm(cityLvl?.region ?? countryLvl?.region),
    regionName: norm(cityLvl?.continent ?? cityLvl?.subregion ?? countryLvl?.subregion),
    subregion: norm(cityLvl?.subregion ?? countryLvl?.subregion),
    state: norm(cityLvl?.state),
    zipCode: norm(cityLvl?.zip_code),
    city: norm(cityLvl?.city ?? cityLvl?.capital ?? countryLvl?.capital),
    phone: norm(cityLvl?.phone ?? countryLvl?.phone),
    numericCode: norm(cityLvl?.numericCode ?? countryLvl?.numericCode),
    native: norm(cityLvl?.native ?? countryLvl?.native),
    continent: norm(cityLvl?.continent),
    capital: norm(cityLvl?.capital ?? countryLvl?.capital),
    district: norm(cityLvl?.state),
    lat: norm(cityLvl?.latitude),
    lon: norm(cityLvl?.longitude),
    timezone: norm(cityLvl?.timezone ?? countryLvl?.timezone),
    timeZoneName: norm(cityLvl?.timeZoneName ?? countryLvl?.timeZoneName),
    utc_offset: norm(cityLvl?.utc_offset ?? countryLvl?.utc_offset),
    tld: norm(cityLvl?.tld ?? countryLvl?.tld),
    nationality: norm(cityLvl?.nationality ?? countryLvl?.nationality),
    currency: norm(cityLvl?.currency ?? countryLvl?.currency),
    iso639: norm(cityLvl?.iso639 ?? countryLvl?.iso639),
    languages: norm(cityLvl?.languages ?? countryLvl?.languages),
    isp: norm(asn?.asn_name),
    org: norm(asn?.asn_id),
    as_org: norm(asn?.asn_name),
    proxy: proxy ? true : false,
    hosting: asn?.classification === "Content" || Boolean(tor?.exit_addresses),
  }
}