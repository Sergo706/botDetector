export const defaultStore = { main: { driver: 'sqlite' as const, name: './bot_detector.sqlite' } };

export const mainContent = `import './botDetectorConfig.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import { detectBots } from '@riavzon/bot-detector';

const app = express();
app.use(cookieParser());
app.use(detectBots());

app.get('/', (req, res) => {
    res.json({ banned: req.botDetection?.banned });
});

app.listen(3000);
`;

export const content = `import { defineConfiguration } from '@riavzon/bot-detector';

/**
 * Bot Detector configuration — all values shown are the defaults.
 * Tune penalties, enable/disable checkers, and swap adapters as needed.
 *
 * Next steps:
 *   Import this file before mounting the middleware in your app entry point
 *
 * Keep data sources fresh:
 *   npx @riavzon/bot-detector refresh
 */
await defineConfiguration({

    // ─── Database (SQLite default — swap for mysql-pool / postgresql in production)
    store: {
        main: {
            driver: 'sqlite',
            name: './bot_detector.sqlite',
        },
    },

    // ─── Cache (default: in-process memory — uncomment to use a different one)
    // storage: { driver: 'lru', max: 500, ttl: 1000 * 60 * 60 * 2 },
    // storage: { driver: 'redis', url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
    // storage: { driver: 'upstash', url: process.env.UPSTASH_URL, token: process.env.UPSTASH_TOKEN },

    // ─── Core scoring ──────────────────────────────────────────────────────────
    banScore: 100,
    maxScore: 100,
    restoredReputationPoints: 10,
    setNewComputedScore: false,

    // ─── Whitelist (IPv4, IPv6, or CIDR) ───────────────────────────────────────
    whiteList: ['127.0.0.1', '::1'],

    // ─── Re-check interval for returning visitors ──────────────────────────────
    checksTimeRateControl: {
        checkEveryRequest: true,
        checkEvery: 1000 * 60 * 5,
    },

    // ─── Async batch write queue ───────────────────────────────────────────────
    batchQueue: {
        flushIntervalMs: 5000,
        maxBufferSize: 100,
        maxRetries: 3,
    },

    // ─── Logging ───────────────────────────────────────────────────────────────
    logLevel: 'info',

    // ─── Firewall ban (requires sudo ufw) ──────────────────────────────────────
    punishmentType: {
        enableFireWallBan: false,
    },

    // ─── Custom MMDB generation from visitor history ───────────────────────────
    generator: {
        scoreThreshold: 70,
        generateTypes: false,
        deleteAfterBuild: false,
        mmdbctlPath: 'mmdbctl',
    },

    // ─── HTTP header anomaly penalties ─────────────────────────────────────────
    headerOptions: {
        weightPerMustHeader: 20,
        missingBrowserEngine: 30,
        postManOrInsomiaHeaders: 50,
        AJAXHeaderExists: 30,
        connectionHeaderIsClose: 20,
        originHeaderIsNULL: 10,
        originHeaderMismatch: 30,
        omittedAcceptHeader: 30,
        clientHintsMissingForBlink: 30,
        teHeaderUnexpectedForBlink: 10,
        clientHintsUnexpectedForGecko: 30,
        teHeaderMissingForGecko: 20,
        aggressiveCacheControlOnGet: 15,
        crossSiteRequestMissingReferer: 10,
        inconsistentSecFetchMode: 20,
        hostMismatchWeight: 40,
    },

    // ─── Path traversal detection ──────────────────────────────────────────────
    pathTraveler: {
        maxIterations: 3,
        maxPathLength: 1500,
        pathLengthToLong: 100,
        longDecoding: 100,
        traversalDetected: 60,
    },

    // ─── Checkers (set enable: false to disable any individual checker) ─────────
    checkers: {

        localeMapsCheck: {
            enable: true,
            penalties: {
                ipAndHeaderMismatch: 20,
                missingHeader: 20,
                missingGeoData: 20,
                malformedHeader: 30,
            },
        },

        knownBadUserAgents: {
            enable: true,
            penalties: {
                criticalSeverity: 100,
                highSeverity: 80,
                mediumSeverity: 30,
                lowSeverity: 10,
            },
        },

        enableIpChecks: {
            enable: true,
            penalties: 10,
        },

        enableGoodBotsChecks: {
            enable: true,
            banUnlistedBots: true,
            penalties: 100,
        },

        enableBehaviorRateCheck: {
            enable: true,
            behavioral_window: 60_000,
            behavioral_threshold: 30,
            penalties: 60,
        },

        enableProxyIspCookiesChecks: {
            enable: true,
            penalties: {
                cookieMissing: 80,
                proxyDetected: 40,
                multiSourceBonus2to3: 10,
                multiSourceBonus4plus: 20,
                hostingDetected: 50,
                ispUnknown: 10,
                orgUnknown: 10,
            },
        },

        enableUaAndHeaderChecks: {
            enable: true,
            penalties: {
                headlessBrowser: 100,
                shortUserAgent: 80,
                tlsCheckFailed: 60,
                badUaChecker: true,
            },
        },

        enableBrowserAndDeviceChecks: {
            enable: true,
            penalties: {
                cliOrLibrary: 100,
                internetExplorer: 100,
                linuxOs: 10,
                impossibleBrowserCombinations: 30,
                browserTypeUnknown: 10,
                browserNameUnknown: 10,
                desktopWithoutOS: 10,
                deviceVendorUnknown: 10,
                browserVersionUnknown: 10,
                deviceModelUnknown: 5,
            },
        },

        enableGeoChecks: {
            enable: true,
            bannedCountries: [],
            penalties: {
                countryUnknown: 10,
                regionUnknown: 10,
                latLonUnknown: 10,
                districtUnknown: 10,
                cityUnknown: 10,
                timezoneUnknown: 10,
                subregionUnknown: 10,
                phoneUnknown: 10,
                continentUnknown: 10,
            },
        },

        enableKnownThreatsDetections: {
            enable: true,
            penalties: {
                anonymiseNetwork: 20,
                threatLevels: {
                    criticalLevel1: 40,
                    currentAttacksLevel2: 30,
                    threatLevel3: 20,
                    threatLevel4: 10,
                },
            },
        },

        enableAsnClassification: {
            enable: true,
            penalties: {
                contentClassification: 20,
                unknownClassification: 10,
                lowVisibilityPenalty: 10,
                lowVisibilityThreshold: 15,
                comboHostingLowVisibility: 20,
            },
        },

        enableTorAnalysis: {
            enable: true,
            penalties: {
                runningNode: 15,
                exitNode: 20,
                webExitCapable: 15,
                guardNode: 10,
                badExit: 40,
                obsoleteVersion: 10,
            },
        },

        enableTimezoneConsistency: {
            enable: true,
            penalties: 20,
        },

        honeypot: {
            enable: true,
            paths: ['/.env', '/wp-admin', '/wp-login.php', '/.git/config', '/phpinfo.php'],
        },

        enableSessionCoherence: {
            enable: true,
            penalties: {
                pathMismatch: 10,
                missingReferer: 20,
                domainMismatch: 30,
            },
        },

        enableVelocityFingerprint: {
            enable: true,
            cvThreshold: 0.1,
            penalties: 40,
        },

        enableKnownBadIpsCheck: {
            enable: true,
            highRiskPenalty: 30,
        },
    },
});
`;
