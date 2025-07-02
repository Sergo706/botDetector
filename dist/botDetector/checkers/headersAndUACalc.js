import { settings } from "../../settings.js";
import { tlsBotScore } from "./cipherChecks.js";
import { headersBotDetector } from "./botDetecorHeaders.js";
import { metaUaScore } from "./badUaChecker.js";
import { pathScore } from "./pathTravelers.js";
export function calculateUaAndHeaderScore(req) {
    const reasons = [];
    let score = 0;
    console.log('[DEBUG]starting calculateUaAndHeaderScore');
    const uaString = req.get("User-Agent") || "";
    const uaLower = uaString.toLowerCase();
    if (/(headless|puppeteer|playwright|selenium|phantomjs)/.test(uaLower)) {
        score += settings.penalties.headlessBrowser;
        reasons.push('HEADLESS_BROWSER_DETECTED');
    }
    if (!uaString || uaString.length < 10) {
        score += settings.penalties.shortUserAgent;
        reasons.push('SHORT_USER_AGENT');
    }
    const tlsCheckScore = tlsBotScore(req);
    if (tlsCheckScore > 0) {
        score += tlsCheckScore;
        reasons.push('TLS_CHECK_FAILED');
    }
    const headerChecker = headersBotDetector(req);
    if (headerChecker > 0) {
        score += headerChecker;
        reasons.push('HEADER_SCORE_TOO_HIGH');
    }
    const metaUA = metaUaScore(uaString);
    if (metaUA > 0) {
        score += metaUA;
        reasons.push('META_UA_CHECK_FAILED');
    }
    const pathChecker = pathScore(req);
    if (pathChecker > 0) {
        score += pathChecker;
        reasons.push('PATH_TRAVELAR_FOUND');
    }
    return { score, reasons };
}
