import { settings } from "../../settings.js";
import { isAllowedCountry } from "../helpers/bannedCountries.js";
export function calculateGeoLocation(country, region, regionName, lat, lon, district, city, timezone) {
    const reasons = [];
    let score = 0;
    if (country !== 'unknown') {
        if (!isAllowedCountry(country)) {
            score += settings.banScore; // Ban unallowed countries
            reasons.push('BANNED_COUNTRY');
        }
    }
    else {
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
