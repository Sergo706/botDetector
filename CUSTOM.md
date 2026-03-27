
# Writing Custom Checkers


The bot detector is built around a **checker registry**, every check is a class that implements `IBotChecker`, self registers on import, and gets picked up automatically when the middleware runs.

## How the Pipeline Works

Each request passes through two sequential phases: **cheap** and **heavy**. The score check runs after **every individual checker** in both phases. The moment the accumulated score reaches or exceeds `banScore`, the pipeline stops processing any remaining checkers in that phase and the visitor is banned. The heavy phase is skipped entirely if the cheap phase already reached `banScore`.

Two special reason codes short-circuit the pipeline immediately, regardless of score:

- `'BAD_BOT_DETECTED'`: throws `BadBotDetected`, bans the visitor instantly
- `'GOOD_BOT_IDENTIFIED'`: throws `GoodBotDetected`, lets the visitor through instantly

```
Request
  │
  
[cheap phase] - in-memory checks, header inspection, pre-loaded MMDB lookups
  │
  after each checker:
    ├─ BAD_BOT_DETECTED in reasons? → ban immediately (no further checks)
    ├─ GOOD_BOT_IDENTIFIED in reasons? → allow immediately (no further checks)
    └─ score >= banScore? → ban immediately (no further checks)
  │
  score still < banScore after all cheap checkers?
  │
  
[heavy phase] - DB queries, external calls, storage reads
  │
  after each checker:
    ├─ BAD_BOT_DETECTED in reasons? → ban immediately
    ├─ GOOD_BOT_IDENTIFIED in reasons? → allow immediately
    └─ score >= banScore? - ban immediately (no further checks)
  │
  
Final decision: allow / ban
```

---

## The `IBotChecker` Interface

Every checker must implement `IBotChecker`. The interface accepts two type parameters:

- `Code`, your custom reason code union. You can extend or alias the built in `BanReasonCode`.
- `TCustom` *(optional)*, the shape of `ctx.custom`, populated by your `buildCustomContext` function. Defaults to `Record<string, never>`.

```ts
import type { IBotChecker, ValidationContext, BotDetectorConfig } from '@riavzon/bot-detector';

interface IBotChecker<Code, TCustom = Record<string, never>> {
  name: string; // display name, shown in logs
  phase: 'cheap' | 'heavy'; // which phase this checker runs in
  isEnabled(config: BotDetectorConfig): boolean; // self explanatory
  run(ctx: ValidationContext<TCustom>, config: BotDetectorConfig ): // the checker logic
    | Promise<{ score: number; reasons: Code[] }>
    | { score: number; reasons: Code[] };
}
```

The `run` method can be synchronous or async. Return a numeric score and an array of reason codes. A score of `0` with an empty reasons array means the checker found nothing suspicious.

---

## Phases

| Phase | When it runs | Best for |
|---|---|---|
| `cheap` | Every request, before the heavy phase | In-memory checks, header inspection, reading pre-loaded MMDB data from `ctx` |
| `heavy` | Only when accumulated score is below `banScore` after cheap phase | Database queries, external API calls, cache reads with I/O fallback |

Prefer `cheap` for anything that does not require I/O. All MMDB lookups (geo, ASN, Tor, proxy, threat levels) are already resolved before your checker runs, reading them from `ctx` costs nothing.

---

## What's Available in `ValidationContext`

The `ValidationContext` object contains everything the pipeline resolves before your checker runs. All fields are pre-populated; your checker only reads them.

```ts
ctx.req       // Express Request — full access to headers, path, cookies, method
ctx.ipAddress // string: the resolved client IP
ctx.cookie    // string | undefined: canary_id cookie value (visitor identifier)
```

### Geo and IP Intelligence

All fields are sourced from three MMDB databases merged at request time: `country.mmdb` (country-level), `city.mmdb` (city-level), `asn.mmdb` (BGP/network), and `proxy.mmdb`. City-level data takes precedence where both exist. All string values are normalized to lowercase.

