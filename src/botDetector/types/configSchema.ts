import z from "zod"
import type { Pool as PromisePool } from 'mysql2/promise'


let mainPool: PromisePool;
const store = z.strictObject({
 main: z.custom<PromisePool>(
    (val): val is typeof mainPool =>
      typeof val === 'object' &&
      val !== null &&
      typeof (val as PromisePool).getConnection === 'function',
    { message: 'Expected a mysql2/promise Pool (must have getConnection())' }
  ),

}).required().strict();

const storeAndTelegram =  z.object({

  store,
   telegram: z.discriminatedUnion("enableTelegramLogger", [
      z.object({
      enableTelegramLogger: z.literal(false),
      token: z.string().optional(),
      chatId: z.string().optional(),
      allowedUser: z.string().optional()
   }),
   z.object({
      enableTelegramLogger: z.literal(true),
      token: z.string(),
      chatId: z.string(),
      allowedUser: z.string()
   }),
]),
})


export const configurationSchema = z.object({
    storeAndTelegram,
    /**
       * Total ban threshold the system accumaltae before banning.
       */
    banScore: z.number().max(30).min(0),
        /**
       * Total ban score the system can assign.
       */
    maxScore: z.number().max(30).min(0),
           /**
       * is the system on a proxy server?.
       */
    proxy: z.boolean(),
        /**
       * Total score to restore for the next visitor request.
       */
    restoredReputaionPoints:  z.number(),
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

    setNewComputedScore: z.boolean(),
           /**
       *   If settings.banUnlistedBots is true any bot not listed in suffix.json or botsWithoutSuffix will be banned.
        *   Everything else exact names and any unknown bots when banning is off—hits the IP-range check..
       */
    banUnlistedBots: z.boolean(),
    whiteList: z.array(z.ipv4()).optional(),
    penalties: z.object({
      ipInvalid: z.number(),

      behaviorTooFast: z.object({
        behaviorPenalty: z.number(),
        behavioural_window: z.number(),
        behavioural_threshold: z.number(),
      }),

    headerOptions: z.object({
        weightPerMustHeader: z.number(),
        postManOrInsomiaHeaders: z.number(),
        AJAXHeaderExists: z.number(),
        ommitedAcceptLanguage: z.number(),
        connectionHeaderIsClose: z.number(),
        originHeaderIsNULL: z.number(),
        originHeaderMissmatch: z.number(),

        acceptHeader: z.object({
          ommitedAcceptHeader: z.number(),
          shortAcceptHeader: z.number(),
          acceptIsNULL: z.number(),
        }),
         
      hostMismatchWeight: z.number(),
    }),
    pathTraveler: z.object({
        maxIterations: z.number(),
        maxPathLength: z.number(),
        pathLengthToLong: z.number(),
        longDecoding: z.number(),
      }),
      bannedCountries: z.array(z.string()),
      headlessBrowser: z.number(),
      shortUserAgent: z.number(),
      cliOrLibrary: z.number(),
      internetExplorer: z.number(),
      kaliLinuxOS: z.number(),
      cookieMissing: z.number(),
      countryUnknown: z.number(),
      proxyDetected: z.number(),
      hostingDetected: z.number(),
      timezoneUnknown: z.number(),
      ispUnknown: z.number(),
      regionUnknown: z.number(),
      latLonUnknown: z.number(),
      orgUnknown: z.number(),
      desktopWithoutOS: z.number(),
      deviceVendorUnknown: z.number(),
      browserTypeUnknown: z.number(),
      browserVersionUnknown: z.number(),
      districtUnknown: z.number(),
      cityUnknown: z.number(),
      browserNameUnknown: z.number(),
      noModel: z.number(),
      localeMismatch: z.number(),
      tzMismatch: z.number(),
      tlsCheckFailed: z.number(),
      metaUaCheckFailed: z.number(),
      badGoodbot: z.number(),
  }),

    checksTimeRateControl: z.object({
      checkEveryReqest: z.boolean(),
      checkEvery: z.number(),
    }),
    checks: z.object({
      enableIpChecks: z.boolean(),
      enableGoodBotsChecks: z.boolean(),
      enableBehaviorRateCheck: z.boolean(),
      enableProxyIspCookiesChecks: z.boolean(),
      enableUaAndHeaderChecks: z.boolean(),
      enableBrowserAndDeviceChecks: z.boolean(),
      enableGeoChecks: z.boolean(),
      enableLocaleMapsCheck: z.boolean(),
      enableTimeZoneMapper: z.boolean()
    }),

    punishmentType: z.object({
        enableFireWallBan: z.boolean(),
    }),
   logLevel: z.enum(['debug', 'info', 'warn', 'error', 'fatal']),
})

export type BotDetectorConfig = z.infer<typeof configurationSchema>;
