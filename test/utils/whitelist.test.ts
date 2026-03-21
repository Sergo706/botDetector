import { it, describe, expect } from 'vitest';
import { getWhiteList, isInWhiteList } from '~~/src/botDetector/utils/whitelist.js';
import { defaultSettings } from '../config.js';

describe('whitelist utilities', () => {
    describe('getWhiteList()', () => {
        it('returns the configured whitelist array', () => {
            const list = getWhiteList();
            expect(Array.isArray(list)).toBe(true);
            expect(list.length).toBeGreaterThan(0);
        });

        it('contains every ip from defaultSettings.whiteList', () => {
            const list = getWhiteList();
            for (const ip of defaultSettings.whiteList!) {
                expect(list).toContain(ip);
            }
        });
    });

    describe('isInWhiteList()', () => {
        it('returns true for a known whitelisted IP', () => {
            const ip = defaultSettings.whiteList![0];
            expect(isInWhiteList(ip)).toBe(true);
        });

        it('returns true for loopback 127.0.0.1', () => {
            expect(isInWhiteList('127.0.0.1')).toBe(true);
        });

        it('returns false for an ip not in the whitelist', () => {
            expect(isInWhiteList('1.2.3.4')).toBe(false);
        });

        it('returns false for a public ip that is not whitelisted', () => {
            expect(isInWhiteList('8.8.8.8')).toBe(false);
        });

        it('a prefix of a whitelisted ip does not match', () => {
            expect(isInWhiteList('127.0.0')).toBe(false);
        });

        it('handles the ::ffff:127.0.0.1 IPv4 mapped IPv6 format', () => {
            expect(isInWhiteList('::ffff:127.0.0.1')).toBe(true);
        });
    });
});
