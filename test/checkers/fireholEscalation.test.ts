import { it, describe, expect } from 'vitest';
import { getConfiguration } from '~~/src/botDetector/config/config.js';
import { getDataSources } from '~~/src/botDetector/config/config.js';
import { ThreatLevels } from '@checkers/fireholEscalation.js';
import { createMockContext } from '../test-utils/test-utils.js';

const checker = new ThreatLevels();

const run = (overrides: object) =>
    checker.run(createMockContext(overrides), getConfiguration());

describe('ThreatLevels (Firehol Escalation) Checker', () => {
    describe('no threats', () => {
        it('produces zero score when no threat and no anon', async () => {
            const { score, reasons } = await run({ anon: false, threatLevel: null });
            const cfg = getConfiguration().checkers.enableKnownThreatsDetections;
            expect(cfg.enable).toBe(true)
            if (cfg.enable) {
                expect(score).toBe(0);
                expect(reasons).toHaveLength(0);
            }
        });
    });

    describe('anonymity network flag', () => {
        it('penalises anon=true with ANONYMITY_NETWORK', async () => {
            const { score, reasons } = await run({ anon: true, threatLevel: null });
            const cfg = getConfiguration().checkers.enableKnownThreatsDetections;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            expect(score).toBe(cfg.penalties.anonymiseNetwork);
            expect(reasons).toContain('ANONYMITY_NETWORK');
        });
    });

    describe('Firehol threat levels', () => {
        it('level 1 critical list adds FIREHOL_L1_THREAT', async () => {
            const { score, reasons } = await run({ anon: false, threatLevel: 1 });
            const cfg = getConfiguration().checkers.enableKnownThreatsDetections;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            expect(score).toBe(cfg.penalties.threatLevels.criticalLevel1);
            expect(reasons).toContain('FIREHOL_L1_THREAT');
        });

        it('level 2 current attacks adds FIREHOL_L2_THREAT', async () => {
            const { score, reasons } = await run({ anon: false, threatLevel: 2 });
            const cfg = getConfiguration().checkers.enableKnownThreatsDetections;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            expect(score).toBe(cfg.penalties.threatLevels.currentAttacksLevel2);
            expect(reasons).toContain('FIREHOL_L2_THREAT');
        });

        it('level 3 adds FIREHOL_L3_THREAT', async () => {
            const { score, reasons } = await run({ anon: false, threatLevel: 3 });
            const cfg = getConfiguration().checkers.enableKnownThreatsDetections;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            expect(score).toBe(cfg.penalties.threatLevels.threatLevel3);
            expect(reasons).toContain('FIREHOL_L3_THREAT');
        });

        it('level 4 adds FIREHOL_L4_THREAT', async () => {
            const { score, reasons } = await run({ anon: false, threatLevel: 4 });
            const cfg = getConfiguration().checkers.enableKnownThreatsDetections;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            expect(score).toBe(cfg.penalties.threatLevels.threatLevel4);
            expect(reasons).toContain('FIREHOL_L4_THREAT');
        });

        it('anon=true + level 1 accumulates both penalties', async () => {
            const { score, reasons } = await run({ anon: true, threatLevel: 1 });
            const cfg = getConfiguration().checkers.enableKnownThreatsDetections;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const expected = cfg.penalties.anonymiseNetwork + cfg.penalties.threatLevels.criticalLevel1;
            expect(score).toBe(expected);
            expect(reasons).toContain('ANONYMITY_NETWORK');
            expect(reasons).toContain('FIREHOL_L1_THREAT');
        });
    });

    describe('Real MMDB data', () => {
        it('a known Firehol L1 IP is found in the firehol_l1 database', () => {
            const result = getDataSources().fireholLvl1DataBase('45.74.16.15');   
            expect(result).toBeDefined();
            expect(result?.network).toBe('45.74.16.0/24')
        });

        it('clean public IPs are not present in the Firehol L1 list', () => {
            const cleanIps = ['8.8.8.8', '1.1.1.1', '9.9.9.9'];
            for (const ip of cleanIps) {
                expect(getDataSources().fireholLvl1DataBase(ip)).toBeNull();
            }
        });
    });

    describe('Configuration', () => {
        it('isEnabled returns false when disabled', () => {
            const config = getConfiguration();
            (config.checkers.enableKnownThreatsDetections as any).enable = false;
            expect(checker.isEnabled(config)).toBe(false);
            (config.checkers.enableKnownThreatsDetections as any).enable = true;
        });
    });
});
