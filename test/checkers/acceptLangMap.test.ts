import { it, describe, expect } from 'vitest';
import {  getDataSources, getConfiguration } from '~~/src/botDetector/config/config.js';
import { LocaleMapChecker } from '@checkers/acceptLangMap.js';
import { createMockContext } from '../test-utils/test-utils.js';

const checker = new LocaleMapChecker();

async function mapCountryHelper(header: string, countryName?: string, countryCode?: string, iso639?: string): Promise<number> {
    const { score } = await checker.run(
        createMockContext({
            req: { get: () => header } as any,
            geoData: { country: countryName, countryCode, iso639 }
        }),
        getConfiguration()
    );
    return score;
}

describe('mapCountry Checker - Accept-Language Maps', () => {
    const usIp: string = '8.8.8.8';

    describe('Valid Headers and Matching Geo Data', () => {
        it('Should not flag accurate region and language headers', async () => {
            const country = getDataSources().countryDataBase(usIp);
            expect(country).toBeDefined();
            
            const header: string = 'en-US,en;q=0.9,es;q=0.8';
            
            if(country) {
                const score = await mapCountryHelper(header, country.name, country.country_code, country.iso639);
                expect(score).toBe(0);
            }
        });

        it('Should not flag if a valid matching region has a lower quality score', async () => {
            const country = getDataSources().countryDataBase(usIp);
            expect(country).toBeDefined();
            
            const header: string = 'he-IL,en-US;q=0.5'; 
            if(country) {
                const score = await mapCountryHelper(header, country.name, country.country_code, country.iso639);
                expect(score).toBe(0);
            }
        });
        
        it('Should pass if only regionless language is provided', async () => {
            const country = getDataSources().countryDataBase(usIp);
            expect(country).toBeDefined();
            
            const header: string = 'en'; 
            if (country) {
                const score = await mapCountryHelper(header, country.name, country.country_code, country.iso639);
                
                const settings = getConfiguration().checkers.localeMapsCheck;
                if (settings.enable) {
                    expect(score).toBe(0);
                }
            }
        });

    });

    describe('Invalid Headers or Mismatches', () => {
        it('Should penalize missing header', async () => {
            const country = getDataSources().countryDataBase(usIp);
            expect(country).toBeDefined();
            
            if (country) {
                const score = await mapCountryHelper('', country.name, country.country_code, country.iso639);
                
                const settings = getConfiguration().checkers.localeMapsCheck;
                if (settings.enable) {
                    expect(score).toBe(settings.penalties.missingHeader);
                }
            }
        });

        it('should penalize the wildcard "*" tag', async () => {
            const country = getDataSources().countryDataBase(usIp);
            expect(country).toBeDefined();
            const header: string = '*';

            if (country) {
                const score = await mapCountryHelper(header, country.name, country.country_code, country.iso639);
                const settings = getConfiguration().checkers.localeMapsCheck;
                if (settings.enable) {
                    expect(score).toBe(settings.penalties.ipAndHeaderMismatch);
                }
            }
        })

        it('should handle inconsistent spacing and malformed weights', async () => {
            const country = getDataSources().countryDataBase(usIp);
            expect(country).toBeDefined();
            
            const header: string = 'en-US ; q = 0.9 , fr-FR;q=0.8';
            if (country) {
                const score = await mapCountryHelper(header, country.name, country.country_code, country.iso639);
                const settings = getConfiguration().checkers.localeMapsCheck;
                if (settings.enable) {
                    expect(score).toBe(0);
                }

                const anotherHeader = 'en-US; q = 0.1 ; q = 0.9 , fr-FR;q=0.8';
                const anotherScore = await mapCountryHelper(anotherHeader, country.name, country.country_code, country.iso639);
                if (settings.enable) {
                    expect(anotherScore).toBe(settings.penalties.malformedHeader);
                }
            }
        })

        it('should be case insensitive for both tags and geo data', async () => {
            const country = getDataSources().countryDataBase(usIp);
            expect(country).toBeDefined();

            const header: string = 'EN-us';
            if (country) {
                const score = await mapCountryHelper(header, country.name, country.country_code, country.iso639);

                const settings = getConfiguration().checkers.localeMapsCheck;
                if (settings.enable) {
                    expect(score).toBe(0);
                }
            }
        })

        it('should correctly identify the country code in multipart tags', async () => {
            const country = getDataSources().countryDataBase(usIp);
            expect(country).toBeDefined();

            const header: string = "zh-Hant-HK";
            if (country) {
                const score = await mapCountryHelper(header, country.name, 'HK', country.iso639);

                const settings = getConfiguration().checkers.localeMapsCheck;
                if (settings.enable) {
                    expect(score).toBe(0);
                }
            }
        })

        it('should pass if the language matches even if the region does not', async () => {
            const country = getDataSources().countryDataBase(usIp);
            expect(country).toBeDefined();
            
            const header: string = "es-MX,es;q=0.9";
            if (country) {
                const score = await mapCountryHelper(header, country.name, 'HK', 'es');
                const settings = getConfiguration().checkers.localeMapsCheck;

                if (settings.enable) {
                    expect(score).toBe(0);
                }
            }
        })

        it('should penalize mismatching region', async () => {
            const country = getDataSources().countryDataBase(usIp);
            expect(country).toBeDefined();
            
            const header: string = 'fr-FR,fr;q=0.9';
            if (country) {
                const score = await mapCountryHelper(header, country.name, country.country_code, country.iso639);
                
                const settings = getConfiguration().checkers.localeMapsCheck;
                if (settings.enable) {
                    expect(score).toBe(settings.penalties.ipAndHeaderMismatch);
                }
            }
        });
    });

    describe('Missing Geo Data', () => {
        it('Should penalize if geo data fields are missing', async () => {
            const header: string = 'en-US,en;q=0.9';
            const score = await mapCountryHelper(header, undefined, undefined, undefined);
            
            const settings = getConfiguration().checkers.localeMapsCheck;
            if (settings.enable) {
                expect(score).toBe(settings.penalties.missingGeoData);
            }
        });

        it('Should penalize if only one geo data field is missing', async () => {
            const header: string = 'en-US,en;q=0.9';
            const score = await mapCountryHelper(header, 'United States', undefined, 'en');
            
            const settings = getConfiguration().checkers.localeMapsCheck;
            if (settings.enable) {
                expect(score).toBe(settings.penalties.missingGeoData);
            }
        });

        it('should penalize a matching region if it has q=0 (explicit rejection)', async () => {
            const country = getDataSources().countryDataBase(usIp);
            expect(country).toBeDefined();
            
            const header: string = 'en-US;q=0,fr-FR;q=0.9';
            if (country) {
                const score = await mapCountryHelper(header, country.name, country.country_code, country.iso639);
                
                const settings = getConfiguration().checkers.localeMapsCheck;
                if (settings.enable) {
                    expect(score).toBe(settings.penalties.ipAndHeaderMismatch);
                }
            }
        });

    });

    describe('Configuration State', () => {
        it('Should return 0 penalty if checker is disabled', async () => {
            const settings = getConfiguration().checkers.localeMapsCheck;
            const originalEnable: boolean = settings.enable;
            if (settings.enable) {
                (settings as any).enable = false;
            }

            const header: string = 'fr-FR,fr;q=0.9';
            const score = await mapCountryHelper(header, 'United States', 'US', 'en');
            
            expect(score).toBe(0);

            (settings as any).enable = originalEnable;
        });
    });
});
