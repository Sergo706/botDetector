import { it, describe, expect } from 'vitest';
import { getData } from '~~/src/botDetector/helpers/getIPInformation.js';

describe('getIPInformation — getData()', () => {
    describe('known public ip', () => {
        it('returns a defined GeoResponse without throwing', () => {
            expect(() => getData('8.8.8.8')).not.toThrow();
            const result = getData('8.8.8.8');
            expect(result).toBeDefined();
            expect(result).toBeTypeOf('object');
            expect(result.country).toBe('united states')
        });

        it('returns country as "united states"', () => {
            const result = getData('8.8.8.8');
            expect(result.country).toBeDefined();
            expect(result.country!.toLowerCase()).toContain('united states');
        });

        it('returns countryCode as "us"', () => {
            const result = getData('8.8.8.8');
            expect(result.countryCode).toBe('us');
        });

        it('returns a non empty isp from ASN database', () => {
            const result = getData('8.8.8.8');
            expect(result.isp).toBeDefined();
            expect(result.isp!.length).toBeGreaterThan(0);
            expect(result.isp).toBe('google llc')
        });

        it('returns a non-empty org from ASN database', () => {
            const result = getData('8.8.8.8');
            expect(result.org).toBe('15169');
            expect(result.org!.length).toBeGreaterThan(0);
        });

        it('returns timezone string', () => {
            const result = getData('8.8.8.8');
            expect(result.timezone).toBeDefined();
            expect(result.timezone).toBe('america/adak');
        });

        it('proxy field is a boolean', () => {
            const result = getData('8.8.8.8');
            expect(typeof result.proxy).toBe('boolean');
        });

        it('all string fields are lowercase', () => {
            const result = getData('8.8.8.8');
            const stringFields = [result.country, result.countryCode, result.isp, result.org];
            for (const field of stringFields) {
                expect(field).toBeDefined()
                if (field) {
                    expect(field).toBe(field.toLowerCase());
                }
            }
        });
    });

    describe('Cloudflare DNS', () => {
        it('returns a result without throwing', () => {
            expect(() => getData('1.1.1.1')).not.toThrow();
        });

        it('returns a country for 1.1.1.1', () => {
            const result = getData('1.1.1.1');
            expect(result.country).toBeDefined();
            expect(result.country!.length).toBeGreaterThan(0);
            expect(result.countryCode).toBeDefined();
        });
    });

    describe('hosting flag', () => {
        it('hosting is a boolean', () => {
            const result = getData('8.8.8.8');
            expect(typeof result.hosting).toBe('boolean');
        });

        it('returns hosting=true for a known datacenter IP range', () => {
            // DigitalOcean
            const result = getData('104.131.0.1');
            expect(result.hosting).toBe(true)
            expect(typeof result.hosting).toBe('boolean');
        });
    });

    describe('GeoResponse field structure', () => {
        it('result contains all expected keys', () => {
            const result = getData('8.8.8.8');
            const requiredKeys = ['country', 'countryCode', 'isp', 'org', 'proxy', 'hosting', 'timezone'];
            for (const key of requiredKeys) {
                expect(result).toHaveProperty(key);
            }
        });

        it('lat and lon are strings when present', () => {
            const result = getData('8.8.8.8');

            if (result.lat !== undefined) {
                expect(typeof result.lat).toBe('string');
            }
            if (result.lon !== undefined) {
                expect(typeof result.lon).toBe('string');
            }
        });
    });

    describe('Unknown / edge-case IPs', () => {
        it('does not throw for a documentation range ip', () => {
            const result = getData('203.0.113.1');

            expect(() => getData('203.0.113.1')).not.toThrow();
            expect(result).toBeDefined();
        });

        it('returns boolean proxy and hosting fields for unrecognised IP', () => {
            const result = getData('203.0.113.1');
            expect(typeof result.proxy).toBe('boolean');
            expect(typeof result.hosting).toBe('boolean');
        });
    });
});
