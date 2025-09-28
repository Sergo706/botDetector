import { BanReasonCode } from "../types/checkersTypes.js";
import { getConfiguration } from "../config/config.js";

export function calculateProxyIspAndCookie(
cookie: string,
proxy: boolean,
hosting: boolean,
isp: string, 
org: string,
as: string
):{ score: number, reasons: BanReasonCode[] } {

const {penalties} = getConfiguration()

    const reasons: BanReasonCode[] = [];
    let score = 0;

if (!cookie) { 
  score += penalties.cookieMissing;        
  reasons.push('COOKIE_MISSING');
}  

if (proxy) {
    score += penalties.proxyDetected;
    reasons.push('PROXY_DETECTED');
  }
  
  if (hosting) {
    score += penalties.hostingDetected;
    reasons.push('HOSTING_DETECTED');
  }

  if (isp === 'unknown') {
    score += penalties.ispUnknown;
    reasons.push('ISP_UNKNOWN');
  }

  if (org === 'unknown' ||  as === 'unknown') {
    score += penalties.orgUnknown;
    reasons.push('ORG_UNKNOWN');
  }

    return { score, reasons };
}

