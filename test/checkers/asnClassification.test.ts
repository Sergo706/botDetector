import { it, describe, expect } from 'vitest';
import { getConfiguration, getDataSources } from '~~/src/botDetector/config/config.js';
import { AsnClassificationChecker } from '@checkers/asnClassification.js';
import { createMockContext } from '../test-utils/test-utils.js';

const checker = new AsnClassificationChecker();

const run = (bgp: object) =>
    checker.run(createMockContext({ bgp }), getConfiguration());

describe('AsnClassificationChecker', () => {

    describe('missing classification', () => {
        it('flags unknown classification when bgp.classification is missing', () => {
            const { score, reasons } = run({});
            const cfg = getConfiguration().checkers.enableAsnClassification;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            expect(score).toBe(cfg.penalties.unknownClassification);
            expect(reasons).toContain('ASN_CLASSIFICATION_UNKNOWN');
        });

        it('no low visibility check when classification absent', () => {
            const { reasons } = run({ hits: '1' });
            const cfg = getConfiguration().checkers.enableAsnClassification;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            expect(reasons).toContain('ASN_CLASSIFICATION_UNKNOWN');
            expect(reasons).not.toContain('ASN_LOW_VISIBILITY');
        });
    });

    describe('Content classification', () => {
        it('adds ASN_HOSTING_CLASSIFIED for content classification', () => {
            const { score, reasons } = run({ classification: 'Content', hits: '100' });
            const cfg = getConfiguration().checkers.enableAsnClassification;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            expect(score).toBeGreaterThanOrEqual(cfg.penalties.contentClassification);
            expect(reasons).toContain('ASN_HOSTING_CLASSIFIED');
        });

        it('does not add ASN_HOSTING_CLASSIFIED for non-Content classification', () => {
            const { reasons } = run({ classification: 'Eyeball', hits: '100' });
            const cfg = getConfiguration().checkers.enableAsnClassification;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            expect(reasons).not.toContain('ASN_HOSTING_CLASSIFIED');
        });
    });

    describe('Low visibility', () => {
        it('adds ASN_LOW_VISIBILITY when hits < threshold', () => {
            const cfg = getConfiguration().checkers.enableAsnClassification;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const lowHits = String(cfg.penalties.lowVisibilityThreshold - 1);
            const { reasons } = run({ classification: 'Eyeball', hits: lowHits });
            expect(reasons).toContain('ASN_LOW_VISIBILITY');
        });

        it('does NOT flag when hits equals the threshold', () => {
            const cfg = getConfiguration().checkers.enableAsnClassification;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const atThreshold = String(cfg.penalties.lowVisibilityThreshold);
            const { reasons } = run({ classification: 'Eyeball', hits: atThreshold });
            expect(reasons).not.toContain('ASN_LOW_VISIBILITY');
        });

        it('does NOT flag when hits is above the threshold', () => {
            const cfg = getConfiguration().checkers.enableAsnClassification;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const highHits = String(cfg.penalties.lowVisibilityThreshold + 50);
            const { reasons } = run({ classification: 'Eyeball', hits: highHits });
            expect(reasons).not.toContain('ASN_LOW_VISIBILITY');
        });

        it('does NOT flag when hits is undefined', () => {
            const { reasons } = run({ classification: 'Eyeball' });
            const cfg = getConfiguration().checkers.enableAsnClassification;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            expect(reasons).not.toContain('ASN_LOW_VISIBILITY');
        });

        it('does NOT flag when hits is a string', () => {
            const { reasons } = run({ classification: 'Eyeball', hits: 'unknown' });
            const cfg = getConfiguration().checkers.enableAsnClassification;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            expect(reasons).not.toContain('ASN_LOW_VISIBILITY');
        });

        it('does NOT flag when hits is a negative number', () => {
            const { reasons } = run({ classification: 'Eyeball', hits: '-5' });
            const cfg = getConfiguration().checkers.enableAsnClassification;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            expect(reasons).not.toContain('ASN_LOW_VISIBILITY');
        });

        it('does NOT flag when hits is an empty string', () => {
            const { reasons } = run({ classification: 'Eyeball', hits: '' });
            const cfg = getConfiguration().checkers.enableAsnClassification;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            expect(reasons).not.toContain('ASN_LOW_VISIBILITY');
        });
    });

    describe('Combo penalty Content + low visibility', () => {
        it('adds all three reasons for Content classification + low hits', () => {
            const cfg = getConfiguration().checkers.enableAsnClassification;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const lowHits = String(cfg.penalties.lowVisibilityThreshold - 1);
            const { score, reasons } = run({ classification: 'Content', hits: lowHits });
            expect(reasons).toContain('ASN_HOSTING_CLASSIFIED');
            expect(reasons).toContain('ASN_LOW_VISIBILITY');
            expect(reasons).toContain('ASN_HOSTING_LOW_VISIBILITY_COMBO');
            const expectedScore =
                cfg.penalties.contentClassification +
                cfg.penalties.lowVisibilityPenalty +
                cfg.penalties.comboHostingLowVisibility;
            expect(score).toBe(expectedScore);
        });

        it('does NOT add combo reason for Content with high hits', () => {
            const cfg = getConfiguration().checkers.enableAsnClassification;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            const highHits = String(cfg.penalties.lowVisibilityThreshold + 100);
            const { reasons } = run({ classification: 'Content', hits: highHits });
            expect(reasons).toContain('ASN_HOSTING_CLASSIFIED');
            expect(reasons).not.toContain('ASN_HOSTING_LOW_VISIBILITY_COMBO');
        });
    });

    describe('Real MMDB data', () => {
        it('Google Public DNS (8.8.8.8) has a classification in ASN database', () => {
            const record = getDataSources().asnDataBase('8.8.8.8');
            expect(record).toBeDefined();
            if (record) {
                expect(typeof record.classification).toBe('string');
                expect(record.classification!.length).toBeGreaterThan(0);
            }
        });

        it('ASN record for a known CDN IP has a hits value that is numeric', () => {
            const record = getDataSources().asnDataBase('1.1.1.1'); // Cloudflare
            if (record?.hits !== undefined) {
                expect(isNaN(parseInt(record.hits, 10))).toBe(false);
            }
        });
    });

    describe('Configuration', () => {
        it('isEnabled returns false when disabled', () => {
            const config = getConfiguration();
            (config.checkers.enableAsnClassification as any).enable = false;
            expect(checker.isEnabled(config)).toBe(false);
            (config.checkers.enableAsnClassification as any).enable = true;
        });
    });
});
