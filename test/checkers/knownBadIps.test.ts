import { it, describe, expect, beforeAll, vi } from 'vitest';
import { getConfiguration } from '~~/src/botDetector/config/config.js';
import * as configModule from '~~/src/botDetector/config/config.js';
import { KnownBadIps } from '@checkers/knownBadIps.js';
import { createMockContext } from '../test-utils/test-utils.js';
import { BANNED_IPS, HIGH_RISK_IPS, populateTestMmdb } from '../test-utils/mmdb-seed.js';
import type { DataSources } from '~~/src/botDetector/helpers/mmdbDataReaders.js';

const checker = new KnownBadIps();

let freshSources: DataSources;

beforeAll(async () => {
    freshSources = await populateTestMmdb();
    vi.spyOn(configModule, 'getDataSources').mockReturnValue(freshSources);
});

function run(ip: string) {
    const config = getConfiguration();
    (config.checkers.enableKnownBadIpsCheck as any).enable = true;
    return checker.run(createMockContext({ ipAddress: ip }), config);
}

describe('KnownBadIps Checker', () => {

    describe('clean ips no penalties', () => {
        it('returns zero score and no reasons for 8.8.8.8', () => {
            expect(freshSources.bannedDataBase('8.8.8.8')).toBeNull();
            expect(freshSources.highRiskDataBase('8.8.8.8')).toBeNull();
            const { score, reasons } = run('8.8.8.8');
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });

        it('returns zero for a loopback address', () => {
            expect(freshSources.bannedDataBase('127.0.0.1')).toBeNull();
            const { score, reasons } = run('127.0.0.1');
            expect(score).toBe(0);
            expect(reasons).not.toContain('PREVIOUSLY_BANNED_IP');
        });
    });

    describe('banned ip, PREVIOUSLY_BANNED_IP path', () => {
        it('all 10 seeded IPs are present in banned.mmdb', () => {
            for (const ip of BANNED_IPS) {
                expect(freshSources.bannedDataBase(ip), `${ip} missing from banned.mmdb`).not.toBeNull();
            }
        });

        it('flags PREVIOUSLY_BANNED_IP and BAD_BOT_DETECTED for a known banned IP', () => {
            const cfg = getConfiguration().checkers.enableKnownBadIpsCheck;
            expect(cfg.enable).toBe(true);
            if (!cfg.enable) return;

            const { score, reasons } = run('192.0.2.10');
            expect(score).toBe(0);
            expect(reasons).toContain('PREVIOUSLY_BANNED_IP');
            expect(reasons).toContain('BAD_BOT_DETECTED');
        });

        it('flags all 10 seeded banned IPs with PREVIOUSLY_BANNED_IP', () => {
            const cfg = getConfiguration().checkers.enableKnownBadIpsCheck;
            if (!cfg.enable) return;

            for (const ip of BANNED_IPS) {
                const { reasons } = run(ip);
                expect(reasons, `Expected PREVIOUSLY_BANNED_IP for ${ip}`).toContain('PREVIOUSLY_BANNED_IP');
                expect(reasons).toContain('BAD_BOT_DETECTED');
            }
        });

        it('score is 0 for a banned IP', () => {
            const { score } = run('192.0.2.16');
            expect(score).toBe(0);
        });
    });

    describe('High risk ip, PREVIOUSLY_HIGH_RISK_IP path', () => {
        it('all 3 seeded high risk ips are present in highRisk.mmdb', () => {
            for (const ip of HIGH_RISK_IPS) {
                expect(freshSources.highRiskDataBase(ip), `${ip} missing from highRisk.mmdb`).not.toBeNull();
            }
        });

        it('flags PREVIOUSLY_HIGH_RISK_IP for a known high-risk IP', () => {
            const cfg = getConfiguration().checkers.enableKnownBadIpsCheck;
            expect(cfg.enable).toBe(true);
            if (!cfg.enable) return;

            const { score, reasons } = run('203.0.113.200');
            expect(score).toBeGreaterThan(0);
            expect(reasons).toContain('PREVIOUSLY_HIGH_RISK_IP');
        });

        it('score is proportional to the stored high risk score ratio', () => {
            const config = getConfiguration();
            const cfg = config.checkers.enableKnownBadIpsCheck;
            if (!cfg.enable) return;

            for (const ip of HIGH_RISK_IPS) {
                const highRisk = freshSources.highRiskDataBase(ip);
                expect(highRisk).not.toBeNull();
                if (!highRisk) continue;

                const { score } = run(ip);
                const ratio = Math.min(highRisk.score / config.banScore, 1);
                const expectedScore = Math.round(cfg.highRiskPenalty * ratio);
                expect(score).toBe(expectedScore);
            }
        });

        it('score does not exceed highRiskPenalty cap', () => {
            const cfg = getConfiguration().checkers.enableKnownBadIpsCheck;
            if (!cfg.enable) return;
            const maxPossible = cfg.highRiskPenalty;

            for (const ip of HIGH_RISK_IPS) {
                const { score } = run(ip);
                expect(score).toBeLessThanOrEqual(maxPossible);
            }
        });
    });

    describe('DataSources graceful handling', () => {
        it('bannedDataBase returns null for a private ip', () => {
            expect(freshSources.bannedDataBase('192.168.1.100')).toBeNull();
        });

        it('highRiskDataBase returns null for a private IP', () => {
            expect(freshSources.highRiskDataBase('10.10.10.10')).toBeNull();
        });
    });

    describe('configuration', () => {
        it('returns zero when disabled', () => {
            const config = getConfiguration();
            (config.checkers.enableKnownBadIpsCheck as any).enable = false;
            const { score, reasons } = checker.run(createMockContext({ ipAddress: '8.8.8.8' }), config);
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
            (config.checkers.enableKnownBadIpsCheck as any).enable = true;
        });

        it('isEnabled reflects config state', () => {
            const config = getConfiguration();
            (config.checkers.enableKnownBadIpsCheck as any).enable = false;
            expect(checker.isEnabled(config)).toBe(false);
            (config.checkers.enableKnownBadIpsCheck as any).enable = true;
            expect(checker.isEnabled(config)).toBe(true);
        });
    });
});
