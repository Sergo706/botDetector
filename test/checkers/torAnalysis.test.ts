import { it, describe, expect } from 'vitest';
import { getConfiguration, getDataSources } from '~~/src/botDetector/config/config.js';
import { TorAnalysisChecker } from '@checkers/torAnalysis.js';
import { createMockContext } from '../test-utils/test-utils.js';

const checker = new TorAnalysisChecker();

const run = (tor: object) =>
    checker.run(createMockContext({ tor }), getConfiguration());

describe('TorAnalysisChecker', () => {

    describe('no tor data', () => {
        it('produces zero score for an empty tor object', () => {
            const { score, reasons } = run({});
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });
    });

    describe('running node', () => {

        it('adds TOR_ACTIVE_NODE when running=true', () => {
            const { score, reasons } = run({ running: true });
            const cfg = getConfiguration().checkers.enableTorAnalysis;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;
            expect(score).toBe(cfg.penalties.runningNode);
            expect(reasons).toContain('TOR_ACTIVE_NODE');
        });

        it('does NOT add TOR_ACTIVE_NODE when running=false', () => {
            const { reasons } = run({ running: false });
            expect(reasons).not.toContain('TOR_ACTIVE_NODE');
        });
    });

    describe('exit node detection', () => {
        it('adds TOR_EXIT_NODE via exit_addresses array', () => {
            const { reasons, score } = run({ exit_addresses: ['185.220.101.1'] });
            const cfg = getConfiguration().checkers.enableTorAnalysis;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBe(cfg.penalties.exitNode)
            expect(reasons).toContain('TOR_EXIT_NODE');
        });

        it('adds TOR_EXIT_NODE via Exit flag', () => {
            const { reasons,score } = run({ flags: 'Exit,Fast,Running' });
            const cfg = getConfiguration().checkers.enableTorAnalysis;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBe(cfg.penalties.exitNode)
            expect(reasons).toContain('TOR_EXIT_NODE');
        });

        it('scales score with exit_probability', () => {
            const cfg = getConfiguration().checkers.enableTorAnalysis;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            const { score: scoreLow }  = run({ flags: 'Exit', exit_probability: 0.0 });
            const { score: scoreHigh } = run({ flags: 'Exit', exit_probability: 1.0 });
            expect(scoreHigh).toBeGreaterThan(scoreLow);
        });
    });

    describe('web exit capability', () => {

        it('adds TOR_WEB_EXIT_CAPABLE when exit policy accepts port 80', () => {
            const policy = JSON.stringify({ accept: ['80', '443', '6881-6889'] });
            const { reasons,score } = run({ flags: 'Exit', exit_policy_summary: policy });

            const cfg = getConfiguration().checkers.enableTorAnalysis;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(reasons).toContain('TOR_WEB_EXIT_CAPABLE');
            expect(score).toBeGreaterThanOrEqual(cfg.penalties.webExitCapable);

        });

        it('adds TOR_WEB_EXIT_CAPABLE when exit policy accepts a port range spanning 443', () => {
            const policy = JSON.stringify({ accept: ['400-500', '8080'] });
            const { reasons,score } = run({ flags: 'Exit', exit_policy_summary: policy });

            const cfg = getConfiguration().checkers.enableTorAnalysis;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBeGreaterThanOrEqual(cfg.penalties.webExitCapable);
            expect(reasons).toContain('TOR_WEB_EXIT_CAPABLE');
        });

        it('does NOT add TOR_WEB_EXIT_CAPABLE when policy explicitly rejects 80/443', () => {
            const policy = JSON.stringify({ reject: ['80', '443'] });
            const { reasons } = run({ flags: 'Exit', exit_policy_summary: policy });

            expect(reasons).not.toContain('TOR_WEB_EXIT_CAPABLE');
        });

        it('does NOT add TOR_WEB_EXIT_CAPABLE for a non-exit node even with permissive policy', () => {
            const policy = JSON.stringify({ accept: ['80', '443'] });
            const { reasons,score } = run({ flags: 'Guard,Fast', exit_policy_summary: policy });
            expect(reasons).not.toContain('TOR_WEB_EXIT_CAPABLE');
        });

        it('does NOT add TOR_WEB_EXIT_CAPABLE when exit_policy_summary is invalid JSON', () => {
            const { reasons,score } = run({ flags: 'Exit', exit_policy_summary: 'not-json' });
            expect(reasons).not.toContain('TOR_WEB_EXIT_CAPABLE');
        });
    });

    describe('BadExit flag', () => {

        it('adds TOR_BAD_EXIT when BadExit flag is present', () => {
            const { score, reasons } = run({ flags: 'BadExit,Exit' });

            const cfg = getConfiguration().checkers.enableTorAnalysis;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBeGreaterThanOrEqual(cfg.penalties.badExit);
            expect(reasons).toContain('TOR_BAD_EXIT');
        });

        it('does NOT confuse NoBadExit flag with BadExit', () => {
            const { reasons,score } = run({ flags: 'NoBadExit,Fast' });
            expect(reasons).not.toContain('TOR_BAD_EXIT');
            expect(score).toBe(0);
        });
    });

    describe('guard node', () => {
        it('adds TOR_GUARD_NODE via Guard flag', () => {
            const { reasons,score } = run({ flags: 'Guard,Fast' });

            const cfg = getConfiguration().checkers.enableTorAnalysis;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBe(cfg.penalties.guardNode);
            expect(reasons).toContain('TOR_GUARD_NODE');
        });

        it('adds TOR_GUARD_NODE when guard_probability > 0 even without flag', () => {
            const { reasons,score } = run({ flags: 'Fast', guard_probability: 0.05 });

            const cfg = getConfiguration().checkers.enableTorAnalysis;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBe(cfg.penalties.guardNode);
            expect(reasons).toContain('TOR_GUARD_NODE');
        });

        it('does NOT add TOR_GUARD_NODE when guard_probability is 0 and no flag', () => {
            const { reasons,score } = run({ flags: 'Fast', guard_probability: 0 });
            expect(reasons).not.toContain('TOR_GUARD_NODE');
            expect(score).toBe(0);
        });
    });

    describe('obsolete version', () => {

        it('adds TOR_OBSOLETE_VERSION when recommended_version=false', () => {
            const { reasons,score } = run({ recommended_version: false });

            const cfg = getConfiguration().checkers.enableTorAnalysis;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBe(cfg.penalties.obsoleteVersion);
            expect(reasons).toContain('TOR_OBSOLETE_VERSION');
        });

        it('adds TOR_OBSOLETE_VERSION when version_status="obsolete"', () => {
            const { reasons,score } = run({ version_status: 'obsolete' });

            const cfg = getConfiguration().checkers.enableTorAnalysis;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            expect(score).toBe(cfg.penalties.obsoleteVersion);
            expect(reasons).toContain('TOR_OBSOLETE_VERSION');
        });

        it('does NOT add TOR_OBSOLETE_VERSION when recommended_version=true', () => {
            const { reasons,score } = run({ recommended_version: true, version_status: 'recommended' });
            expect(reasons).not.toContain('TOR_OBSOLETE_VERSION');
            expect(score).toBe(0);
        });
    });

    describe('score accumulation for high-risk Tor node', () => {
        it('a full exit node running on obsolete version accumulates multiple penalties', () => {

            const cfg = getConfiguration().checkers.enableTorAnalysis;
            expect(cfg.enable).toBe(true)
            if (!cfg.enable) return;

            const policy = JSON.stringify({ accept: ['80', '443'] });

            const { score, reasons } = run({
                running: true,
                flags: 'Exit,Guard,BadExit',
                exit_addresses: ['185.220.101.1'],
                exit_probability: 1.0,
                guard_probability: 0.1,
                exit_policy_summary: policy,
                recommended_version: false,
            });
            expect(score).toBeGreaterThan(cfg.penalties.runningNode + cfg.penalties.exitNode);
            expect(reasons).toContain('TOR_ACTIVE_NODE');
            expect(reasons).toContain('TOR_EXIT_NODE');
            expect(reasons).toContain('TOR_WEB_EXIT_CAPABLE');
            expect(reasons).toContain('TOR_BAD_EXIT');
            expect(reasons).toContain('TOR_GUARD_NODE');
            expect(reasons).toContain('TOR_OBSOLETE_VERSION');
        });
    });

    describe('Real MMDB data', () => {

        it('returns a record with exit node fields for a known Tor exit IP', () => {
            const result = getDataSources().torDataBase('185.220.101.1');
            expect(result).not.toBeNull();
            expect(result!.running).toBe(true);
            // exit_addresses is stored as a string in this MMDB (IP address or empty string)
            expect(typeof result!.exit_addresses).toBe('string');

        });

        it('returns null for a non tor ip', () => {
            const result = getDataSources().torDataBase('8.8.8.8');
            expect(result).toBeNull();
        });
    });

    describe('configuration', () => {
        it('isEnabled returns false when disabled', () => {
            const config = getConfiguration();
            (config.checkers.enableTorAnalysis as any).enable = false;
            expect(checker.isEnabled(config)).toBe(false);
            (config.checkers.enableTorAnalysis as any).enable = true;
        });
    });
});