```ts
ctx.geoData     // Partial<GeoResponse> — all fields optional
  .country      //   country name, "united states"
  .countryCode  //   ISO 3166-1 alpha-2, "us"
  .continent    //   "north america"  (city.mmdb only)
  .region       //   region/province code, "ny"
  .regionName   //   continent ?? subregion fallback
  .subregion    //   "northern america"
  .state        //   "new york"
  .city         //   "new york city"
  .capital      //   country capital, "washington d.c."
  .district     //   mirrors .state (city.mmdb state field)
  .zipCode      //   postal code, "10001"
  .lat          //   latitude string, "40.7128"
  .lon          //   longitude string, "-74.0059"
  .timezone     //   IANA timezone, "america/new_york"
  .timeZoneName //   human-readable, "eastern standard time"
  .utc_offset   //   "-05:00"
  .isp          //   ASN org name (asn.mmdb → asn_name), "cloudflare, inc."
  .org          //   ASN ID (asn.mmdb → asn_id), "as13335"
  .as_org       //   same as .isp (asn_name duplicate)
  .proxy        //   boolean, IP matched in proxy.mmdb
  .hosting      //   boolean, true when asn.classification === "Content"
  .tld          //   country TLD, ".us"
  .nationality  //   "american"
  .currency     //   "usd"
  .iso639       //   primary language code, "en"
  .languages    //   all languages, "en-us"
  .native       //   native country name, "united states"
  .phone        //   country calling code, "1"
  .numericCode  //   ISO 3166-1 numeric, "840"
```

```ts
ctx.proxy
  .isProxy   // boolean, true if proxy.mmdb matched this IP
  .proxyType // string | undefined, ProxyRecord.comment field:
             // comma-separated source list names, e.g. "firehol_proxies,xroxy"
```

### Tor Analysis

`ctx.tor` is `Partial<Omit<TorRecord, 'range'>>`, an empty object when the IP is not a known Tor relay. All fields are sourced directly from `tor.mmdb` via the Onionoo dataset.

```ts
ctx.tor
  .running                   //   boolean, relay is currently running
  .flags                     //   comma-separated flag string, e.g. "Exit,Fast,Guard,Running,Stable,Valid"
  .exit_addresses            //   string, non-empty means this is a confirmed exit node
  .exit_probability          //   number, probability this relay is chosen as exit (0–1)
  .guard_probability         //   number, probability this relay is chosen as guard (0–1)
  .middle_probability        //   number, probability chosen as middle relay (0–1)
  .recommended_version       //   boolean, running a Tor-project-recommended version
  .version_status            //   "recommended" | "obsolete" | "new" | "unrecommended" | etc.
  .exit_policy               //   string, serialized exit policy rules
  .exit_policy_summary       //   string, serialized accept/reject summary
  .exit_policy_v6_summary    //   string | undefined, IPv6 exit policy summary
  .country                   //   2-letter country code of the relay, e.g. "de"
  .country_name              //   e.g. "germany"
  .as                        //   ASN of the relay, e.g. "AS24940"
  .as_name                   //   ASN org name of the relay, e.g. "hetzner online gmbh"
  .or_addresses              //   string, onion router address(es)
  .contact                   //   string, operator contact info (often obfuscated)
  .first_seen                //   ISO date string, when this relay first appeared
  .last_seen                 //   ISO date string, last time relay was observed
  .last_restarted            //   ISO date string
  .last_changed_address_or_port // ISO date string
  .measured                  //   boolean, whether bandwidth has been measured
```

### BGP / ASN

`ctx.bgp` is `Partial<Omit<BgpRecord, 'range'>>`, an empty object when the ASN is not found.

```ts
ctx.bgp
  .asn_id                    //   string, ASN identifier, e.g. "AS13335"
  .asn_name                  //   string, org name, e.g. "cloudflare, inc."
  .classification            //   string, "Content" | "Eyeballs" | "Unknown"
  .hits                      //   string, BGP route announcement count
```

`classification` is the key field here. `"Content"` means CDN/hosting (sets `ctx.geoData.hosting = true`). `"Eyeballs"` means residential/business internet.

### Threat Level and Anonymity

```ts
ctx.anon        // boolean — true if IP is in firehol_anonymous.mmdb
ctx.threatLevel // 1 | 2 | 3 | 4 | null — highest Firehol level matched (1 = most severe)
                //   1 = firehol_l1 (confirmed malicious, no false positives)
                //   2 = firehol_l2 (abuse + scanning)
                //   3 = firehol_l3 (web attacks)
                //   4 = firehol_l4 (aggressive but broader)
```

