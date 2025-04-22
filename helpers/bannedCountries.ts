import { settings } from '../settings.js';


  export function isAllowedCountry(country: string): boolean {
    const blockedCountries = settings.penalties.bannedCountries;
    return !blockedCountries.includes(country.trim().toLowerCase());
  }