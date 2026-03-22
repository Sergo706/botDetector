/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { Request } from "express";
import { UAParser } from "ua-parser-js";
import { getConfiguration } from "../../config/config.js";

export class HeadersBase {
    private readonly config = getConfiguration().headerOptions;

    protected mustHaveHeadersChecker(req: Request) {
        let score = 0;
        if (req.httpVersion === '1.0') return score += 40;
        if(!req.get('User-Agent')) score += this.config.weightPerMustHeader;
        if(!req.accepts) score += this.config.weightPerMustHeader;
        if(!req.acceptsEncodings) score += this.config.weightPerMustHeader;
        if(!req.acceptsLanguages) score += this.config.weightPerMustHeader;
        if (!req.host) score += this.config.weightPerMustHeader;
        if (!req.get('Upgrade-Insecure-Requests')) score += this.config.weightPerMustHeader;
        if (!req.get('x-client-id')) score += this.config.weightPerMustHeader;
        if (req.httpVersion === '1.1' || req.get('Connection')) {
            if(!req.get('Connection') || req.get('Connection') !== 'keep-alive') score += this.config.connectionHeaderIsClose;
        }
        if (!req.get('sec-fetch-mode') || 
            !req.get('sec-fetch-dest') ||
            !req.get('sec-fetch-site')
            ) {
                score += this.config.weightPerMustHeader;
            }

        return score;
    }

    protected async engineHeaders(req: Request) {
        let score = 0;
        const ua = req.get('User-Agent');
        const hints = req.headers as Record<string, string>;
        const { name } = await new UAParser(ua, hints).getEngine().withClientHints();

        if (!name) return score += this.config.missingBrowserEngine;
        const headers = Object.keys(hints);
        const containsCh = headers.some(sec => sec.toLowerCase().startsWith('sec-ch-ua'));
        const containsTe = headers.some(te => te.toLowerCase() === 'te');

        if (name === 'Blink') {
            if (!containsCh) score += this.config.clientHintsMissingForBlink;
            if (containsTe) score += this.config.teHeaderUnexpectedForBlink;

        } else if (name === 'Gecko') {
            if (containsCh) score += this.config.clientHintsUnexpectedForGecko; 
            if (!containsTe) score += this.config.teHeaderMissingForGecko;
        } else if(name === 'WebKit') {
            if (containsCh) score += this.config.clientHintsUnexpectedForGecko;
            if (containsTe) score += this.config.teHeaderUnexpectedForBlink;
        };
        return score;
    }

    protected weirdHeaders(req: Request) {
        let score = 0;
        const accept = req.get('accept');
        
        if (accept === '*/*') score += this.config.omittedAcceptHeader;
        if (req.get('x-requested-with') && req.method === 'GET') score += this.config.AJAXHeaderExists;
        if (req.get('postman-token') || req.get('insomnia')) score += this.config.postManOrInsomiaHeaders;

        const hostHeader = req.get('X-Forwarded-Host');
        if (hostHeader && req.hostname && hostHeader !== req.hostname) {
            score += this.config.hostMismatchWeight; 
        }

        if (req.method === 'GET' && req.get('Cache-Control') === 'no-cache' && req.get('Pragma') === 'no-cache') {
            score += this.config.aggressiveCacheControlOnGet;
        }

        if (req.get('sec-fetch-site') === 'cross-site' && !req.get('referer')) {
            score += this.config.crossSiteRequestMissingReferer;
        }

          const isBrowserRequest = !req.get('x-client-id');   
          const isTopNavigation  = req.method === 'GET' && req.get('sec-fetch-dest') === 'document';

          if (isBrowserRequest && !isTopNavigation && req.method !== 'GET') {
            const origin = req.get('origin');
            if (!origin) {
                score += this.config.originHeaderIsNULL;
            } else if (origin !== `${req.protocol}://${req.hostname}`) {
                score += this.config.originHeaderMismatch;
            }
        }
        const mode = req.get('sec-fetch-mode');
        if (mode !== 'same-origin' && mode !== 'navigate') score += this.config.inconsistentSecFetchMode;

        return score;   
    } 

}