The levels are mutually exclusive in `ctx`, if an IP matches `firehol_l1`, `threatLevel` is `1` and levels 2–4 are not checked. A `null` value means no match.

### Parsed User Agent

`ua-parser-js` resolves all fields synchronously before any checker runs. The result is `Partial<ParsedUAResult>` so every field may be undefined.

```ts
ctx.parsedUA
  .browser        //   "chrome", "safari", "firefox"
  .browserType    //   "browser" | "crawler" | "fetcher" | "cli" | "library"
  .browserVersion //   "120.0.0"
  .os             //   "windows", "macos", "android"
  .device         //   "desktop", "mobile", "tablet"
  .deviceVendor   //   "apple", "samsung"
  .deviceModel    //   "iphone", "galaxy s24"
  .bot            //   boolean, ua-parser-js considers this a bot UA
  .botAI          //   boolean, known AI crawler (GPTBot, ClaudeBot, etc.)
  .allResults     //   IResult, raw ua-parser-js output, for advanced access
```

`browserType` is the fastest signal for bot intent. `"crawler"` and `"fetcher"` trigger the good-bot DNS verification path. `"cli"` and `"library"` are penalised by the built-in `BrowserDetailsAndDeviceChecker`.

### Custom Data

```ts
ctx.custom // TCustom, populated by your buildCustomContext function, {} by default
```

