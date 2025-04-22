// src/config/settings.ts

/**
 * Global settings for the Bot Detector system.
 * Includes the ban threshold and individual penalty weights.
 */
export interface Settings {

    banScore: number;
    maxScore: number

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
  export const defaultSettings: Settings = {
    banScore: 10,
    maxScore: 30,
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
          ommitedAcceptHeader: 3, // */*
          shortAcceptHeader: 4, // < 10
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
      metaUaCheckFailed: 0,  // meta-UA internal
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


    storage: {
        type: 'sqlite',
        sqlite: {
          filePath: './botdetector.sqlite',
        },
        mysql: {
          host: 'localhost',
          port: 3306,
          user: 'username',
          password: 'password',
          database: 'botdetector',
        },
      },
    
      telegram: {
        enabled: true,
        botToken: 'string',
        allowedUserID: 'string',
        chatId: 'string',
      },
  };
export let settings: Settings = { ...defaultSettings };


export function botDetectorSettings(newSettings: Partial<Settings>) {
  settings = { ...settings, ...newSettings };
}