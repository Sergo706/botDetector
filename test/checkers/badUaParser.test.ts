import { describe, it, expect } from "vitest";
import { BadUaChecker } from '@checkers/badUaChecker.js'
import { getConfiguration } from "~~/src/botDetector/config/config.js";
import { createMockContext } from '../test-utils/test-utils.js';

describe('User-Agent parser for severity', () => {
    const toDetect = ['*YAYAYAY*', '*Nmap Scripting Engine*', '*NDES client *', 'Wireshark/*'];
    const checker = new BadUaChecker();

    it('Detects bad user agent from mysql', async () => {
        for (const v of toDetect) {
            const { score } = await checker.run(
                createMockContext({ req: { get: () => v } as any }),
                getConfiguration()
            );
            expect(score).toBeGreaterThan(0);
        }
    })
    
    it('Handle scoring based on severity', async () => {
        const getScore = async (v: string) => {
            return (await checker.run(
                createMockContext({ req: { get: () => v } as any }),
                getConfiguration()
            )).score;
        };

        const critical = await getScore(toDetect[0]);
        const high = await getScore(toDetect[1]);
        const medium = await getScore(toDetect[2]);
        const low = await getScore(toDetect[3]);
        const none = await getScore('UserAgent');
        const settings = getConfiguration().checkers.knownBadUserAgents;

        if (settings.enable) {
            expect(critical).toBe(settings.penalties.criticalSeverity);
            expect(high).toBe(settings.penalties.highSeverity);
            expect(medium).toBe(settings.penalties.mediumSeverity);
            expect(low).toBe(settings.penalties.lowSeverity);
            expect(none).toBe(0);
        }
    })

    it('returns 0 on disabled config', async () => {
        const settings = getConfiguration().checkers.knownBadUserAgents;
        const originalEnable: boolean = settings.enable;
        
        if (settings.enable) {
            (settings as any).enable = false;
        }

        const { score } = await checker.run(
            createMockContext({ req: { get: () => toDetect[0] } as any }),
            getConfiguration()
        );

        expect(score).toBe(0);
        (settings as any).enable = originalEnable;
    })

    it(`shouldn't flag unlisted user agents`, async () => {
        const useAgents = ['random', 'invalid', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36']

        for (const v of useAgents) {
            const { score } = await checker.run(
                createMockContext({ req: { get: () => v } as any }),
                getConfiguration()
            );
            expect(score).toBe(0);
        }
    })
})