See [Custom Context](#custom-context--passing-your-own-data-into-checkers) below for how to populate and type this field.

---

## Minimal Example Synchronous Cheap Checker

A cheap checker should be synchronous and rely only on data already present in `ctx`. The example below penalises requests from South America that carry no `Accept-Language` header.

```ts
// my-custom-checker.ts
import { CheckerRegistry } from '@riavzon/bot-detector/internals';
import type { IBotChecker, ValidationContext, BotDetectorConfig } from '@riavzon/bot-detector';

type MyReasonCode = 'MISSING_ACCEPT_LANGUAGE' | 'BAD_BOT_DETECTED';

class MissingLocaleChecker implements IBotChecker<MyReasonCode> {
  name = 'MissingLocaleChecker';
  phase = 'cheap' as const;

  isEnabled(_config: BotDetectorConfig): boolean {
    return true;
  }

  run(ctx: ValidationContext, _config: BotDetectorConfig) {
    const reasons: MyReasonCode[] = [];
    let score = 0;

    if (!ctx.req.get('Accept-Language') && ctx.geoData.continent === 'south america') {
      score += 15;
      reasons.push('MISSING_ACCEPT_LANGUAGE');
    }

    return { score, reasons };
  }
}

CheckerRegistry.register(new MissingLocaleChecker());
```

Import the file **after** `initBotDetector()` resolves. The side-effect import triggers `CheckerRegistry.register()`.

```ts
// server.ts
import { initBotDetector, detectBots } from '@riavzon/bot-detector';
import './my-custom-checker.js';

await initBotDetector({ store: pool, banScore: 80 });
app.use(detectBots()); // always call detectBots() as a factory
```

---

## Custom Context Passing Your Own Data into Checkers

Every checker receives a `ctx.custom` field. By default it is `Record<string, never>` empty. You populate it by passing a `buildCustomContext` function to `detectBots()`. The generic type flows through to your checker's `run()` signature, giving you full IntelliSense on `ctx.custom`.

The builder function runs once per request, before any checker executes.

### Step 1 - Define Your Context Shape

```ts
// types/myContext.ts
export interface MyContext {
  userId: string;
  plan: 'free' | 'pro' | 'enterprise';
  isInternal: boolean;
}
```

### Step 2 - Pass the Builder to `detectBots()`

```ts
// server.ts
import { detectBots } from '@riavzon/bot-detector';
import type { MyContext } from './types/myContext.js';

app.use(
  detectBots<MyContext>((req) => ({
    userId: req.user?.id   ?? 'anonymous',
    plan: req.user?.plan ?? 'free',
    isInternal: req.ip === '127.0.0.1',
  }))
);
```

### Step 3 - Declare the Type on Your Checker

Passing `MyContext` as the second type parameter to `IBotChecker` makes `ctx.custom` fully typed inside `run()`.

```ts
// my-plan-checker.ts
import { CheckerRegistry } from '@riavzon/bot-detector/internals';
import type { IBotChecker, ValidationContext, BotDetectorConfig, BanReasonCode } from '@riavzon/bot-detector';
import type { MyContext } from './types/myContext.js';

class PlanAbuseChecker implements IBotChecker<BanReasonCode, MyContext> {
  name = 'PlanAbuseChecker';
  phase = 'cheap' as const;

  isEnabled(_config: BotDetectorConfig) { 
    return true; 
  }

  run(ctx: ValidationContext<MyContext>, _config: BotDetectorConfig) {
    const reasons: BanReasonCode[] = [];
    let score = 0;

    if (ctx.custom.isInternal) return { score, reasons }; // bypass internal traffic

    if (ctx.custom.plan === 'free' && ctx.geoData.proxy) {
      score += 20;
      reasons.push('PROXY_DETECTED');
    }

    return { score, reasons };
  }
}

CheckerRegistry.register(new PlanAbuseChecker());
```

When no custom context is needed, call `detectBots()` with no arguments, `ctx.custom` will be `{}` and is safe to ignore.

---

## Async Checker with Database or Cache

Checkers that need I/O, database queries, external API calls, or cache reads with a DB fallback, should declare `phase: 'heavy'`. The heavy phase only runs when the cheap phase score stays below `banScore`, so expensive work is never done for obvious bots.

This example uses the built in storage via `getStorage()` to cache results and avoid database queries on repeated IPs. The storage instance is the same one configured in `defineConfiguration()`.

```ts
// my-async-checker.ts
import { getStorage, CheckerRegistry } from '@riavzon/bot-detector';
import type { IBotChecker, ValidationContext, BotDetectorConfig } from '@riavzon/bot-detector';

class MyAsyncChecker implements IBotChecker<'MY_REASON'> {
  name = 'MyAsyncChecker';
  phase = 'heavy' as const;

  isEnabled(_config: BotDetectorConfig): boolean {
    return true;
  }

  async run(ctx: ValidationContext, _config: BotDetectorConfig) {
    const reasons: 'MY_REASON'[] = [];
    let score = 0;

    if (!ctx.cookie) return { score, reasons };

    const storage = getStorage();
    const cacheKey = `my-checker:${ctx.cookie}`;

    const cached = await storage.getItem<number>(cacheKey);
    if (cached !== null) {
      return { score: cached, reasons: cached > 0 ? ['MY_REASON'] : [] };
    }

    // Your DB query or external call here
    const result = await myDb.query('SELECT ...', [ctx.ipAddress]);
    if (result.isSuspicious) {
      score = 30;
      reasons.push('MY_REASON');
    }

    await storage.setItem(cacheKey, score, { ttl: 300 }); // 5 min TTL
    return { score, reasons };
  }
}

CheckerRegistry.register(new MyAsyncChecker());
```

> **Tip:** 
>Use a namespaced key prefix (`custom:`) to avoid collisions with the built in cache entries that share the same storage instance.

---

## Triggering an Immediate Ban

Return the special reason code `'BAD_BOT_DETECTED'` from your checker to trigger an instant ban. The pipeline throws `BadBotDetected` immediately upon seeing this code, stopping all remaining checkers and banning the visitor without waiting for score accumulation.

```ts
run(ctx: ValidationContext, _config: BotDetectorConfig) {
  const reasons: ('MY_REASON' | 'BAD_BOT_DETECTED')[] = [];

  if (isDefinitelyABot(ctx)) {
    reasons.push('MY_REASON');
    reasons.push('BAD_BOT_DETECTED'); // pipeline stops here, visitor is banned immediately
    return { score: 0, reasons };
  }

  return { score: 0, reasons };
}
```

The built-in honeypot checker and good-bot DNS verifier both use this same mechanism.

---

## Checker Configuration

The `BotDetectorConfig` schema is read only, you cannot add fields to it from outside the package. Manage your checker's settings in a separate module and import it directly.

```ts
// my-checker-config.ts
export const myCheckerConfig = {
  threshold: 5,
  penalty: 25,
};
```

```ts
// my-custom-checker.ts
import { myCheckerConfig } from './my-checker-config.js';

run(ctx: ValidationContext, _config: BotDetectorConfig) {
  if (someValue > myCheckerConfig.threshold) {
    score += myCheckerConfig.penalty;
  }
}
```

---

## Checker Registration

Registration happens at module load time. At the bottom of your checker file, call `CheckerRegistry.register()` with an instance of your class. The registry is a module-level array, the call is synchronous and takes effect immediately when the file is imported.

```ts
// my-custom-checker.ts

class MyChecker implements IBotChecker<'MY_REASON'> {
  // ...
}

CheckerRegistry.register(new MyChecker()); // this line does the registration
```

To activate the checker, import the file in your server entry point **after** `initBotDetector()` resolves. A bare side-effect import is enough, you don't need to use the exported value.

```ts
// server.ts
import { initBotDetector, detectBots } from '@riavzon/bot-detector';
import './my-custom-checker.js'; // side-effect import, triggers CheckerRegistry.register()

await initBotDetector({ store: pool });
app.use(detectBots());
```

> **Note:** Importing your checker file before `initBotDetector()` resolves is safe for registration itself, but `getStorage()` and `getDb()` will throw if called at module initialisation time. Keep any storage or DB access inside `run()`, not at the top level of your module.

### Registration Order

Checkers run in the order they are registered within their phase. The built-in pipeline executes in this sequence:

1. Built-in cheap checkers (IP validation → good bots → browser/device → locale → UA/headers → ...)
2. Your custom cheap checkers (in import order)
3. Built-in heavy checkers (rate tracking → proxy/ISP → session coherence → velocity → bad UA patterns)
4. Your custom heavy checkers (in import order)

When the order of your custom checkers matters, control it through import sequence:

```ts
// server.ts
import './my-cheap-checker-1.js'; // registers first
import './my-cheap-checker-2.js'; // registers second
import { initBotDetector, detectBots } from '@riavzon/bot-detector';

await initBotDetector({ store: pool });
app.use(detectBots());
```

---

## Built-in `BanReasonCode` Values

Your custom checker can return any of the 57 built-in reason codes alongside your own. The most commonly reused ones are listed below.

| Code | Meaning |
|---|---|
| `BAD_BOT_DETECTED` | Triggers an immediate ban — no further checkers run |
| `GOOD_BOT_IDENTIFIED` | Marks the request as a verified legitimate crawler — no further checkers run |
| `PROXY_DETECTED` | IP matched in proxy database |
| `HOSTING_DETECTED` | ASN classified as hosting/Content or confirmed Tor exit |
| `ANONYMITY_NETWORK` | IP appears in Firehol anonymous list |
| `HEADLESS_BROWSER_DETECTED` | Headless browser keyword found in the user agent |
| `BEHAVIOR_TOO_FAST` | Request rate exceeds the configured behavioral threshold |
| `TIMING_TOO_REGULAR` | Inter-request intervals are too consistent (low coefficient of variation) |
| `PREVIOUSLY_BANNED_IP` | IP exists in `banned.mmdb` |
| `PREVIOUSLY_HIGH_RISK_IP` | IP exists in `highRisk.mmdb` |
| `HONEYPOT_PATH_HIT` | Request targeted a honeypot path |
| `BANNED_COUNTRY` | Request originates from a configured banned country |

Import `BanReasonCode` from `'@riavzon/bot-detector'` to use any of these in your checker's type signature.

---

## Summary

| What you need | Where to find it |
|---|---|
| Request data | `ValidationContext` fields |
| Geo data or builded in contexes | `ValidationContext` fields |
| Access to the raw Datasources | `getDataSources()` import it |
| Your own per-request data | `buildCustomContext` passed to `detectBots()` → `ctx.custom` |
| Typed `ctx.custom` in checker | `IBotChecker<Code, MyContext>` + `ValidationContext<MyContext>` |
| Immediate ban | Return `'BAD_BOT_DETECTED'` in `reasons` |
| Score accumulation | Return `{ score: N, reasons: ['YOUR_CODE'] }` |
| Async / DB work | Use `phase: 'heavy'` with a local LRU cache |
| Built-in reason codes | `BanReasonCode` from `'@riavzon/bot-detector'` |
| Register a checker | `CheckerRegistry.register(new YourChecker())` at module bottom |
| Middleware setup | `app.use(detectBots())` always call as a factory |
| External checker config | Define a separate config module and import it directly |
