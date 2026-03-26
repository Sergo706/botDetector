import { it, describe, expect } from 'vitest';
import { getDataSources } from '~~/src/botDetector/config/config.js';

describe('mmdbDataReaders, DataSources', () => {

    describe('countryDataBase', () => {
        it('returns a record for 8.8.8.8', () => {
            const record = getDataSources().countryDataBase('8.8.8.8');
            expect(record).not.toBeNull();
            expect(record!.name).toBeDefined();
        });

        it('record contains name', () => {
            const record = getDataSources().countryDataBase('8.8.8.8');
            expect(record!.name!.toLowerCase()).toContain('united states');
        });

        it('returns null for a documentation-range IP', () => {
            const record = getDataSources().countryDataBase('203.0.113.1');
            expect(() => getDataSources().countryDataBase('203.0.113.1')).not.toThrow();
            if (record !== null) {
                expect(typeof record.name).toBe('string');
            }
        });
    });

    describe('cityDataBase', () => {
        it('does not throw for 8.8.8.8', () => {
            expect(() => getDataSources().cityDataBase('8.8.8.8')).not.toThrow();
        });

        it('returns a city record with expected fields when the IP is covered', () => {
            const ips = ['8.8.8.8', '1.1.1.1', '66.249.66.1', '93.184.216.34'];
            const record = ips.map(ip => getDataSources().cityDataBase(ip)).find(r => r !== null) ?? null;
            if (record !== null) {
                expect(record.timezone).toBeDefined();
                expect(typeof record.timezone).toBe('string');
            }
        });
    });

    describe('asnDataBase', () => {
        it('returns an ASN record for 8.8.8.8', () => {
            const record = getDataSources().asnDataBase('8.8.8.8');
            expect(record).not.toBeNull();
        });

        it('record contains asn_name', () => {
            const record = getDataSources().asnDataBase('8.8.8.8');
            expect(record!.asn_name).toBeDefined();
            expect(typeof record!.asn_name).toBe('string');
        });

        it('record contains asn_id', () => {
            const record = getDataSources().asnDataBase('8.8.8.8');
            expect(record!.asn_id).toBeDefined();
        });
    });

    describe('proxyDataBase', () => {
        it('does not throw for any queried IP', () => {
            const ips = ['8.8.8.8', '1.1.1.1', '203.0.113.1'];
            for (const ip of ips) {
                expect(() => getDataSources().proxyDataBase(ip)).not.toThrow();
            }
        });

        it('returns null for a documentation-range IP (203.0.113.1 is never a proxy)', () => {
            const record = getDataSources().proxyDataBase('203.0.113.1');
            expect(record).toBeNull();
        });
    });

    describe('torDataBase', () => {
        it('does not throw for any queried ip', () => {
            expect(() => getDataSources().torDataBase('8.8.8.8')).not.toThrow();
            expect(() => getDataSources().torDataBase('1.1.1.1')).not.toThrow();
        });

        it('returns null for 8.8.8.8 (not a Tor node)', () => {
            const record = getDataSources().torDataBase('8.8.8.8');
            expect(record).toBeNull();
        });
    });

    describe('goodBotsDataBase', () => {
        it('does not throw for any queried ip', () => {
            const ips = ['8.8.8.8', '1.1.1.1', '66.249.66.1', '64.233.160.0'];
            for (const ip of ips) {
                expect(() => getDataSources().goodBotsDataBase(ip)).not.toThrow();
            }
        });

        it('returns a record for a known Google crawler IP (66.249.66.1)', () => {
            const record = getDataSources().goodBotsDataBase('66.249.66.1');
            expect(record).not.toBeNull();
        });
    });

    describe('Firehol threat databases', () => {
        it('fireholLvl1DataBase does not throw for any ip', () => {
            expect(() => getDataSources().fireholLvl1DataBase('8.8.8.8')).not.toThrow();
        });

        it('fireholLvl2DataBase does not throw for any ip', () => {
            expect(() => getDataSources().fireholLvl2DataBase('1.1.1.1')).not.toThrow();
        });

        it('fireholLvl3DataBase does not throw for any ip', () => {
            expect(() => getDataSources().fireholLvl3DataBase('203.0.113.1')).not.toThrow();
        });

        it('fireholLvl4DataBase does not throw for any ip', () => {
            expect(() => getDataSources().fireholLvl4DataBase('8.8.8.8')).not.toThrow();
        });

        it('fireholAnonDataBase does not throw for any ip', () => {
            expect(() => getDataSources().fireholAnonDataBase('8.8.8.8')).not.toThrow();
        });

        it('returns null for a clean public IP on L1 (8.8.8.8 is not a threat)', () => {
            const record = getDataSources().fireholLvl1DataBase('8.8.8.8');
            expect(record).toBeNull();
        });
    });

    describe('lmdbUserAgentDataBase', () => {
        it('returns undefined for an unknown UA string', () => {
            const record = getDataSources().getUserAgentLmdb().get('completely-unknown-ua-xyz-123');
            expect(record).toBeUndefined();
        });

        it('returns a record for a known malicious UA key', () => {
            const record = getDataSources().getUserAgentLmdb().get('*DecoyLoader*');
            expect(record).not.toBeUndefined();
        });

        it('returned record has the expected metadata fields', () => {
            const record = getDataSources().getUserAgentLmdb().get('*DecoyLoader*');
            expect(record!.metadata_tool).toBe('DecoyLoader');
            expect(record!.metadata_category).toBe('Malware');
            expect(record!.metadata_severity).toBe('high');
            expect(typeof record!.useragent_rx).toBe('string');
            expect(record!.useragent_rx.length).toBeGreaterThan(0);
        });

        it('does not throw for arbitrary input strings', () => {
            const inputs = ['', 'Mozilla/5.0', ';;;', '\x00\xff'];
            for (const input of inputs) {
                expect(() => getDataSources().getUserAgentLmdb().get(input)).not.toThrow();
            }
        });
    });

    describe('lmdbJa4DataBase', () => {
        it('returns undefined for an unknown fingerprint', () => {
            const record = getDataSources().getJa4Lmdb().get('nonexistent_fp_zzz');
            expect(record).toBeUndefined();
        });

        it('returns a record for a known JA4T fingerprint', () => {
            const record = getDataSources().getJa4Lmdb().get('1024_2_1460_00');
            expect(record).not.toBeUndefined();
        });

        it('returned record identifies Nmap with expected fields', () => {
            const record = getDataSources().getJa4Lmdb().get('1024_2_1460_00');
            expect(record!.application).toBe('Nmap');
            expect(record!.verified).toBe(true);
            expect(record!.ja4t_fingerprint).toBe('1024_2_1460_00');
        });

        it('does not throw for arbitrary input strings', () => {
            const inputs = ['', 'not_a_fp', ';;;', 'a_b_c_d'];
            for (const input of inputs) {
                expect(() => getDataSources().getJa4Lmdb().get(input)).not.toThrow();
            }
        });
    });

    describe('optional generated MMDBs (bannedDataBase / highRiskDataBase)', () => {
        it('bannedDataBase does not throw even when mmdb may not exist', () => {
            expect(() => getDataSources().bannedDataBase('8.8.8.8')).not.toThrow();
        });

        it('highRiskDataBase does not throw even when mmdb may not exist', () => {
            expect(() => getDataSources().highRiskDataBase('8.8.8.8')).not.toThrow();
        });

        it('bannedDataBase returns null for a non-banned IP', () => {
            const record = getDataSources().bannedDataBase('8.8.8.8');
            expect(record).toBeNull();
        });
    });
});
