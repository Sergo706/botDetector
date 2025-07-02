import { BanReasonCode } from "../types/checkersTypes.js";
import { settings } from "../../settings.js";
import { isAllowedCountry } from "../helpers/bannedCountries.js";

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

if (country !== 'unknown') {
  if (!isAllowedCountry(country)) {
    score += settings.banScore; // Ban unallowed countries
    reasons.push('BANNED_COUNTRY');
  }
} else {
  score += settings.penalties.countryUnknown;
  reasons.push('COUNTRY_UNKNOWN');
}

if (region === 'unknown' || regionName === 'unknown') {
    score += settings.penalties.regionUnknown;
    reasons.push('REGION_UNKNOWN');
  }
  
  if (lat === 'unknown' || lon === 'unknown') {
    score += settings.penalties.latLonUnknown;
    reasons.push('LAT_LON_UNKNOWN');
  }

  if (district === 'unknown') {
    score += settings.penalties.districtUnknown; // Not always returns
    reasons.push('DISTRICT_UNKNOWN');
  }
  
  if (city === 'unknown') {
    score += settings.penalties.cityUnknown; // Not always returns
    reasons.push('CITY_UNKNOWN');
  }

  if (timezone === 'unknown') {
    score += settings.penalties.timezoneUnknown;
    reasons.push('TIMEZONE_UNKNOWN');
  }

    return { score, reasons };
}