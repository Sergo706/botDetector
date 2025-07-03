import { settings } from "../../settings.js";
const timezoneMap = {
    /* Europe */
    'germany': ['Europe/Berlin'],
    'france': ['Europe/Paris'],
    'united kingdom': ['Europe/London'],
    'italy': ['Europe/Rome'],
    'spain': ['Europe/Madrid', 'Atlantic/Canary'],
    'netherlands': ['Europe/Amsterdam'],
    'czechia': ['Europe/Prague'],
    'poland': ['Europe/Warsaw'],
    /* Middle East */
    'israel': ['Asia/Jerusalem'],
    'saudi arabia': ['Asia/Riyadh'],
    'turkey': ['Europe/Istanbul'],
    /* Americas */
    'united states': [
        'America/New_York', // Eastern
        'America/Chicago', // Central
        'America/Denver', // Mountain
        'America/Los_Angeles', // Pacific
        'America/Anchorage', // Alaska
        'Pacific/Honolulu' // Hawaii
    ],
    'canada': [
        'America/Toronto',
        'America/Vancouver',
        'America/Edmonton',
        'America/Halifax',
        'America/Winnipeg',
        'America/St_Johns'
    ],
    'brazil': [
        'America/Sao_Paulo',
        'America/Manaus',
        'America/Belem',
        'America/Recife',
        'America/Campo_Grande'
    ],
    'mexico': ['America/Mexico_City', 'America/Monterrey', 'America/Tijuana'],
    /* Asia–Pacific */
    'japan': ['Asia/Tokyo'],
    'south korea': ['Asia/Seoul'],
    'china': ['Asia/Shanghai', 'Asia/Urumqi'],
    'india': ['Asia/Kolkata'],
    'australia': [
        'Australia/Sydney',
        'Australia/Brisbane',
        'Australia/Perth',
        'Australia/Adelaide',
        'Australia/Darwin'
    ],
    'new zealand': ['Pacific/Auckland', 'Pacific/Chatham'],
    /* Africa */
    'nigeria': ['Africa/Lagos'],
    'south africa': ['Africa/Johannesburg'],
};
export function timeZoneMapper(timezone, country) {
    let score = 0;
    let trCountry = country.trim();
    if (trCountry !== 'unknown' && timezone && timezone !== 'unknown') {
        const validTzs = (timezoneMap[trCountry]).map(z => z.toLowerCase());
        if (!validTzs.includes(timezone)) {
            return score += settings.penalties.timezoneUnknown;
        }
    }
    return score;
}
