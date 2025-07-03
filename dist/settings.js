// src/config/settings.ts
/**
 * Default settings for the detector.
 */
export const defaultSettings = {
    banScore: 10,
    maxScore: 30,
    proxy: true,
    restoredReputaionPoints: 1,
    setNewComputedScore: false,
    banUnlistedBots: true,
    checksTimeRateControl: {
        checkEveryReqest: true,
        checkEvery: 1000 * 60 * 5, // time in miliseconds for the cookie cache 1hr
    },
    penalties: {
        ipInvalid: 10,
        behaviorTooFast: {
            behaviorPenalty: 8,
            behavioural_window: 60000, //ms
            behavioural_threshold: 30 //hits
        },
        headerOptions: {
            weightPerMustHeader: 2,
            postManOrInsomiaHeaders: 8,
            AJAXHeaderExists: 3,
            ommitedAcceptLanguage: 3,
            connectionHeaderIsClose: 2,
            originHeaderIsNULL: 2,
            originHeaderMissmatch: 3,
            acceptHeader: {
                ommitedAcceptHeader: 3,
                shortAcceptHeader: 4,
                acceptIsNULL: 3,
            },
            hostMismatchWeight: 4,
        },
        pathTraveler: {
            maxIterations: 3,
            maxPathLength: 2048,
            pathLengthToLong: 10,
            longDecoding: 10,
        },
        bannedCountries: [
            "bangladesh",
            "algeria",
            "bahrain",
            "belarus",
            "ukraine",
            "russia",
            "china",
            "india",
            "pakistan",
            "vietnam",
            "chad",
            "brazil",
            "nigeria",
            "iran",
            "germany",
        ],
        headlessBrowser: 10,
        shortUserAgent: 8,
        cliOrLibrary: 10,
        internetExplorer: 10,
        kaliLinuxOS: 4,
        cookieMissing: 8,
        countryUnknown: 2,
        proxyDetected: 4,
        hostingDetected: 4,
        timezoneUnknown: 1,
        ispUnknown: 1,
        regionUnknown: 1,
        latLonUnknown: 1,
        orgUnknown: 1,
        desktopWithoutOS: 1,
        deviceVendorUnknown: 1,
        browserTypeUnknown: 1,
        browserVersionUnknown: 1,
        districtUnknown: 0.5,
        cityUnknown: 0.5,
        browserNameUnknown: 1,
        noModel: 0.5,
        localeMismatch: 4,
        tzMismatch: 3,
        tlsCheckFailed: 6,
        metaUaCheckFailed: 0,
        badGoodbot: 10,
    },
    checks: {
        enableIpChecks: true,
        enableGoodBotsChecks: true,
        enableBehaviorRateCheck: true,
        enableProxyIspCookiesChecks: true,
        enableUaAndHeaderChecks: true,
        enableBrowserAndDeviceChecks: true,
        enableGeoChecks: true,
        enableLocaleMapsCheck: true,
        enableTimeZoneMapper: true
    },
};
export let settings = { ...defaultSettings };
export function botDetectorSettings(newSettings) {
    settings = mergeDeep(settings, newSettings);
}
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}
export function mergeDeep(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            const sourceVal = source[key];
            const targetVal = target[key];
            if (isObject(sourceVal) && isObject(targetVal)) {
                output[key] = mergeDeep(targetVal, sourceVal);
            }
            else {
                output[key] = sourceVal;
            }
        });
    }
    return output;
}
export function addBannedCountries(newCountries) {
    if (!Array.isArray(newCountries)) {
        newCountries = [newCountries];
    }
    settings.penalties.bannedCountries = [
        ...settings.penalties.bannedCountries,
        ...newCountries,
    ];
}
export function updateScores(newScore) {
    for (const [penaltyName, penaltyValue] of Object.entries(settings.penalties)) {
        penaltyName: newScore;
    }
}
