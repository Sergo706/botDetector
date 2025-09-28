import { BanReasonCode } from "../types/checkersTypes.js";
import { isAllowedCountry } from "../helpers/bannedCountries.js";
import { getConfiguration } from "../config/config.js";

export function calculateGeoLocation(
    country: string,
    region: string,
    regionName: string,
    lat: string,
    lon: string,
    district: string,
    city: string,
    timezone: string
):{ score: number, reasons: BanReasonCode[] } {

const reasons: BanReasonCode[] = [];
let score = 0;
  const {penalties, banScore} = getConfiguration()

if (country !== 'unknown') {
  if (!isAllowedCountry(country)) {
    score += banScore; // Ban unallowed countries
    reasons.push('BANNED_COUNTRY');
  }
} else {
  score += penalties.countryUnknown;
  reasons.push('COUNTRY_UNKNOWN');
}

if (region === 'unknown' || regionName === 'unknown') {
    score += penalties.regionUnknown;
    reasons.push('REGION_UNKNOWN');
  }
  
  if (lat === 'unknown' || lon === 'unknown') {
    score += penalties.latLonUnknown;
    reasons.push('LAT_LON_UNKNOWN');
  }

  if (district === 'unknown') {
    score += penalties.districtUnknown; // Not always returns
    reasons.push('DISTRICT_UNKNOWN');
  }
  
  if (city === 'unknown') {
    score += penalties.cityUnknown; // Not always returns
    reasons.push('CITY_UNKNOWN');
  }

  if (timezone === 'unknown') {
    score += penalties.timezoneUnknown;
    reasons.push('TIMEZONE_UNKNOWN');
  }

    return { score, reasons };
}