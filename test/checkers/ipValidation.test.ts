import { it, describe, expect } from 'vitest';
import { getConfiguration } from '~~/src/botDetector/config/config.js';
import { IpChecker } from '@checkers/ipValidation.js';
import { createMockContext } from '../test-utils/test-utils.js';

const checker = new IpChecker();
const run = (ip: string) => checker.run(createMockContext({ ipAddress: ip }), getConfiguration());

describe('IpChecker', () => {
    describe('valid addresses', () => {

        it('accepts a standard ipv4 address', async () => {
            const { score, reasons } = await run('8.8.8.8');
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });

        it('accepts a private ipv4 address', async () => {
            const { score } = await run('192.168.1.1');
            expect(score).toBe(0);
        });

        it('accepts a full ipv6 address', async () => {
            const { score } = await run('2001:4860:4860::8888');
            expect(score).toBe(0);
        });

        it('accepts a loopback ipv4', async () => {
            const { score } = await run('127.0.0.1');
            expect(score).toBe(0);
        });

        it('accepts loopback ipv6', async () => {
            const { score } = await run('::1');
            expect(score).toBe(0);
        });
    });

    describe('invalid addresses', () => {
        it('flags an empty string', async () => {
            const { score, reasons } = await run('');
            expect(score).toBe(getConfiguration().banScore);
            expect(reasons).toContain('IP_INVALID');
        });

        it('flags a plain hostname', async () => {
            const { score, reasons } = await run('example.com');
            expect(score).toBe(getConfiguration().banScore);
            expect(reasons).toContain('IP_INVALID');
        });

        it('flags an out of range octet', async () => {
            const { score, reasons } = await run('256.0.0.1');
            expect(score).toBe(getConfiguration().banScore);
            expect(reasons).toContain('IP_INVALID');
        });

        it('flags an address with a port appended', async () => {
            const { score, reasons } = await run('8.8.8.8:80');
            expect(score).toBe(getConfiguration().banScore);
            expect(reasons).toContain('IP_INVALID');
        });

        it('flags a random string', async () => {
            const { score, reasons } = await run('not-an-ip');
            expect(score).toBe(getConfiguration().banScore);
            expect(reasons).toContain('IP_INVALID');
        });

        it('flags an ipv4 with few octets', async () => {
            const { score, reasons } = await run('10.0.1');
            expect(score).toBe(getConfiguration().banScore);
            expect(reasons).toContain('IP_INVALID');
        });

        it('flags a cidr block', async () => {
            const { score, reasons } = await run('10.0.0.0/8');
            expect(score).toBe(getConfiguration().banScore);
            expect(reasons).toContain('IP_INVALID');
        });
    });

    describe('configuration', () => {
        it('returns 0 when checker is disabled', async () => {
            const config = getConfiguration();
            const original = config.checkers.enableIpChecks.enable;
            (config.checkers.enableIpChecks as any).enable = false;

            expect(checker.isEnabled(config)).toBe(false);
            (config.checkers.enableIpChecks as any).enable = original;
        });
    });
});
