import { settings } from '../../settings.js';
export function isAllowedCountry(country) {
    const blockedCountries = settings.penalties.bannedCountries;
    return !blockedCountries.includes(country.trim().toLowerCase());
}
