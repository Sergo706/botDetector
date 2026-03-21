import { it, describe, expect } from 'vitest';
import { getConfiguration } from '~~/src/botDetector/config/config.js';
import { HeaderAnalysis } from '~~/src/botDetector/checkers/headers/headers.js';
import { makeReq } from '../test-utils/test-utils.js';

const cfg = () => getConfiguration().headerOptions;

function score(reqOpts: Parameters<typeof makeReq>[0] = {}) {
    const req = makeReq(reqOpts);
    return new HeaderAnalysis(req).scoreHeaders();
}

describe('HeaderAnalysis', () => {

    describe('mustHaveHeadersChecker', () => {

        it('returns 0 for a fully valid Chrome request', async () => {
            expect(await score()).toBe(0);
        });

        it('returns 40 immediately for HTTP/1.0', async () => {
            const s = await score({ httpVersion: '1.0' });
            expect(s).toBeGreaterThanOrEqual(40);
        });

        it('penalises missing User-Agent', async () => {
            const s = await score({ ua: '', headers: { 'user-agent': '' } });
            expect(s).toBeGreaterThanOrEqual(cfg().weightPerMustHeader);
        });

        it('penalises missing host header', async () => {
            const s = await score({ hostname: '', host: '' });
            expect(s).toBeGreaterThanOrEqual(cfg().weightPerMustHeader);
        });

        it('penalises missing Upgrade-Insecure-Requests', async () => {
            const s = await score({ headers: { 'upgrade-insecure-requests': '' } });
            expect(s).toBeGreaterThanOrEqual(cfg().weightPerMustHeader);
        });

        it('penalises missing x-client-id', async () => {
            const s = await score({ headers: { 'x-client-id': '' } });
            expect(s).toBeGreaterThanOrEqual(cfg().weightPerMustHeader);
        });

        it('penalises missing sec-fetch-mode', async () => {
            const s = await score({ headers: { 'sec-fetch-mode': '' } });
            expect(s).toBeGreaterThanOrEqual(cfg().weightPerMustHeader);
        });

        it('penalises missing sec-fetch-dest', async () => {
            const s = await score({ headers: { 'sec-fetch-dest': '' } });
            expect(s).toBeGreaterThanOrEqual(cfg().weightPerMustHeader);
        });

        it('penalises missing sec-fetch-site', async () => {
            const s = await score({ headers: { 'sec-fetch-site': '' } });
            expect(s).toBeGreaterThanOrEqual(cfg().weightPerMustHeader);
        });

        it('penalises Connection: close on HTTP/1.1', async () => {
            const s = await score({
                httpVersion: '1.1',
                headers: { 'connection': 'close' },
            });
            expect(s).toBeGreaterThanOrEqual(cfg().connectionHeaderIsClose);
        });
    });

    describe('engineHeaders', () => {

        it('penalises missing browser engine', async () => {
            const s = await score({ ua: 'unknown-agent/1.0' });
            expect(s).toBeGreaterThanOrEqual(cfg().missingBrowserEngine);
        });

        it('penalises Blink UA missing sec-ch-ua headers', async () => {
            const req = makeReq({});
            delete (req.headers as Record<string, any>)['sec-ch-ua'];
            delete (req.headers as Record<string, any>)['sec-ch-ua-mobile'];
            delete (req.headers as Record<string, any>)['sec-ch-ua-platform'];
            const s = await new HeaderAnalysis(req).scoreHeaders();
            expect(s).toBeGreaterThanOrEqual(cfg().clientHintsMissingForBlink);
        });

        it('penalises Blink UA with unexpected TE header', async () => {
            const s = await score({ headers: { 'te': 'trailers' } });
            expect(s).toBeGreaterThanOrEqual(cfg().teHeaderUnexpectedForBlink);
        });

        it('penalises Gecko UA with client hints present', async () => {
            const geckoUa = 'Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0';
            const s = await score({
                ua: geckoUa,
                headers: {
                    'sec-ch-ua': '"Firefox";v="126"',
                    'sec-ch-ua-platform': '"Linux"',
                },
            });
            expect(s).toBeGreaterThanOrEqual(cfg().clientHintsUnexpectedForGecko);
        });

        it('penalises Gecko UA missing TE header', async () => {
            const geckoUa = 'Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0';
            const s = await score({
                ua: geckoUa,
                headers: {
                    'sec-ch-ua': '',
                    'sec-ch-ua-mobile': '',
                    'sec-ch-ua-platform': '',
                },
            });
            expect(s).toBeGreaterThanOrEqual(cfg().teHeaderMissingForGecko);
        });

        it('penalises WebKit UA with client hints present', async () => {
            const safariUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15';
            const s = await score({
                ua: safariUa,
                headers: {
                    'sec-ch-ua': '"Safari";v="17"',
                    'sec-ch-ua-platform': '"macOS"',
                },
            });
            expect(s).toBeGreaterThanOrEqual(cfg().clientHintsUnexpectedForGecko);
        });

        it('penalises WebKit UA with unexpected TE header', async () => {
            const safariUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15';
            const s = await score({
                ua: safariUa,
                headers: {
                    'te': 'trailers',
                    'sec-ch-ua': '',
                    'sec-ch-ua-mobile': '',
                    'sec-ch-ua-platform': '',
                },
            });
            expect(s).toBeGreaterThanOrEqual(cfg().teHeaderUnexpectedForBlink);
        });
    });

    describe('weirdHeaders', () => {

        it('penalises wildcard Accept: */*', async () => {
            const s = await score({ headers: { 'accept': '*/*' } });
            expect(s).toBeGreaterThanOrEqual(cfg().omittedAcceptHeader);
        });

        it('penalises x-requested-with on a GET request', async () => {
            const s = await score({
                method: 'GET',
                headers: { 'x-requested-with': 'XMLHttpRequest' },
            });
            expect(s).toBeGreaterThanOrEqual(cfg().AJAXHeaderExists);
        });

        it('penalises postman-token header', async () => {
            const s = await score({ headers: { 'postman-token': 'abc-123' } });
            expect(s).toBeGreaterThanOrEqual(cfg().postManOrInsomiaHeaders);
        });

        it('penalises insomnia header', async () => {
            const s = await score({ headers: { 'insomnia': '2024.1' } });
            expect(s).toBeGreaterThanOrEqual(cfg().postManOrInsomiaHeaders);
        });

        it('penalises X-Forwarded-Host mismatch with hostname', async () => {
            const s = await score({
                hostname: 'example.com',
                headers: { 'x-forwarded-host': 'evil.com' },
            });
            expect(s).toBeGreaterThanOrEqual(cfg().hostMismatchWeight);
        });

        it('penalises aggressive Cache-Control on GET', async () => {
            const s = await score({
                method: 'GET',
                headers: {
                    'cache-control': 'no-cache',
                    'pragma': 'no-cache',
                },
            });
            expect(s).toBeGreaterThanOrEqual(cfg().aggressiveCacheControlOnGet);
        });

        it('penalises cross site request missing referer', async () => {
            const s = await score({
                headers: {
                    'sec-fetch-site': 'cross-site',
                    'referer': '',
                },
            });
            expect(s).toBeGreaterThanOrEqual(cfg().crossSiteRequestMissingReferer);
        });

        it('penalises missing origin on non GET browser request', async () => {
            const s = await score({
                method: 'POST',
                headers: {
                    'x-client-id': '',
                    'sec-fetch-dest': 'empty',
                    'origin': '',
                },
            });
            expect(s).toBeGreaterThanOrEqual(cfg().originHeaderIsNULL);
        });

        it('penalises mismatched origin on non-GET browser request', async () => {
            const s = await score({
                method: 'POST',
                protocol: 'https',
                hostname: 'example.com',
                headers: {
                    'x-client-id': '',
                    'sec-fetch-dest': 'empty',
                    'origin': 'https://evil.com',
                },
            });
            expect(s).toBeGreaterThanOrEqual(cfg().originHeaderMismatch);
        });

        it('penalises inconsistent sec-fetch-mode', async () => {
            const s = await score({
                headers: { 'sec-fetch-mode': 'cors' },
            });
            expect(s).toBeGreaterThanOrEqual(cfg().inconsistentSecFetchMode);
        });

        it('does not penalise sec-fetch-mode same-origin', async () => {
            const base = await score();
            const s = await score({ headers: { 'sec-fetch-mode': 'same-origin' } });
            expect(s).toBe(base);
        });
    });

    describe('scoreHeaders accumulation', () => {

        it('accumulates penalties from multiple categories', async () => {
            const s = await score({
                ua: 'totally-unknown-agent/1.0',
                method: 'GET',
                headers: {
                    'accept': '*/*',
                    'postman-token': 'abc',
                    'sec-fetch-mode': 'cors',
                    'upgrade-insecure-requests': '',
                    'x-client-id': '',
                },
            });
            const h = cfg();
            const minimum = h.missingBrowserEngine + h.omittedAcceptHeader + h.postManOrInsomiaHeaders;
            expect(s).toBeGreaterThanOrEqual(minimum);
        });
    });
});
