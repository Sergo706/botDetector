import { it, describe, expect } from 'vitest';
import { getConfiguration } from '~~/src/botDetector/config/config.js';
import { BrowserDetailsAndDeviceChecker } from '@checkers/browserTypesAneDevicesCalc.js';
import { createMockContext } from '../test-utils/test-utils.js';

const checker = new BrowserDetailsAndDeviceChecker();

const run = (parsedUA: object) =>
    checker.run(createMockContext({ parsedUA }), getConfiguration());

// desktop context
const desktop = {
    browser: 'Chrome',
    browserType: 'browser',
    browserVersion: '124.0',
    os: 'Windows',
    device: 'desktop',
    deviceVendor: undefined,
    deviceModel: 'PC',
};

// mobile context
const mobile = {
    browser: 'Chrome',
    browserType: 'browser',
    browserVersion: '124.0',
    os: 'Android',
    device: 'mobile',
    deviceVendor: 'Samsung',
    deviceModel: 'SM-G998B',
};

describe('BrowserDetailsAndDeviceChecker', () => {

    describe('no penalties for valid context', () => {
        it('clean desktop browser produces zero score', async () => {
            const { score, reasons } = await run(desktop);
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });

        it('clean mobile device produces zero score', async () => {
            const { score, reasons } = await run(mobile);
            expect(score).toBe(0);
            expect(reasons).toHaveLength(0);
        });
    });

    describe('CLI / library', () => {
        it('flags browserType = cli', async () => {
            const { score, reasons } = await run({ ...desktop, browserType: 'cli' });
            const p = getConfiguration().checkers.enableBrowserAndDeviceChecks;
            expect(p.enable).toBe(true)
            if (p.enable) {
                p.penalties.cliOrLibrary
                expect(score).toBe(p.penalties.cliOrLibrary);
                expect(reasons).toContain('CLI_OR_LIBRARY');
            }
        });

        it('flags browserType = library', async () => {
            const { reasons, score } = await run({ ...desktop, browserType: 'library' });
            const p = getConfiguration().checkers.enableBrowserAndDeviceChecks;
            expect(p.enable).toBe(true)
            if (p.enable) {
                expect(score).toBe(p.penalties.cliOrLibrary);
                expect(reasons).toContain('CLI_OR_LIBRARY');
            }
        });
    });

    describe('Internet Explorer', () => {
        for (const name of ['ie', 'iemobile', 'Internet Explorer', 'IE']) {
            it(`flags browser name "${name}"`, async () => {
                const { reasons, score } = await run({ ...desktop, browser: name });
                const p = getConfiguration().checkers.enableBrowserAndDeviceChecks;
                expect(p.enable).toBe(true)
                if (p.enable) {
                    expect(score).toBe(p.penalties.internetExplorer);
                    expect(reasons).toContain('INTERNET_EXPLORER')
                };
            });
        }
    });

    describe('Kali Linux OS', () => {
        it('flags os containing "kali"', async () => {
            const { score, reasons } = await run({ ...desktop, os: 'Kali Linux' });
            const p = getConfiguration().checkers.enableBrowserAndDeviceChecks;
            expect(p.enable).toBe(true)
            if (p.enable) {
                expect(score).toBe(p.penalties.linuxOs);
                expect(reasons).toContain('KALI_LINUX_OS');
            }
        });
    });

    describe('Impossible browser combinations', () => {
        it('flags Safari on Windows', async () => {
            const { reasons, score } = await run({ ...desktop, browser: 'Safari', os: 'Windows' });
            const p = getConfiguration().checkers.enableBrowserAndDeviceChecks;
            expect(p.enable).toBe(true)
            if (p.enable) {
                expect(score).toBe(p.penalties.impossibleBrowserCombinations);
                expect(reasons).toContain('IMPOSSIBLE_BROWSER_COMBINATION')
            };
        });

        it('flags Mac OS with mobile device type', async () => {
            const { reasons, score } = await run({ ...mobile, os: 'Mac OS', device: 'mobile' });
            const p = getConfiguration().checkers.enableBrowserAndDeviceChecks;
            expect(p.enable).toBe(true)
            if (p.enable) { 
                expect(score).toBe(p.penalties.impossibleBrowserCombinations);
                expect(reasons).toContain('IMPOSSIBLE_BROWSER_COMBINATION')
            };
        });

        it('flags desktop device type with a deviceVendor set', async () => {
            const { reasons, score } = await run({ ...desktop, device: 'desktop', deviceVendor: 'Apple' });
            const p = getConfiguration().checkers.enableBrowserAndDeviceChecks;
            expect(p.enable).toBe(true)
            if (p.enable) { 
                expect(score).toBe(p.penalties.impossibleBrowserCombinations);
                expect(reasons).toContain('IMPOSSIBLE_BROWSER_COMBINATION')
            };
        });
    });

    describe('Missing / unknown fields', () => {
        it('flags missing browser name', async () => {
            const { reasons, score } = await run({ ...desktop, browser: '' });
            const p = getConfiguration().checkers.enableBrowserAndDeviceChecks;
            expect(p.enable).toBe(true)
            if (p.enable) {
                expect(score).toBe(p.penalties.browserNameUnknown);
                expect(reasons).toContain('BROWSER_NAME_UNKNOWN')
            };
        });

        it('flags missing browser version', async () => {
            const { reasons, score } = await run({ ...desktop, browserVersion: undefined });
            const p = getConfiguration().checkers.enableBrowserAndDeviceChecks;
            expect(p.enable).toBe(true)
            if (p.enable) { 
                expect(score).toBe(p.penalties.browserVersionUnknown);
                expect(reasons).toContain('BROWSER_VERSION_UNKNOWN')
            };
        });

        it('flags desktop without OS', async () => {
            const { reasons, score } = await run({ ...desktop, os: '' });
            const p = getConfiguration().checkers.enableBrowserAndDeviceChecks;
            expect(p.enable).toBe(true)
            if (p.enable) {
                expect(score).toBe(p.penalties.desktopWithoutOS);
                expect(reasons).toContain('DESKTOP_WITHOUT_OS')
            };
        });

        it('flags non-desktop without deviceVendor', async () => {
            const { reasons, score } = await run({ ...mobile, deviceVendor: undefined });
            const p = getConfiguration().checkers.enableBrowserAndDeviceChecks;
            expect(p.enable).toBe(true)
            if (p.enable) {
                expect(score).toBe(p.penalties.deviceVendorUnknown)
                expect(reasons).toContain('DEVICE_VENDOR_UNKNOWN')
            };
        });

        it('flags missing deviceModel', async () => {
            const { reasons, score } = await run({ ...desktop, deviceModel: undefined });
            const p = getConfiguration().checkers.enableBrowserAndDeviceChecks;
            expect(p.enable).toBe(true)
            if (p.enable) {
                expect(score).toBe(p.penalties.deviceModelUnknown)
                expect(reasons).toContain('NO_MODEL')
            };
        });

        it('flags missing browserType when not a named desktop browser', async () => {
            const { reasons, score } = await run({ ...desktop, browserType: undefined, browser: '' });
            const p = getConfiguration().checkers.enableBrowserAndDeviceChecks;
            expect(p.enable).toBe(true)
            if (p.enable) {
                expect(score).toBe(p.penalties.browserTypeUnknown + p.penalties.browserNameUnknown)
                expect(reasons).toContain('BROWSER_TYPE_UNKNOWN')
            };
        });
    });

    describe('Score accumulation', () => {
        it('accumulates multiple penalties for a fully empty UA', async () => {
            const { score, reasons } = await run({
                browser: '',
                browserType: undefined,
                browserVersion: undefined,
                os: '',
                device: 'desktop',
                deviceVendor: undefined,
                deviceModel: undefined,
            });
            const p = getConfiguration().checkers.enableBrowserAndDeviceChecks;
            expect(p.enable).toBe(true)
            if (p.enable) {
                const expectedScore = p.penalties.browserNameUnknown +
                                      p.penalties.browserTypeUnknown + 
                                      p.penalties.browserVersionUnknown +
                                      p.penalties.desktopWithoutOS +
                                      p.penalties.deviceModelUnknown;
                expect(score).toBe(expectedScore);
                expect(reasons.length).toBe(5);
            }
        });
    });

    describe('Configuration', () => {
        it('isEnabled returns false when checker is disabled', () => {
            const config = getConfiguration();
            (config.checkers.enableBrowserAndDeviceChecks as any).enable = false;
            expect(checker.isEnabled(config)).toBe(false);
            (config.checkers.enableBrowserAndDeviceChecks as any).enable = true;
        });
    });
});
