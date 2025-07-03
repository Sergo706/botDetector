// src/config/settings.ts

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
    maxScore: number
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
        weightPerMustHeader: number,
        postManOrInsomiaHeaders: number,
        AJAXHeaderExists: number,
        ommitedAcceptLanguage: number,
        connectionHeaderIsClose: number,
        originHeaderIsNULL: number,
        originHeaderMissmatch: number

        acceptHeader: {
          ommitedAcceptHeader: number,
          shortAcceptHeader: number,
          acceptIsNULL: number,
        },
         
      hostMismatchWeight: number;
    };
      pathTraveler: {
        maxIterations: number,
        maxPathLength: number,
        pathLengthToLong: number,
        longDecoding: number,
      },
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
    }
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
}
  
  /**
   * Default settings for the detector.
   */
  export const defaultSettings: Settings = {
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
        behavioural_window: 60_000, //ms
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
export let settings: Settings = { ...defaultSettings };


export function botDetectorSettings(newSettings: Partial<Settings>) {
  settings = mergeDeep(settings, newSettings);
}


function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item);
}


export function mergeDeep<T>(target: T, source: Partial<T>): T {
  const output = { ...target } as any;
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      const sourceVal = (source as any)[key];
      const targetVal = (target as any)[key];
      if (isObject(sourceVal) && isObject(targetVal)) {
        output[key] = mergeDeep(targetVal, sourceVal);
      } else {
        output[key] = sourceVal;
      }
    });
  }
  return output;
}

export function addBannedCountries(newCountries: string | string[]) {
  if (!Array.isArray(newCountries)) {
    newCountries = [newCountries];
  }
 
  settings.penalties.bannedCountries = [
    ...settings.penalties.bannedCountries,
    ...newCountries,
  ];
}

export function updateScores(newScore: number) { 
 for (const [penaltyName, penaltyValue] of Object.entries(settings.penalties)) {
  penaltyName: newScore;

 }
}
