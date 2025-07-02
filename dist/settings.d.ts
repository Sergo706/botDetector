/**
 * Global settings for the Bot Detector system.
 * Includes the ban threshold and individual penalty weights.
 */
export interface Settings {
    /**
     * Total ban threshold the system accumaltae before banning.
     */
    banScore: number;
    /**
   * Total ban score the system can assign.
   */
    maxScore: number;
    /**
    * is the system on a proxy server?.
    */
    proxy: boolean;
    /**
   * Total score to restore for the next visitor reqeast.
   */
    restoredReputaionPoints: number;
    /**
     * setNewComputedScore
     * -------------------
     * Controls how the bot-detector and the reputation-healer cooperate.
     *
     * true  ▸ **Live snapshot mode**
     *        – Every request:
     *          1. Bot-detector recalculates a fresh `botScore`
     *          2. Row in **visitors** is overwritten with that score
     *          3. Cache is refreshed with the same value
     *          4. Reputation-healer subtracts `restoredReputationPoints`
     *             (if the visitor isn’t banned) and writes the lower score back
     *             to DB & cache.
     *        – Net effect: score oscillates
     *          `computed → healed → computed → healed …`
     *          Useful when you want the latest risk snapshot visible in the DB
     *          after every page view.
     *
     * false ▸ **Snapshot-then-heal mode**
     *        – First request for this canary:
     *          detector writes the computed score (e.g. 8) to DB & cache.
     *        – Subsequent requests while the cache entry lives:
     *          detector skips the overwrite → healer slowly counts the
     *          score down (`–restoredReputationPoints` per hit) and commits
     *          the lower value.
     *        – When the cache expires (TTL) or the visitor clears cookies,
     *          a fresh snapshot is taken and the cycle restarts.
     *        – Net effect: score only **decreases** until a new snapshot is taken.
     *
     * Example
     * -------
     *   banScore = 10, restoredReputationPoints = 1
     *   R = reqeast
     *   Flag = true
     *   ───────────
     *   R1: detector 8 ➜ DB 8 ➜ healer 7
     *   R2: detector 8 ➜ DB 8 ➜ healer 7
     *
     *   Flag = false
     *   ────────────
     *   R1: detector 8 ➜ DB 8, cache 8
     *   R2: detector (skip) ➜ healer 7 ➜ DB 7, cache 7
     *   R3: detector (skip) ➜ healer 6 ➜ DB 6, cache 6
     *
     * Choose **true** when you always want the latest computed risk stored.
     * Choose **false** when you prefer a single snapshot that only decays until
     * the cache is refreshed.
     */
    setNewComputedScore: boolean;
    /**
    *   If settings.banUnlistedBots is true any bot not listed in suffix.json or botsWithoutSuffix will be banned.
     *   Everything else exact names and any unknown bots when banning is off—hits the IP-range check..
    */
    banUnlistedBots: boolean;
    penalties: {
        ipInvalid: number;
        behaviorTooFast: {
            behaviorPenalty: number;
            behavioural_window: number;
            behavioural_threshold: number;
        };
        headerOptions: {
            weightPerMustHeader: number;
            postManOrInsomiaHeaders: number;
            AJAXHeaderExists: number;
            ommitedAcceptLanguage: number;
            connectionHeaderIsClose: number;
            originHeaderIsNULL: number;
            originHeaderMissmatch: number;
            acceptHeader: {
                ommitedAcceptHeader: number;
                shortAcceptHeader: number;
                acceptIsNULL: number;
            };
            hostMismatchWeight: number;
        };
        pathTraveler: {
            maxIterations: number;
            maxPathLength: number;
            pathLengthToLong: number;
            longDecoding: number;
        };
        bannedCountries: string[];
        headlessBrowser: number;
        shortUserAgent: number;
        cliOrLibrary: number;
        internetExplorer: number;
        kaliLinuxOS: number;
        cookieMissing: number;
        countryUnknown: number;
        proxyDetected: number;
        hostingDetected: number;
        timezoneUnknown: number;
        ispUnknown: number;
        regionUnknown: number;
        latLonUnknown: number;
        orgUnknown: number;
        desktopWithoutOS: number;
        deviceVendorUnknown: number;
        browserTypeUnknown: number;
        browserVersionUnknown: number;
        districtUnknown: number;
        cityUnknown: number;
        browserNameUnknown: number;
        noModel: number;
        localeMismatch: number;
        tzMismatch: number;
        tlsCheckFailed: number;
        metaUaCheckFailed: number;
        badGoodbot: number;
    };
    checksTimeRateControl: {
        checkEveryReqest: boolean;
        checkEvery: number;
    };
    checks: {
        enableIpChecks: boolean;
        enableGoodBotsChecks: boolean;
        enableBehaviorRateCheck: boolean;
        enableProxyIspCookiesChecks: boolean;
        enableUaAndHeaderChecks: boolean;
        enableBrowserAndDeviceChecks: boolean;
        enableGeoChecks: boolean;
        enableLocaleMapsCheck: boolean;
        enableTimeZoneMapper: boolean;
    };
    storage: {
        type: 'sqlite' | 'mysql';
        sqlite: {
            filePath: string;
        };
        mysql: {
            host: string;
            port: number;
            user: string;
            password: string;
            database: string;
        };
    };
    telegram: {
        enabled: boolean;
        botToken: string;
        allowedUserID: string;
        chatId: string;
    };
}
/**
 * Default settings for the detector.
 */
export declare const defaultSettings: Settings;
export declare let settings: Settings;
export declare function botDetectorSettings(newSettings: Partial<Settings>): void;
export declare function mergeDeep<T>(target: T, source: Partial<T>): T;
export declare function addBannedCountries(newCountries: string | string[]): void;
export declare function updateScores(newScore: number): void;
