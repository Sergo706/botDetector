import { settings } from '../../settings.js';
export function headersBotDetector(req) {
    let score = 0;
    if (req.httpVersion === '1.1') {
        const conn = req.get('connection')?.toLowerCase();
        if (conn && conn === 'close')
            score += settings.penalties.headerOptions.connectionHeaderIsClose;
    }
    const isBrowserRequest = !req.get('x-client-id');
    const isTopNavigation = req.method === 'GET' && req.get('sec-fetch-dest') === 'document';
    if (isBrowserRequest && !isTopNavigation && req.method !== 'GET') {
        const origin = req.get('origin');
        if (!origin) {
            score += settings.penalties.headerOptions.originHeaderIsNULL;
        }
        else if (origin !== `${req.protocol}://${req.hostname}`) {
            score += settings.penalties.headerOptions.originHeaderMissmatch;
        }
    }
    const accept = req.get('accept');
    const acceptLanguage = req.get('accept-language');
    const hostHeader = req.get('X-Forwarded-Host');
    if (!acceptLanguage)
        score += settings.penalties.headerOptions.ommitedAcceptLanguage;
    if (!accept)
        score += settings.penalties.headerOptions.acceptHeader.acceptIsNULL;
    const mustHeaders = new Set([
        'sec-fetch-site',
        'sec-fetch-mode',
        'sec-fetch-dest',
        'sec-fetch-user',
        'accept-encoding',
        'accept-language',
        'referer',
    ]);
    mustHeaders.forEach((h, i) => {
        if (req.method === 'POST' && h.startsWith('sec-fetch-'))
            return;
        if (!req.get(h))
            score += settings.penalties.headerOptions.weightPerMustHeader;
    });
    if (accept && accept.trim() === '*/*')
        score += settings.penalties.headerOptions.acceptHeader.ommitedAcceptHeader;
    else if (accept && accept.length < 10)
        score += settings.penalties.headerOptions.acceptHeader.shortAcceptHeader;
    if (req.get('x-requested-with') && req.method === 'GET')
        score += settings.penalties.headerOptions.AJAXHeaderExists;
    if (req.get('postman-token') || req.get('insomnia'))
        score += settings.penalties.headerOptions.postManOrInsomiaHeaders;
    if (hostHeader && req.hostname && hostHeader !== req.hostname)
        score += settings.penalties.headerOptions.hostMismatchWeight;
    return score;
}
