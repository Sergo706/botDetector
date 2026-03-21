import { it, describe, expect } from 'vitest';
import { getConfiguration, getDataSources } from '~~/src/botDetector/config/config.js';
import { GeoLocationChecker } from '@checkers/geoLocationCalc.js';
import { createMockContext } from '../test-utils/test-utils.js';

const checker = new GeoLocationChecker();

function run(geoData: object) {
    return checker.run(createMockContext({ geoData }), getConfiguration());
}

const richGeo = {
    country: 'united states',
    countryCode: 'us',
    region: 'ca',
    regionName: 'california',
    city: 'los angeles',
    district: 'downtown',
    lat: '34.0522',
    lon: '-118.2437',
    timezone: 'America/Los_Angeles',
    subregion: 'north america',
    phone: '1',
    continent: 'north america',
};

describe('GeoLocationChecker', () => {
    describe('full rich geo data allowed country', () => {

        it('returns zero score for a complete, non-banned geo record', async () => {
            const cfg = getConfiguration().checkers.enableGeoChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const { score, reasons } = await run(richGeo);
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });
    });

    describe('banned countries', () => {
        it('scores banScore for a country in the banned list by name, no country code', async () => {
            const cfg = getConfiguration().checkers.enableGeoChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const { score, reasons } = await run({ ...richGeo, country: 'russia', countryCode: undefined });
            expect(score).toBeGreaterThanOrEqual(getConfiguration().banScore);
            expect(reasons).toContain('BANNED_COUNTRY');
        });

        it('bans when countryCode itself is in the banned list', async () => {
            const cfg = getConfiguration().checkers.enableGeoChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const bannedCountries = cfg.bannedCountries;
            const originalLength = bannedCountries.length;

            bannedCountries.push('ru');

            const { reasons, score } = await run({ ...richGeo, countryCode: 'ru' });
            expect(score).toBeGreaterThanOrEqual(getConfiguration().banScore);
            expect(reasons).toContain('BANNED_COUNTRY');
            bannedCountries.splice(originalLength); 
        });

        it('bans by country name even when a non banned countryCode is present', async () => {
            const cfg = getConfiguration().checkers.enableGeoChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const { reasons, score } = await run({ ...richGeo, country: 'russia', countryCode: 'ru' });
            expect(score).toBeGreaterThanOrEqual(getConfiguration().banScore);
            expect(reasons).toContain('BANNED_COUNTRY');
        });

        it('banned country detection is case insensitive', async () => {
            const cfg = getConfiguration().checkers.enableGeoChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const { reasons, score } = await run({ ...richGeo, country: 'RUSSIA', countryCode: undefined });
            expect(score).toBeGreaterThanOrEqual(getConfiguration().banScore);
            expect(reasons).toContain('BANNED_COUNTRY');
        });
    });

    describe('missing country', () => {
        it('flags COUNTRY_UNKNOWN when both country and countryCode are absent', async () => {
            const cfg = getConfiguration().checkers.enableGeoChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const { score, reasons } = await run({ ...richGeo, country: undefined, countryCode: undefined });
            expect(score).toBe(cfg.penalties.countryUnknown);
            expect(reasons).toContain('COUNTRY_UNKNOWN');
        });
    });

    describe('Missing geo fields — individual penalties', () => {
        it('flags REGION_UNKNOWN when region and regionName are absent', async () => {
            const cfg = getConfiguration().checkers.enableGeoChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const { reasons, score } = await run({ ...richGeo, region: undefined, regionName: undefined });
            expect(score).toBe(cfg.penalties.regionUnknown);
            expect(reasons).toContain('REGION_UNKNOWN');
        });

        it('flags LAT_LON_UNKNOWN when lat is missing', async () => {
            const cfg = getConfiguration().checkers.enableGeoChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const { reasons, score } = await run({ ...richGeo, lat: undefined });
            expect(score).toBe(cfg.penalties.latLonUnknown);
            expect(reasons).toContain('LAT_LON_UNKNOWN');
        });

        it('flags LAT_LON_UNKNOWN when lon is missing', async () => {
            const cfg = getConfiguration().checkers.enableGeoChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const { reasons, score } = await run({ ...richGeo, lon: undefined });
            expect(score).toBe(cfg.penalties.latLonUnknown);
            expect(reasons).toContain('LAT_LON_UNKNOWN');
        });

        it('flags DISTRICT_UNKNOWN when district is missing', async () => {
            const cfg = getConfiguration().checkers.enableGeoChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const { reasons, score } = await run({ ...richGeo, district: undefined });
            expect(score).toBe(cfg.penalties.districtUnknown);
            expect(reasons).toContain('DISTRICT_UNKNOWN');
        });

        it('flags CITY_UNKNOWN when city is missing', async () => {
            const cfg = getConfiguration().checkers.enableGeoChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const { reasons, score } = await run({ ...richGeo, city: undefined });
            expect(score).toBe(cfg.penalties.cityUnknown);
            expect(reasons).toContain('CITY_UNKNOWN');
        });

        it('flags TIMEZONE_UNKNOWN when timezone is missing', async () => {
            const cfg = getConfiguration().checkers.enableGeoChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const { reasons, score } = await run({ ...richGeo, timezone: undefined });
            expect(score).toBe(cfg.penalties.timezoneUnknown);
            expect(reasons).toContain('TIMEZONE_UNKNOWN');
        });

        it('flags SUBREGION_UNKNOWN when subregion is missing', async () => {
            const cfg = getConfiguration().checkers.enableGeoChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const { reasons, score } = await run({ ...richGeo, subregion: undefined });
            expect(score).toBe(cfg.penalties.subregionUnknown);
            expect(reasons).toContain('SUBREGION_UNKNOWN');
        });

        it('flags PHONE_UNKNOWN when phone is missing', async () => {
            const cfg = getConfiguration().checkers.enableGeoChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const { reasons, score } = await run({ ...richGeo, phone: undefined });
            expect(score).toBe(cfg.penalties.phoneUnknown);
            expect(reasons).toContain('PHONE_UNKNOWN');
        });

        it('flags CONTINENT_UNKNOWN when continent is missing', async () => {
            const cfg = getConfiguration().checkers.enableGeoChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const { reasons, score } = await run({ ...richGeo, continent: undefined });
            expect(score).toBe(cfg.penalties.continentUnknown);
            expect(reasons).toContain('CONTINENT_UNKNOWN');
        });
    });

    describe('Score accumulation', () => {
        it('accumulates multiple field penalties for a bare geo response', async () => {
            const cfg = getConfiguration().checkers.enableGeoChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            const { score, reasons } = await run({ country: 'united states', countryCode: 'us' });
            expect(score).toBeGreaterThan(20);
            // Every field except country/countryCode is absent — all field penalties must fire
            expect(reasons).toContain('REGION_UNKNOWN');
            expect(reasons).toContain('LAT_LON_UNKNOWN');
            expect(reasons).toContain('DISTRICT_UNKNOWN');
            expect(reasons).toContain('CITY_UNKNOWN');
            expect(reasons).toContain('TIMEZONE_UNKNOWN');
            expect(reasons).toContain('SUBREGION_UNKNOWN');
            expect(reasons).toContain('PHONE_UNKNOWN');
            expect(reasons).toContain('CONTINENT_UNKNOWN');
        });
    });

    describe('Real MMDB data', () => {
        it('Google DNS (8.8.8.8) has a valid country in the MMDB', () => {
            const record = getDataSources().countryDataBase('8.8.8.8');
            expect(record).toBeDefined();
            expect(record?.country_code).toBeDefined();
            if (record) {
                expect(typeof record.name).toBe('string');
                expect(record.name!.length).toBeGreaterThan(0);
                expect(record.name!.toLowerCase()).toContain('united states');
            }
        });

        it('country record from MMDB contains required fields for the geo checker', () => {
            const record = getDataSources().countryDataBase('8.8.8.8');
            if (record) {
                expect(record.country_code).toBeDefined();
                expect(record.timezone).toBeDefined();
            }
        });

        it('running a real MMDB geo context through the checker produces expected results', async () => {
            const cfg = getConfiguration().checkers.enableGeoChecks;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            const country = getDataSources().countryDataBase('8.8.8.8');
            const city = getDataSources().cityDataBase('8.8.8.8');
            expect(country).toBeDefined();

            if (country && city) {
                const geoData = {
                    country: country.name?.toLowerCase(),
                    countryCode: country.country_code?.toLowerCase(),
                    region: city.region?.toLowerCase(),
                    regionName: city.subregion?.toLowerCase(),
                    city: city.city?.toLowerCase(),
                    district: city.state?.toLowerCase(),
                    lat: city.latitude,
                    lon: city.longitude,
                    timezone: city.timezone,
                    subregion: city.subregion,
                    phone: city.phone,
                    continent: city.continent,
                };
                const { reasons} = await run(geoData);
                expect(reasons).not.toContain('BANNED_COUNTRY');
                expect(reasons).not.toContain('COUNTRY_UNKNOWN');
            }
        });
    });

    describe('Configuration', () => {
        it('isEnabled returns false when disabled', () => {
            const config = getConfiguration();
            (config.checkers.enableGeoChecks as any).enable = false;
            expect(checker.isEnabled(config)).toBe(false);
            (config.checkers.enableGeoChecks as any).enable = true;
        });
    });
});
