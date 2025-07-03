export interface BannedReason {
    isIPValid: boolean;
    behavierScore: string;
    isGoodBot: boolean;
    isLegitGoogleBot: boolean;
    shortUserAgent: boolean;
    isCliOrLibary: boolean;
    isKaliLinux: boolean;
    isInternetExplorer: boolean;
    isCookieDosntExistsAfterSended: boolean;
    isBannedCountry: boolean;
    isCountryUnknown: boolean;
    isProxy: boolean;
    isHosting: boolean;
    isTimeZoneUnknown: boolean;
    isISPUnknown: boolean;
    isRegionOrRegionNameUnknown: boolean;
    isLatAndLotUnknown: boolean;
    isISPOrgUnknown: boolean;
    isDeviceTypeUnknown: boolean;
    isDeviceVendorUnknown: boolean;
    isBrowserTypeUnknown: boolean;
    isBrowserVersionUnknown: boolean;
    isDistrictUnknown: boolean;
    isCityUnknown: boolean;
    isOSUnknown: boolean;
    isBrowserNameUnknown: boolean;
    isHeadlessBrowser: boolean;
    isLangsDontMatchCountry: boolean;
    isTzDontMatchCountry: boolean;
    isTLSCheckFail: boolean;
    isHeaderCheckGreaterThen4: boolean;
    isMetaUAcheckFail: boolean;
}
export type BanReasonCode = 'IP_INVALID' | 'BEHAVIOR_TOO_FAST' | 'GOOD_BOT_IDENTIFIED' | 'BAD_GOOGLEBOT' | 'SHORT_USER_AGENT' | 'CLI_OR_LIBRARY' | 'KALI_LINUX_OS' | 'INTERNET_EXPLORER' | 'COOKIE_MISSING' | 'BANNED_COUNTRY' | 'COUNTRY_UNKNOWN' | 'PROXY_DETECTED' | 'HOSTING_DETECTED' | 'TIMEZONE_UNKNOWN' | 'ISP_UNKNOWN' | 'REGION_UNKNOWN' | 'LAT_LON_UNKNOWN' | 'ORG_UNKNOWN' | 'DEVICE_TYPE_UNKNOWN' | 'DEVICE_VENDOR_UNKNOWN' | 'BROWSER_TYPE_UNKNOWN' | 'BROWSER_VERSION_UNKNOWN' | 'DISTRICT_UNKNOWN' | 'CITY_UNKNOWN' | 'OS_UNKNOWN' | 'BROWSER_NAME_UNKNOWN' | 'HEADLESS_BROWSER_DETECTED' | 'LOCALE_MISMATCH' | 'TZ_MISMATCH' | 'TLS_CHECK_FAILED' | 'HEADER_SCORE_TOO_HIGH' | 'META_UA_CHECK_FAILED' | 'DESKTOP_WITHOUT_OS' | 'NO_MODEL' | 'XSS SCRIPTING ATTEMPT' | 'PATH_TRAVELAR_FOUND';
/**
 * Summary of the bot detection outcome: overall score plus detailed reasons.
 */
export interface BannedInfo {
    /**
     * Final computed bot score (0–30).
     */
    score: number;
    /**
     * List of codes explaining which checks contributed to the score.
     */
    reasons: BanReasonCode[];
}
