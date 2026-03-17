import { BotDetectorConfig } from './configSchema.js';
import { ValidationContext } from './botDetectorTypes.js';


export type BanReasonCode =
  | 'IP_INVALID'
  | 'BEHAVIOR_TOO_FAST'
  | 'GOOD_BOT_IDENTIFIED'
  | 'BAD_GOOGLEBOT'
  | 'SHORT_USER_AGENT'
  | 'CLI_OR_LIBRARY'
  | 'KALI_LINUX_OS'
  | 'INTERNET_EXPLORER'
  | 'COOKIE_MISSING'
  | 'BANNED_COUNTRY'
  | 'COUNTRY_UNKNOWN'
  | 'PROXY_DETECTED'
  | 'HOSTING_DETECTED'
  | 'TIMEZONE_UNKNOWN'
  | 'ISP_UNKNOWN'
  | 'REGION_UNKNOWN'
  | 'LAT_LON_UNKNOWN'
  | 'ORG_UNKNOWN'
  | 'DEVICE_TYPE_UNKNOWN'
  | 'DEVICE_VENDOR_UNKNOWN'
  | 'BROWSER_TYPE_UNKNOWN'
  | 'BROWSER_VERSION_UNKNOWN'
  | 'DISTRICT_UNKNOWN'
  | 'CITY_UNKNOWN'
  | 'OS_UNKNOWN'
  | 'BROWSER_NAME_UNKNOWN'
  | 'HEADLESS_BROWSER_DETECTED'
  | 'LOCALE_MISMATCH'
  | 'TZ_MISMATCH'
  | 'TLS_CHECK_FAILED'
  | 'HEADER_SCORE_TOO_HIGH'
  | 'META_UA_CHECK_FAILED'
  | 'DESKTOP_WITHOUT_OS'
  | 'NO_MODEL'
  | 'XSS SCRIPTING ATTEMPT'
  | 'PATH_TRAVELER_FOUND'
  | 'BAD_UA_DETECTED'
  | 'BAD_BOT_DETECTED';


export interface BannedInfo {
  score: number;
  reasons: BanReasonCode[];
}


export interface IBotChecker<Code> {
  name: string;
  phase: 'cheap' | 'heavy'; 
  isEnabled(config: BotDetectorConfig): boolean; 
  run(ctx: ValidationContext, config: BotDetectorConfig): Promise<{ score: number; reasons: Code[] | BanReasonCode[]}> | { score: number; reasons: Code[] | BanReasonCode[] };
}
