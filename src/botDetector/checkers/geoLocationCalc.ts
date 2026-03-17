import { BanReasonCode, IBotChecker } from "../types/checkersTypes.js";
import { ValidationContext } from "../types/botDetectorTypes.js";
import { BotDetectorConfig } from "../types/configSchema.js";
import { CheckerRegistry } from "./CheckerRegistry.js";

export class GeoLocationChecker implements IBotChecker<BanReasonCode> {
  name = 'Geo-Location Verification';
  phase = 'heavy' as const;

  isEnabled(config: BotDetectorConfig): boolean {
    return config.checkers.enableGeoChecks.enable;
  }

  private isAllowedCountry(country: string, bannedCountries: string[]): boolean {
    const blockedCountries = bannedCountries;
    return !blockedCountries.includes(country.trim().toLowerCase());
  }

  async run(ctx: ValidationContext, config: BotDetectorConfig) {
    const checkConfig = config.checkers.enableGeoChecks;
    const reasons: BanReasonCode[] = [];
    let score = 0;

    if (checkConfig.enable === false) return { score, reasons };
    const penalties = checkConfig.penalties;
    const banScore = config.banScore;

    const details = ctx.geoData;
    const country = details.country;
    const countryCode = details.countryCode;

    if (countryCode || country) {
      if (!this.isAllowedCountry(countryCode || country || "", checkConfig.bannedCountries)) {
        score += banScore; 
        reasons.push('BANNED_COUNTRY');
      }

    } else {
      score += penalties.countryUnknown;
      reasons.push('COUNTRY_UNKNOWN');
    }

    const region = details.region;
    const regionName = details.regionName;
    if (!region || !regionName) {
        score += penalties.regionUnknown;
        reasons.push('REGION_UNKNOWN');
    }
      
    if (!details.lat || !details.lon) {
        score += penalties.latLonUnknown;
        reasons.push('LAT_LON_UNKNOWN');
    }

    if (!details.district) {
        score += penalties.districtUnknown; 
        reasons.push('DISTRICT_UNKNOWN');
    }
      
    if (!details.city) {
        score += penalties.cityUnknown; 
        reasons.push('CITY_UNKNOWN');
    }

    if (!details.timezone) {
        score += penalties.timezoneUnknown;
        reasons.push('TIMEZONE_UNKNOWN');
    }

    if (!details.subregion) {
        score += penalties.subregionUnknown; 
        reasons.push('SUBREGION_UNKNOWN' as BanReasonCode);
    }

    if (!details.phone) {
        score += penalties.phoneUnknown;
        reasons.push('PHONE_UNKNOWN' as BanReasonCode);
    }

    if (!details.continent) {
        score += penalties.continentUnknown;
        reasons.push('CONTINENT_UNKNOWN' as BanReasonCode);
    }

    return { score, reasons };
  }
}

CheckerRegistry.register(new GeoLocationChecker());