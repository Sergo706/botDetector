import z from "zod";
import type { CacheConfig } from "./storageTypes.js";
import { DbConfig } from "./dbTypes.js";



const dbConfigStorage = z.custom<DbConfig>(
  (val: unknown): val is DbConfig => {
    if (typeof val !== 'object' || val === null) {
      return false;
    }
    const obj = val as DbConfig;
    return typeof obj.driver === 'string';
  },
  { message: 'Database config must be an object with a valid "driver" string' }
);

const store = z.object({
  main: dbConfigStorage,
}).required().strict();

const cache = z.custom<CacheConfig>(
  (val: unknown): val is CacheConfig => {
    if (typeof val !== 'object' || val === null) {
      return false;
    }
    const obj = val as CacheConfig;
    return typeof obj.driver === 'string';
  },
  { message: 'Storage must be an object with a valid "driver" string' }
);

export const configSchema = z.object({
    store,
        /**
           * Total ban threshold the system accumaltae before banning.
           */
        banScore: z.number().max(100).min(0).default(100),
            /**
           * Total ban score the system can assign.
           */
        maxScore: z.number().max(100).min(0).default(100),
            /**
           * Total score to restore for the next visitor request.
           */
        restoredReputationPoints:  z.number().default(10),
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
        setNewComputedScore: z.boolean().default(false),
        whiteList: z.array(z.union([z.ipv4(), z.ipv6(), z.string()])).optional().default([]),
        checksTimeRateControl: z.object({
              checkEveryRequest: z.boolean().default(true),
              checkEvery: z.number().default(1000 * 60 * 5),
        }).prefault({}),

        batchQueue: z.object({
            flushIntervalMs: z.number().default(5000),
            maxBufferSize: z.number().default(100),
            maxRetries: z.number().default(3),
        }).prefault({}),

        storage: cache.optional(),
        
        checkers: z.object({
            localeMapsCheck: z.discriminatedUnion('enable', [
                z.object({
                    enable: z.literal(false)
                }),

                z.object({
                    enable: z.literal(true),
                    penalties: z.object({
                        ipAndHeaderMismatch: z.number().default(20),
                        missingHeader:  z.number().default(20),
                        missingGeoData:  z.number().default(20),
                        malformedHeader: z.number().default(30)
                    }).prefault({}),
                })
            ]).prefault({enable: true}),

            knownBadUserAgents: z.discriminatedUnion('enable', [
                z.object({
                    enable: z.literal(false)
                }),
                z.object({
                    enable: z.literal(true),
                    penalties: z.object({
                        criticalSeverity: z.number().default(100),
                        highSeverity: z.number().default(80),
                        mediumSeverity: z.number().default(30),
                        lowSeverity: z.number().default(10),
                    }).prefault({})
                })
            ]).prefault({enable: true}),
            
            enableIpChecks: z.discriminatedUnion('enable', [
                z.object({
                    enable: z.literal(false)
                }),
                z.object({
                    enable: z.literal(true),
                    penalties: z.number().default(10)
                })
            ]).prefault({enable: true}),

            enableGoodBotsChecks: z.discriminatedUnion('enable', [
                z.object({
                    enable: z.literal(false)
                }), 

                z.object({
                    enable: z.literal(true),
            /**
           *   If settings.banUnlistedBots is true any bot not listed in suffix.json or botsWithoutSuffix will be banned.
            *   Everything else exact names and any unknown bots when banning is off—hits the IP-range check..
           */
                    banUnlistedBots: z.boolean().default(true),
                    penalties: z.number().default(100)
                })

            ]).prefault({enable: true}),

            enableBehaviorRateCheck: z.discriminatedUnion('enable', [
                z.object({
                    enable: z.literal(false)
                }),

                z.object({
                    enable: z.literal(true),
                    behavioral_window: z.number().default(60_000),
                    behavioral_threshold: z.number().default(30),
                    penalties: z.number().default(60)
                })                                
            ]).prefault({enable: true}),

            enableProxyIspCookiesChecks: z.discriminatedUnion('enable', [
                z.object({
                    enable: z.literal(false)
                }),
                
                z.object({
                    enable: z.literal(true),
                    penalties: z.object({
                        cookieMissing: z.number().default(80),
                        proxyDetected: z.number().default(40),
                        multiSourceBonus2to3: z.number().default(10),
                        multiSourceBonus4plus: z.number().default(20),
                        hostingDetected: z.number().default(50),
                        ispUnknown: z.number().default(10),
                        orgUnknown: z.number().default(10),
                    }).prefault({}),
                }),
            ]).prefault({enable: true}),

            enableUaAndHeaderChecks: z.discriminatedUnion('enable', [
                z.object({
                    enable: z.literal(false)
                }),
                z.object({
                    enable: z.literal(true),
                    penalties: z.object({
                        headlessBrowser: z.number().default(100),
                        shortUserAgent: z.number().default(80),
                        tlsCheckFailed: z.number().default(60),
                        badUaChecker: z.boolean().default(true)    

                    }).prefault({}),
                })
            ]).prefault({enable: true}),

            enableBrowserAndDeviceChecks: z.discriminatedUnion('enable', [
                z.object({
                    enable: z.literal(false)
                }),

                z.object({
                    enable: z.literal(true),
                    penalties: z.object({        
                        cliOrLibrary: z.number().default(100),
                        internetExplorer: z.number().default(100),
                        linuxOs: z.number().default(10),
                        impossibleBrowserCombinations: z.number().default(30),
                        browserTypeUnknown: z.number().default(10),
                        browserNameUnknown: z.number().default(10),
                        desktopWithoutOS: z.number().default(10),
                        deviceVendorUnknown: z.number().default(10),
                        browserVersionUnknown: z.number().default(10),
                        deviceModelUnknown: z.number().default(5),
                    }).prefault({}),
                })
                
            ]).prefault({enable: true}),

            enableGeoChecks: z.discriminatedUnion('enable', [
                z.object({
                    enable: z.literal(false)
                }),
              z.object({
                    enable: z.literal(true),
                    bannedCountries: z.array(z.string()).optional().default([]),
                    penalties: z.object({   
                        countryUnknown: z.number().default(10),
                        regionUnknown: z.number().default(10),
                        latLonUnknown: z.number().default(10),
                        districtUnknown: z.number().default(10),
                        cityUnknown: z.number().default(10),
                        timezoneUnknown: z.number().default(10),
                        subregionUnknown: z.number().default(10),
                        phoneUnknown: z.number().default(10),
                        continentUnknown: z.number().default(10),
                    }).prefault({}),
                }),
            ]).prefault({enable: true}),

            enableKnownThreatsDetections: z.discriminatedUnion('enable', [
                z.object({
                    enable: z.literal(false)
                }),

                z.object({
                    enable: z.literal(true),
                    penalties: z.object({
                        anonymiseNetwork: z.number().default(20),
                        threatLevels: z.object({
                            criticalLevel1: z.number().default(40),
                            currentAttacksLevel2: z.number().default(30),
                            threatLevel3: z.number().default(20),
                            threatLevel4: z.number().default(10),
                        }).prefault({}),
                    }).prefault({})
                }),
            ]).prefault({enable: true}),

            enableAsnClassification: z.discriminatedUnion('enable', [
                z.object({ enable: z.literal(false) }),
                z.object({
                    enable: z.literal(true),
                    penalties: z.object({
                        contentClassification: z.number().default(20),
                        unknownClassification: z.number().default(10),
                        lowVisibilityPenalty: z.number().default(10),
                        lowVisibilityThreshold: z.number().default(15),
                        comboHostingLowVisibility: z.number().default(20),
                    }).prefault({}),
                }),
            ]).prefault({ enable: true }),

            enableTorAnalysis: z.discriminatedUnion('enable', [
                z.object({ enable: z.literal(false) }),
                z.object({
                    enable: z.literal(true),
                    penalties: z.object({
                        runningNode: z.number().default(15),
                        exitNode: z.number().default(20),
                        webExitCapable: z.number().default(15),
                        guardNode: z.number().default(10),
                        badExit: z.number().default(40),
                        obsoleteVersion: z.number().default(10),
                    }).prefault({}),
                }),
            ]).prefault({ enable: true }),

            enableTimezoneConsistency: z.discriminatedUnion('enable', [
                z.object({ enable: z.literal(false) }),
                z.object({
                    enable: z.literal(true),
                    penalties: z.number().default(20),
                }),
            ]).prefault({ enable: true }),

            honeypot: z.discriminatedUnion('enable', [
                z.object({ enable: z.literal(false) }),
                z.object({
                    enable: z.literal(true),
                    paths: z.array(z.string()).default([]),
                }),
            ]).prefault({ enable: true }),

            enableSessionCoherence: z.discriminatedUnion('enable', [
                z.object({ enable: z.literal(false) }),
                z.object({
                    enable: z.literal(true),
                    penalties: z.object({
                        pathMismatch: z.number().default(10),
                        missingReferer: z.number().default(20),
                        domainMismatch: z.number().default(30),
                    }).prefault({}),
                }),
            ]).prefault({ enable: true }),

            enableVelocityFingerprint: z.discriminatedUnion('enable', [
                z.object({ enable: z.literal(false) }),
                z.object({
                    enable: z.literal(true),
                    cvThreshold: z.number().default(0.1),
                    penalties: z.number().default(40),
                }),
            ]).prefault({ enable: true }),

            enableKnownBadIpsCheck: z.discriminatedUnion('enable', [
                z.object({ enable: z.literal(false) }),
                z.object({
                    enable: z.literal(true),
                    highRiskPenalty: z.number().default(30),
                }),
            ]).prefault({ enable: true }),
        }).prefault({}),

        generator: z.object({
            scoreThreshold: z.number().default(70),
            generateTypes: z.boolean().default(false),
            deleteAfterBuild: z.boolean().default(false),
            mmdbctlPath: z.string().default('mmdbctl')
        }).prefault({}),

        headerOptions: z.object({
                weightPerMustHeader: z.number().default(20),
                missingBrowserEngine: z.number().default(30),
                postManOrInsomiaHeaders: z.number().default(50),
                AJAXHeaderExists: z.number().default(30),
                connectionHeaderIsClose: z.number().default(20),
                originHeaderIsNULL: z.number().default(10),
                originHeaderMismatch: z.number().default(30),
                omittedAcceptHeader: z.number().default(30),

                clientHintsMissingForBlink: z.number().default(30),
                teHeaderUnexpectedForBlink: z.number().default(10),
                clientHintsUnexpectedForGecko: z.number().default(30),
                teHeaderMissingForGecko: z.number().default(20),
                
                aggressiveCacheControlOnGet: z.number().default(15),
                crossSiteRequestMissingReferer: z.number().default(10),
                inconsistentSecFetchMode: z.number().default(20),

              hostMismatchWeight: z.number().default(40),
            }).prefault({}),

            pathTraveler: z.object({
                maxIterations: z.number().default(3),
                maxPathLength: z.number().default(1500),
                pathLengthToLong: z.number().default(100),
                longDecoding: z.number().default(100),
                traversalDetected: z.number().default(60),
            }).prefault({}),

        
            punishmentType: z.object({
                enableFireWallBan: z.boolean().default(false),
            }).prefault({}),
            
           logLevel: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

export type BotDetectorConfig = z.infer<typeof configSchema>;
export type BotDetectorConfigInput = z.input<typeof configSchema>;