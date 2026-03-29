# bot-detector

![Coverage](./badges/coverage.svg)

`@riavzon/bot-detector` is an express middleware that checks incoming requests through a two phase pipeline of 17 checkers across ip reputation, geolocation, tls fingerprinting, behavioral rate limiting, Tor analysis and more.

Each checker contributes a penalty score toward a configurable ban threshold. Requests that cross the threshold receive a `403` response, or are banned at the firewall level if configured.

`@riavzon/bot-detector` uses [Shield-Base](https://github.com/Sergo706/shield-base-cli) to fetch and compile its data sources into fast in memory databases. Checkers query these compiled databases synchronously, which allows the whole pipeline to make a decisions in milliseconds.


## Features
- Comes with 17 fully configurable server checkers
- Extensible, you can easily provide your own custom checkers via `CheckerRegistry` and custom data sources.
- Self optimized, uses collected visitor data to become smarter and faster over time. Instead of running the full pipeline for known offenders, it compiles your latest database rows into local mmdb files to instantly drop past threats and high risk visitors.
- Fast, around 1.2ms median latency for the full pipeline.
- Supports multiple storages and databases sql-lite/pg/mysql /redis/lru/memory
- Comes with a cli to manage data sources and generate custom threat databases.
- Supports cjs and fully typed

## Requirements

- Node.js 18 or later
- Express 5
- A supported database for visitor persistence

## Quick setup

The fastest way to get started is with the create package. Run this in the root
of your Express project:

```bash
npx @riavzon/bot-detector-create
```

This single command installs all dependencies, downloads and compiles every
threat intelligence feed, writes a fully annotated `botDetectorConfig.ts` with
all 17 checkers at their defaults, a `mainBotDetector.ts` ready-to-run Express
entry point, and creates the database tables, all without any manual steps. See the
[@riavzon/bot-detector-create](https://www.npmjs.com/package/@riavzon/bot-detector-create)
package for details.

It defaults to [better-sqlite3](http://github.com/WiseLibs/better-sqlite3) as the database driver.

## Manual installation

If you prefer to wire things up yourself:

```bash
npm install @riavzon/bot-detector express cookie-parser <data-base-driver>
```

After installation, run `bot-detector init` to download its data sources and validate that [mmdbctl](https://github.com/ipinfo/mmdbctl) is installed, if not it prompts you about it, and installs it automatically, it also ask you to provide an user agent that will be used to fetch [BGP](https://en.wikipedia.org/wiki/Border_Gateway_Protocol) data from bgp.tools as they requires it before they allow you to use their data, more info at [BGP.tools](https://bgp.tools/kb/api).

To skip the interactive setup you can download the [mmdbctl](https://github.com/ipinfo/mmdbctl) dependency directly and provide the contact user agent with a flag: 

```bash
npx @riavzon/bot-detector init

# OR

npx @riavzon/bot-detector init --contact=App - contact@example.com

```

The compiled databases are written to `_data-sources/` inside the package directory, which include the following files:

```fs 
├── asn.mmdb 
├── banned.mmdb // generated on demand from your visitors history data
├── city.mmdb 
├── country.mmdb
├── firehol_anonymous.mmdb
├── firehol_l1.mmdb
├── firehol_l2.mmdb
├── firehol_l3.mmdb
├── firehol_l4.mmdb
├── goodBots.mmdb
├── highRisk.mmdb // generated on demand from your visitors history data
├── ja4-db
│   ├── ja4.mdb
│   └── ja4.mdb-lock
├── proxy.mmdb
├── suffix.json
├── tor.mmdb
└── useragent-db
    ├── useragent.mdb
    └── useragent.mdb-lock

```
More information about each database and its source can be found in [Shield-Base](https://github.com/Sergo706/shield-base-cli) readme.

These databases are read only, your can interact with them with `getDataSources`, for example:

```ts
import { getDataSources } from '@riavzon/bot-detector';

const ds = getDataSources();

// ip lookups — all return null if the ip is not in the database
ds.asnDataBase(ip);         // BGP/ASN record: asn_id, asn_name, classification, hits
ds.cityDataBase(ip);        // city-level geo: city, region, country, lat/lon, timezone 
ds.countryDataBase(ip);     // country-level geo: country, countryCode, isp, org, proxy, hosting
ds.torDataBase(ip);         // Tor relay record: flags, exit_addresses, version, probabilities
ds.proxyDataBase(ip);       // proxy record: type, sources that flagged this ip
ds.goodBotsDataBase(ip);    // known good crawler record (Googlebot, Bingbot, etc.)
ds.fireholAnonDataBase(ip); // Firehol anonymous feed match
ds.fireholLvl1DataBase(ip); // Firehol threat level 1 (most severe)
ds.fireholLvl2DataBase(ip); // Firehol threat level 2
ds.fireholLvl3DataBase(ip); // Firehol threat level 3
ds.fireholLvl4DataBase(ip); // Firehol threat level 4
ds.bannedDataBase(ip);      // your banned.mmdb, generated by `bot-detector generate`
ds.highRiskDataBase(ip);    // your highRisk.mmdb, generated by `bot-detector generate`

// LMDB key value stores
ds.getUserAgentLmdb().get(uaString); // user agent pattern record
ds.getJa4Lmdb().get(ja4Hash); // JA4 TLS fingerprint record
```

## Quick start

`defineConfiguration` is async and must resolve before you attach `detectBots` to your routes. Call it exactly once at startup before `app.listen`.

```ts
import express from 'express';
import cookieParser from 'cookie-parser';
import { defineConfiguration, detectBots } from '@riavzon/bot-detector';

const app = express();
app.use(cookieParser());

await defineConfiguration({
  store: {
    main: { driver: 'mysql-pool', host: 'localhost', user: 'root', database: 'mydb' },
  },
});

app.use(detectBots());

app.get('/', (req, res) => {
  res.json({ banned: req.botDetection?.banned });
});
```

Once your app has a `defineConfiguration` call wired up, run `load-schema` to create the database tables:

```bash
npx @riavzon/bot-detector load-schema
```


## Configuration

`defineConfiguration` accepts a configuration object. Every field has a default value, only `store.main` is required. The full schema with all defaults is defined in [`src/botDetector/types/configSchema.ts`](src/botDetector/types/configSchema.ts).

```ts
await defineConfiguration({
  // Required: database connection for visitor persistence
  store: {
    main: { driver: 'mysql-pool', host: 'localhost', user: 'root', database: 'mydb' },
  },

  // Score required to ban a visitor (0–100). Default: 100
  banScore: 100,

  // Maximum score assignable per request (0–100). Default: 100
  maxScore: 100,

  // Points the reputation healer restores per clean request. Default: 10
  restoredReputationPoints: 10,

  // Score persistence strategy. See "Score modes" below. Default: false
  setNewComputedScore: false,

  // IPs that bypass all detection. Accepts IPv4, IPv6, or CIDR strings.
  whiteList: ['127.0.0.1', '::1'],

  // Recheck interval for returning visitors. Default: check every request
  checksTimeRateControl: {
    checkEveryRequest: false,
    checkEvery: 1000 * 60 * 5, // ms
  },

  // Async write queue that persists visitor scores without blocking requests
  batchQueue: {
    flushIntervalMs: 5000,
    maxBufferSize: 100,
    maxRetries: 3,
  },

  // Cache driver for visitor state, behavioral data, and sessions.
  // Defaults to memory when omitted.
  storage: { driver: 'redis', host: 'localhost', port: 6379 },

  // Whether to issue a UFW firewall ban in addition to a 403 response. Default: false
  punishmentType: {
    enableFireWallBan: false,
  },

  // Pino log level. Default: 'info'
  logLevel: 'info',

  // Individual checker configuration. All checkers are enabled by default.
  // See "Checker reference" for available penalty options per checker.
  checkers: {
    enableBehaviorRateCheck: {
      enable: true,
      behavioral_window: 60_000, // window duration in ms
      behavioral_threshold: 30,  // max requests per window before penalty applies
      penalties: 60,
    },
    honeypot: {
      enable: true,
      paths: ['/admin', '/.env', '/wp-login.php'],
    },
    enableGeoChecks: {
      enable: true,
      bannedCountries: ['KP', 'IR'], // ISO 3166-1 alpha-2 codes
    },
    // ...other checkers
  },

  // Controls custom MMDB generation from your visitor data. See `bot-detector generate`.
  generator: {
    scoreThreshold: 70,      // minimum suspicious_activity_score to include in highRisk.mmdb
    generateTypes: false,   // generate typescript types
    deleteAfterBuild: false, // delete source rows after compiling
    mmdbctlPath: 'mmdbctl', // path to mmdbctl binary
  },
});

```

### Score modes

`setNewComputedScore` controls how the bot score is written to the database on each request.

**`false` (default) snapshot then heal.**: The detector writes the computed score once on the visitor's first request. The reputation healer then decrements it on each subsequent clean visit. The score only decreases until the cache expires and a new snapshot is taken.

**`true` live snapshot.**: The detector overwrites the stored score on every request, then the healer immediately decrements it. Use this when you want the database to always reflect the latest computed risk.

## Database drivers

The `store.main` field accepts the following drivers:

| Driver | Value | Notes |
|---|---|---|
| MySQL (pool) | `mysql-pool` | Peer dependency: `mysql2 >=3` |
| PostgreSQL | `postgresql` | Requires `pg` |
| SQLite | `sqlite` | Requires `better-sqlite3` |
| Cloudflare D1 | `cloudflare-d1` | Pass `binding` from the Worker environment |
| PlanetScale | `planetscale` | Pass `host`, `username`, `password` |

```ts
// MySQL pool
{ driver: 'mysql-pool', host: 'localhost', user: 'root', password: 'secret', database: 'mydb' }

// PostgreSQL
{ driver: 'postgresql', connectionString: 'postgres://user:pass@localhost/mydb' }

// SQLite
{ driver: 'sqlite', name: './bot-detector.db' }
```

## Cache drivers

The `storage` field configures where visitor state, behavioral rate data, and session records are stored between requests. When omitted, the package uses memory.

| Driver | Value | Notes |
|---|---|---|
| memory (default) | *(omit `storage`)* | Single-process only |
| LRU cache | `lru` | In-process LRU; configure `max` and `ttl` |
| Redis | `redis` | Shared across instances; requires `ioredis` |
| Upstash Redis | `upstash` | Serverless Redis via HTTP |
| Filesystem | `fs` | Persistent local storage for development |
| Cloudflare KV (binding) | `cloudflare-kv-binding` | Pass `binding` |
| Cloudflare KV (HTTP) | `cloudflare-kv-http` | Pass `accountId`, `namespaceId`, `apiToken` |
| Cloudflare R2 | `cloudflare-r2-binding` | Pass `binding` |
| Vercel | `vercel` | Vercel Runtime Cache |

## Checker reference

All 17 checkers are enabled with sensible defaults. To disable a checker, pass `{ enable: false }` for its config key. To adjust penalties, pass `{ enable: true, penalties: { ... } }` with the values you want to override.

| Checker | Config key | Phase | What it detects |
|---|---|---|---|
| ip validation | `enableIpChecks` | cheap | Invalid or unresolvable client ip |
| Known good bots | `enableGoodBotsChecks` | cheap | Legitimate crawlers (Googlebot, Bingbot, etc.)|
| Browser and device | `enableBrowserAndDeviceChecks` | cheap | CLI/library user agent types, Internet Explorer, impossible browser and OS combinations |
| Locale consistency | `localeMapsCheck` | cheap | Mismatch between `Accept-Language` header and geo locale |
| FireHOL threat feeds | `enableKnownThreatsDetections` | cheap | IPs in FireHOL levels 1–4 and the anonymizer feed |
| ASN classification | `enableAsnClassification` | cheap | Hosting and content ASNs with low route visibility |
| Tor node analysis | `enableTorAnalysis` | cheap | Exit nodes, guard nodes, bad exits, and obsolete Tor versions |
| Timezone consistency | `enableTimezoneConsistency` | cheap | Mismatch between declared timezone and geo timezone |
| Honeypot paths | `honeypot` | cheap | Requests to configured trap URLs |
| Known bad IPs | `enableKnownBadIpsCheck` | cheap | IPs in your custom `highRisk.mmdb` |
| Behavioral rate | `enableBehaviorRateCheck` | heavy | Request count exceeding the configured threshold within the window |
| Proxy / ISP / cookie | `enableProxyIspCookiesChecks` | heavy | Proxy and VPN detection, missing canary cookie, unknown ISP or org |
| user agent and headers | `enableUaAndHeaderChecks` | heavy | Headless browsers, short user agents,tls fingerprint mismatch, header anomalies |
| Geo location | `enableGeoChecks` | heavy | Missing geo fields, banned countries |
| Session coherence | `enableSessionCoherence` | heavy | Referer mismatches and cross-site navigation inconsistencies |
| Velocity fingerprint | `enableVelocityFingerprint` | heavy | Unnaturally consistent inter-request timing |
| Bad user agent list | `knownBadUserAgents` | heavy | user agents matching the LMDB pattern library (critical → low severity) |

### Detection phases

The pipeline runs in two phases to keep latency low.

**Cheap phase** runs on every request. All lookups are synchronous, in memory reads from MMDB or LMDB dbs. When the accumulated score reaches `banScore` during this phase, the middleware rejects the request and skips the heavy phase entirely.

**Heavy phase** runs only when the cheap-phase score stays below `banScore`. These checkers read from the visitor cache or perform async operations.

## Request object

On every request that passes detection, the middleware populates `req.botDetection`:

```ts
req.botDetection: {
  success: boolean,
  banned: boolean,
  time: string, // ISO timestamp
  ipAddress: string
}
```

## Custom checkers

You can add your own checkers to the pipeline without modifying any package files. Each checker is a class that implements `IBotChecker` and registers itself via `CheckerRegistry.register()`. The middleware picks it up automatically.

See [CUSTOM.md](CUSTOM.md) for the full guide, which covers:

- The `IBotChecker` interface and phase selection
- All fields available on `ValidationContext` (geo, Tor, ASN, parsed user agent, proxy, threat level, cookies, and more)
- Typed custom context via `buildCustomContext` for full IntelliSense on `ctx.custom`
- Triggering an immediate ban via the `BAD_BOT_DETECTED` reason code
- Writing async checkers with your own cache

For example, you may use a client side detection tools that collects data, and then can be send to your custom checker for analysis:

```ts
// types/clientSignals.ts
export interface ClientSignals {
  hasWebDriver: boolean;
  screenResolution: string | null;
  touchPoints: number;
}

// server.ts
import { detectBots } from '@riavzon/bot-detector';
import type { ClientSignals } from './types/clientSignals.js';

app.use(
  detectBots<ClientSignals>((req) => {
    try {
      return JSON.parse(req.headers['x-client-signals'] as string);
    } catch {
      return { hasWebDriver: false, screenResolution: null, touchPoints: 0 };
    }
    // or use ctx.req in ur checker directly
  })
);

// checkers/clientSideChecker.ts
import { CheckerRegistry, getDataSources, getStorage } from '@riavzon/bot-detector';
import type { IBotChecker, ValidationContext, BotDetectorConfig, BanReasonCode } from '@riavzon/bot-detector';
import type { ClientSignals } from '../types/clientSignals.js';

class ClientSideChecker implements IBotChecker<BanReasonCode, ClientSignals> {
  name = 'client-side-signals';
  phase = 'cheap' as const;

  isEnabled(_config: BotDetectorConfig) { 
    return true;
  }

  async run(ctx: ValidationContext<ClientSignals>, _config: BotDetectorConfig) {
    const reasons: BanReasonCode[] = [];
    let score = 0;

    if (ctx.custom.hasWebDriver) {
      reasons.push('BAD_BOT_DETECTED'); // immediate ban, no score needed
      return { score, reasons };
    }

    const cached = await getStorage().getItem<number>(`client-signals:${ctx.ipAddress}`);
    if (cached !== null) {
      return { score: cached, reasons: cached > 0 ? (['BAD_BOT_DETECTED'] as BanReasonCode[]) : [] };
    }

    const ja4Hash = ctx.req.headers['x-ja4'] as string | undefined;
    if (ja4Hash) {
      const ja4Record = getDataSources().getJa4Lmdb().get(ja4Hash);
      if (ja4Record?.is_bot) {
        score += 60;
        reasons.push('BAD_BOT_DETECTED');
      }
    }

    if (ctx.custom.screenResolution === null) score += 20;
    if (ctx.tor.exit_addresses) score += 30;

    // Combine stuff
    if (ctx.tor.running && !ctx.touchPoints) {
       score += 40;
    }

    await getStorage().setItem(`client-signals:${ctx.ipAddress}`, score, { ttl: 60 * 5 });
    return { score, reasons };
  }
}

CheckerRegistry.register(new ClientSideChecker());
```

## CLI

The package ships a cli with three subcommands.

### `init`

Runs the installation wizard. Verifies that [mmdbctl](https://github.com/ipinfo/mmdbctl) is installed (and installs it if not), prompts for a BGP.tools contact string, then compiles all data sources in parallel:

- BGP and ASN data
- City and geography databases
- Tor node lists
- Proxy and anonymizer lists
- Threat levels 1-4 and the anonymous feed
- Verified crawler ip ranges (Googlebot, Bingbot, Apple, Meta, etc.)
- user agent pattern (`useragent.mdb`)
- JA4 fingerprint database (`ja4.mdb`)

The compiled databases are written to `_data-sources/` inside the package directory.

In non interactive environments, `init` skips silently if the databases already exist. If they do not exist, it prints a warning and exits without failing.

```bash
npx bot-detector init
```

### `refresh`

Redownloads and recompiles all data sources that the module uses, using the cached configuration. Requires `init` to have been run at least once.

```bash
npx bot-detector refresh
```
Run this at least ones every 24h.
More info [Shield-Base readme](https://github.com/Sergo706/shield-base-cli)

### `generate`

Reads your database and compiles two custom mmdb files:

- `banned.mmdb`: built from all rows in the `banned` table with a non null ip address
- `highRisk.mmdb`: built from `visitors` rows where `suspicious_activity_score >= generator.scoreThreshold`

Requires mmdbctl. If the path in `generator.mmdbctlPath` cannot be resolved, the command prompts to install it and exits with instructions.

```bash
npx bot-detector generate
```

Run this periodically or after bulk ban operations.

## API

### `defineConfiguration(config)`

Initializes the middleware. Opens all mmdb and lmdb databases, starts the batch write queue, and sets up the cache and database connection. Call it once before attaching `detectBots` to your app.

### `detectBots(buildCustomContext?)`

Returns an Express `RequestHandler`. Always call it as a factory, use `detectBots()`. The optional `buildCustomContext` function runs once per request before any checker executes and populates `ctx.custom` with typed data you define.

```ts
app.use(
  detectBots<MyContext>((req) => ({
    userId: req.user?.id ?? 'anonymous',
    plan: req.user?.plan ?? 'free',
  }))
);
```

### `ApiResponse`

An Express `Router` that mounts `detectBots()` at `/check` and returns `{ results: req.botDetection, message: 'Fingerprint logged successfully' }`.

```ts
import { ApiResponse } from '@riavzon/bot-detector';
app.use('/bot', ApiResponse); // POST /bot/check
```

### `getDataSources()`

Returns the initialized `DataSources` instance. Throws if called before `defineConfiguration` resolves.

### `getStorage()`

Returns the initialized `Storage` instance. Throws if called before `defineConfiguration` resolves.

### `getBatchQueue()`

Returns the initialized `BatchQueue` instance used for deferred database writes. Throws if called before `defineConfiguration` resolves.

### `runGeneration()`

Programmatic equivalent of `bot-detector generate`. Compiles `banned.mmdb` and `highRisk.mmdb` from your database. If `generator.deleteAfterBuild` is `true`, source rows are deleted after each successful compile.

### `banIp(ip, info)`

Issues a ufw firewall rule (`sudo ufw insert 1 deny from <ip>`) to block the ip at the OS level. Only runs when `punishmentType.enableFireWallBan` is `true`, returns immediately otherwise. Requires the Node.js process to have passwordless `sudo` access to `ufw`.

### `parseUA(uaString)`

Parses a user agent string and returns a `ParsedUAResult` with browser name, version, OS, device type, vendor, and model.

### `getGeoData(ip)`

Returns the full `GeoResponse` for any ip address using the mmdb databases. Useful for geo lookups outside the middleware context.

### `updateIsBot(isBot, cookie)`

Updates the `is_bot` column in the `visitors` table for the given `canary_id`.

### `updateBannedIP(cookie, ipAddress, country, userAgent, info)`

Upserts a row into the `banned` table with the visitor's canary cookie, ip address, country, user agent, ban reasons, and score.

### `warmUp()`

Warms the database connection pool by running parallel `SELECT 1` queries, then fires a dummy visitor query to prime the query plan cache. Call this after `defineConfiguration` resolves but before the server starts accepting traffic.

### `updateVisitors(data, cookie, visitorId)`

Updates the full fingerprint record in the `visitors` table for a given canary and visitor id pair. Returns `{ success: boolean, reason?: string }`.

### `CheckerRegistry`

Registry for custom bot checker plugins. Use `CheckerRegistry.register(checker)` to add a checker that implements `IBotChecker`. Checkers are partitioned into `cheap` and `heavy` phases and filtered by your config at runtime.

### `BadBotDetected` / `GoodBotDetected`

Error subclasses thrown (or catchable) when a checker conclusively identifies a bad or good bot. Re-exported from `helpers/exceptions` for use in custom checkers and error-handling middleware.

---
A dedicated documentation site is coming soon.

## License

Apache-2.0