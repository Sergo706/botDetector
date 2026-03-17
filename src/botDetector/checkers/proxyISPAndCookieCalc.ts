import { BanReasonCode, IBotChecker } from "../types/checkersTypes.js";
import { ValidationContext } from "../types/botDetectorTypes.js";
import { BotDetectorConfig } from "../types/configSchema.js";
import { CheckerRegistry } from "./CheckerRegistry.js";

export class ProxyIspAndCookieChecker implements IBotChecker<BanReasonCode> {
  name = 'Proxy, ISP and Cookie Verification';
  phase = 'heavy' as const;

  isEnabled(config: BotDetectorConfig): boolean {
    return config.checkers.enableProxyIspCookiesChecks.enable;
  }

  async run(ctx: ValidationContext, config: BotDetectorConfig) {
    const checkConfig = config.checkers.enableProxyIspCookiesChecks;
    const reasons: BanReasonCode[] = [];
    let score = 0;

    if (checkConfig.enable === false) return { score, reasons };
    const { penalties } = checkConfig;

    const cookie = ctx.cookie || '';
    const proxy = ctx.proxy.isProxy;
    const hosting = ctx.geoData.hosting || false;
    const isp = ctx.geoData.isp || '';
    const org = ctx.geoData.org || '';
    const as = (ctx.bgp as any).as || ''; 

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

    if (!isp) {
        score += penalties.ispUnknown;
        reasons.push('ISP_UNKNOWN');
    }

    if (!org || !as) {
        score += penalties.orgUnknown;
        reasons.push('ORG_UNKNOWN');
    }

    return { score, reasons };
  }
}

CheckerRegistry.register(new ProxyIspAndCookieChecker());
