import { getConfiguration } from "../config/config.js";


  export function isAllowedCountry(country: string): boolean {
    const {penalties} = getConfiguration()
    const blockedCountries = penalties.bannedCountries;
    return !blockedCountries.includes(country.trim().toLowerCase());
  }