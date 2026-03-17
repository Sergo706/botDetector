import { BanReasonCode, IBotChecker } from "../types/checkersTypes.js";
import { ValidationContext } from "../types/botDetectorTypes.js";
import { BotDetectorConfig } from "../types/configSchema.js";
import { CheckerRegistry } from "./CheckerRegistry.js";

export class BrowserDetailsAndDeviceChecker implements IBotChecker<BanReasonCode> {
  name = 'Browser and Device Verification';
  phase = 'cheap' as const;

  isEnabled(config: BotDetectorConfig): boolean {
    return config.checkers.enableBrowserAndDeviceChecks.enable;
  }

  async run(ctx: ValidationContext, config: BotDetectorConfig) {
    const checkConfig = config.checkers.enableBrowserAndDeviceChecks;
    const reasons: BanReasonCode[] = [];
    let score = 0;

    if (checkConfig.enable === false) return { score, reasons };
    const penalties = checkConfig.penalties;

    const bType = ctx.parsedUA.browserType;
    const bName = ctx.parsedUA.browser || "";
    const bOS = ctx.parsedUA.os || "";
    const dType = ctx.parsedUA.device || "desktop";

    if (bType === 'cli' || bType === 'library') {
        score += penalties.cliOrLibrary;
        reasons.push('CLI_OR_LIBRARY');
    } 

    if (['ie','iemobile','internet explorer'].includes(bName.toLowerCase())) {
        score += penalties.internetExplorer; 
        reasons.push('INTERNET_EXPLORER');
    }

    if (bOS.toLowerCase().includes('kali')) {
        score += penalties.linuxOs; 
        reasons.push('KALI_LINUX_OS');
    }

    if (bOS === 'Mac OS' && dType === 'mobile') {
        score += 30; 
        reasons.push('IMPOSSIBLE_BROWSER_COMBINATION' as BanReasonCode);
    }

    if (bName === 'Safari' && bOS === 'Windows') {
        score += 30; 
        reasons.push('IMPOSSIBLE_BROWSER_COMBINATION' as BanReasonCode);
    }

    if (dType === 'desktop' && ctx.parsedUA.deviceVendor) {
        score += 20; 
        reasons.push('IMPOSSIBLE_BROWSER_COMBINATION' as BanReasonCode);
    }

    if (!bType && (!bName || dType !== 'desktop')) {
        score += penalties.browserTypeUnknown;
        reasons.push('BROWSER_TYPE_UNKNOWN');
    }

    if (!bName) {
        score += penalties.browserNameUnknown;
        reasons.push('BROWSER_NAME_UNKNOWN');
    }

    if (dType === 'desktop' && !bOS) {
        score += penalties.desktopWithoutOS; 
        reasons.push('DESKTOP_WITHOUT_OS');
    }

    if (dType !== 'desktop' && !ctx.parsedUA.deviceVendor) {
        score += penalties.deviceVendorUnknown;
        reasons.push('DEVICE_VENDOR_UNKNOWN');
    }

    if (!ctx.parsedUA.browserVersion) {
        score += penalties.browserVersionUnknown; 
        reasons.push('BROWSER_VERSION_UNKNOWN');
    }

    if (!ctx.parsedUA.deviceModel) {
        score += penalties.deviceModelUnknown; 
        reasons.push('NO_MODEL');
    }

    return { score, reasons };
  }
}

CheckerRegistry.register(new BrowserDetailsAndDeviceChecker());
