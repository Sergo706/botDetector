import { BanReasonCode } from "../types/checkersTypes.js";
import { settings } from "../settings.js";

export function calculateProxyIspAndCookie(
cookie: string,
proxy: boolean,
hosting: boolean,
isp: string, 
org: string,
as: string
):{ score: number, reasons: BanReasonCode[] } {

    const reasons: BanReasonCode[] = [];
    let score = 0;

if (!cookie) { 
  score += settings.penalties.cookieMissing;        
  reasons.push('COOKIE_MISSING');
}  

if (proxy) {
    score += settings.penalties.proxyDetected;
    reasons.push('PROXY_DETECTED');
  }
  
  if (hosting) {
    score += settings.penalties.hostingDetected;
    reasons.push('HOSTING_DETECTED');
  }

  if (isp === 'unknown') {
    score += settings.penalties.ispUnknown;
    reasons.push('ISP_UNKNOWN');
  }

  if (!org || org === 'unknown' || !as ||  as === 'unknown') {
    score += settings.penalties.orgUnknown;
    reasons.push('ORG_UNKNOWN');
  }

    return { score, reasons };
}

