import { it, describe, expect } from 'vitest';
import { getConfiguration, getDataSources } from '~~/src/botDetector/config/config.js';
import { TimezoneConsistencyChecker } from '@checkers/timezoneConsistency.js';
import { createMockContext } from '../test-utils/test-utils.js';

const checker = new TimezoneConsistencyChecker();

function run(geoTimezone: string | undefined, header: Record<string, string>) {
    return checker.run(
        createMockContext({
            geoData: { timezone: geoTimezone },
            req: { get: (name: string) => header[name] } as any,
        }),
        getConfiguration()
    );
}

describe('TimezoneConsistencyChecker', () => {
    describe('no geo timezone', () => {

        it('returns zero when geoData.timezone is undefined', () => {
            const { score, reasons } = run(undefined, { 'Sec-CH-UA-Timezone': 'America/New_York' });
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });

        it('returns zero when geoData.timezone is empty string', () => {
            const { score, reasons } = run('', { 'Sec-CH-UA-Timezone': 'America/New_York' });
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });
    });

    describe('no timezone header present', () => {
        it('returns zero when no Sec-CH-UA-Timezone and no X-Timezone header', () => {
            const { score, reasons } = run('America/New_York', {});
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });
    });

    describe('matching timezone', () => {
        it('returns zero when Sec-CH-UA-Timezone matches geo timezone', () => {
            const { score, reasons } = run('America/New_York', { 'Sec-CH-UA-Timezone': 'America/New_York' });
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });

        it('header uppercase matches geo lowercase', () => {
            const { score, reasons } = run('america/new_york', { 'Sec-CH-UA-Timezone': 'America/New_York' });
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });

        it('uses X-Timezone header as fallback', () => {
            const { score, reasons } = run('europe/london', { 'X-Timezone': 'Europe/London' });
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });
    });

    describe('mismatching timezone', () => {

        it('penalises when Sec-CH-UA-Timezone does not match geo timezone', () => {
            const { score, reasons } = run('America/New_York', { 'Sec-CH-UA-Timezone': 'Europe/Moscow' });
            const cfg = getConfiguration().checkers.enableTimezoneConsistency;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBe(cfg.penalties);
            expect(reasons).toContain('TZ_HEADER_GEO_MISMATCH');
        });

        it('penalises when X-Timezone does not match geo timezone', () => {
            const { score, reasons } = run('Asia/Tokyo', { 'X-Timezone': 'America/Los_Angeles' });
            const cfg = getConfiguration().checkers.enableTimezoneConsistency;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBe(cfg.penalties);
            expect(reasons).toContain('TZ_HEADER_GEO_MISMATCH');
        });

        it('Sec-CH-UA-Timezone takes precedence over X-Timezone', () => {
            const { score, reasons } = run('Europe/London', {
                'Sec-CH-UA-Timezone': 'Asia/Tokyo',  
                'X-Timezone': 'Europe/London',       
            });
            const cfg = getConfiguration().checkers.enableTimezoneConsistency;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            expect(score).toBe(cfg.penalties);
            expect(reasons).toContain('TZ_HEADER_GEO_MISMATCH');
        });
    });

    describe('Real MMDB data', () => {

        it('the timezone from country MMDB for 8.8.8.8 is a valid IANA zone string', () => {
            const record = getDataSources().countryDataBase('8.8.8.8');
            expect(record).toBeDefined();
            if (record?.timezone) {
                expect(record.timezone).toMatch(/\//);
            }
        });

    });

    describe('configuration', () => {
        it('isEnabled returns false when disabled', () => {
            const config = getConfiguration();
            (config.checkers.enableTimezoneConsistency as any).enable = false;
            expect(checker.isEnabled(config)).toBe(false);
            (config.checkers.enableTimezoneConsistency as any).enable = true;
        });
    });
});
