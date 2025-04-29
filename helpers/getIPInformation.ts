import { sendLog } from "../../../utils/telegramLogger.js";
import type { GeoResponse } from "../types/geoTypes.js";
import { geoCache, asnReader, countryReader, cityReader } from "./geoReaders.js";
import { AddressNotFoundError } from "@maxmind/geoip2-node";
import isPrivateIp from "private-ip"; 

export async function getdata(ip: string):Promise<GeoResponse> {
  const EMPTY: GeoResponse = {
    country:      undefined,
    countryCode:  undefined,
    region:       undefined,
    regionName:   undefined,
    city:         undefined,
    district:     undefined,
    lat:          undefined,
    lon:          undefined,
    timezone:     undefined,
    currency:     undefined,
    isp:          undefined,
    org:          undefined,
    as:           undefined,
    proxy:        false,
    hosting:      false,
  };
  
  if (!ip || isPrivateIp(ip)) return EMPTY;  

    const cached = geoCache.get(ip);
    if (cached) return cached;

  try { 
    const asn      = asnReader.asn(ip);        // AsnResponse
    const city     = cityReader.city(ip);      // CityResponse
    const country  = countryReader.country(ip);// CountryResponse


 const geo: GeoResponse = {
  country:       country.country?.names?.en,
  countryCode:   country.country?.isoCode,
  region:        city.subdivisions?.[0]?.isoCode,
  regionName:    city.subdivisions?.[0]?.names?.en,
  city:          city.city?.names?.en,
  district:      country.continent?.names.en,     
  lat:           city.location?.latitude,
  lon:           city.location?.longitude,
  timezone:      city.location?.timeZone,
  currency:      country.country?.isoCode,                              
  isp:           asn.autonomousSystemOrganization,                              
  org:           asn.autonomousSystemNumber?.toString(),
  as:            asn.network,
  proxy:        country.traits.isAnonymous ||
                country.traits.isAnonymousVpn ||
                country.traits.isTorExitNode ||
                country.traits.isPublicProxy,
  hosting:      country.traits.isHostingProvider
        };


    geoCache.set(ip, geo);
    return geo;
  
  } catch(err) {
    
    if (err instanceof AddressNotFoundError) {
      return EMPTY;                                
    }

    sendLog("Error Getting GEO data", `local MMDB lookup failed: ${err}`);
    throw err;
    }
  }
   

   