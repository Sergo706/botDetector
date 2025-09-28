import { BanReasonCode } from "../types/checkersTypes.js";
import { getConfiguration } from "../config/config.js";



export function calculateBrowserDetailsAndDevice
(
  browserType: string, 
  browserName: string, 
  os: string, 
  deviceType: string,
  deviceVendor: string,
  browserVersion: string,
  deviceModel: string
):{ score: number, reasons: BanReasonCode[] } { 
  const {penalties} = getConfiguration()
const reasons: BanReasonCode[] = [];
let score = 0;

    if (browserType === 'cli' || browserType === 'library') {
        score += penalties.cliOrLibrary;
        reasons.push('CLI_OR_LIBRARY');
    } 

    if (['ie','iemobile','internet explorer'].includes(browserName)) {
        score += penalties.internetExplorer; 
        reasons.push('INTERNET_EXPLORER');
      }

      if (os.toLowerCase().includes('kali')) {
        score += penalties.kaliLinuxOS; 
        reasons.push('KALI_LINUX_OS');
      }

      if (browserType === 'unknown' && deviceType !== 'desktop') {
        score += penalties.browserTypeUnknown;
        reasons.push('BROWSER_TYPE_UNKNOWN');
      }

      if (browserType === 'unknown' && browserName === 'unknown') {
        score += penalties.browserTypeUnknown;
        reasons.push('BROWSER_TYPE_UNKNOWN');
      }

      if (browserName === 'unknown') {
         score += penalties.browserNameUnknown;
         reasons.push('BROWSER_NAME_UNKNOWN');
        }

     if (deviceType === 'desktop' && os === 'unknown') {
          score += penalties.desktopWithoutOS; 
          reasons.push('DESKTOP_WITHOUT_OS');
        }

      if (deviceType !== 'desktop' && deviceVendor === 'unknown') {
          score += penalties.deviceVendorUnknown;
          reasons.push('DEVICE_VENDOR_UNKNOWN');
       }


       if (browserVersion === 'unknown') {
        score += penalties.browserVersionUnknown; 
        reasons.push('BROWSER_VERSION_UNKNOWN');
      }

      if (deviceModel === 'unknown') {
        score += penalties.noModel // Haves some false positive
        reasons.push('NO_MODEL');
      }

return { score, reasons };
}
