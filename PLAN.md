# BotDetector Enhancement Plan

## Status
- **Phase 1 (UUID)** ✅ Done
- **Phase 2 (Batch Queue)** ✅ Done
- **Phase 3 (New Checkers)** 🔲 TODO

---

## Overview

Three parallel tracks of work to enhance the botDetector middleware:

1. **UUID Visitor ID** — replace MySQL `AUTO_INCREMENT` with a client-generated UUID, eliminating a `SELECT` query per request
2. **Batch Write Queue** — replace per-request DB writes with an in-memory buffer that flushes in batches, reducing per-request latency from ~50–100ms to near-zero
3. **New Checkers** — leverage rich but currently unused data from the shield-base-cli MMDB datasets

---

## Phase 1: UUID-based Visitor ID

### Problem
`updateVisitors.ts` runs two DB calls per request: an `INSERT ... ON DUPLICATE KEY UPDATE`, then a `SELECT visitor_id FROM visitors WHERE canary_id = ?` to retrieve the auto-increment ID. This SELECT is the only reason `visitor_id` is an `INT AUTO_INCREMENT`.

### Plan

**`src/botDetector/middlewares/canaryCookieChecker.ts`**
- Generate UUID before the DB call: `const visitorId = crypto.randomUUID()` (Node.js built-in, no dependency)
- Pass `visitorId` to `updateVisitor()`
- Assign `req.newVisitorId = visitorId` immediately — no longer waiting on a DB result
- Change `Request.newVisitorId` type: `number` → `string`

**`src/botDetector/db/updateVisitors.ts`**
- Accept `visitorId: string` parameter
- Include `visitor_id` in the `INSERT` column list
- **Remove** the `SELECT visitor_id ...` query entirely (lines 136–140)
- On `ON DUPLICATE KEY UPDATE`, do not overwrite `visitor_id` (preserve original UUID)
- Return `visitorId` directly or return void

**`src/botDetector/db/schema.ts`**
- Change `visitor_id INT AUTO_INCREMENT UNIQUE NOT NULL` → `visitor_id CHAR(36) NOT NULL`

**`src/botDetector/types/fingerPrint.ts`**
- Add `visitor_id?: string` to `userValidation`

**`src/botDetector/helpers/cache/cannaryCache.ts`**
- Change cache value `visitor_id` type: `number` → `string`

---

## Phase 2: In-Memory Write Buffer + Batch Flush

### Problem
Up to 5–6 DB calls fire per request:
- `updateVisitors()` — INSERT + SELECT
- `updateScore()` — UPDATE
- `updateIsBot()` — UPDATE
- `updateBannedIP()` — INSERT (only on ban)

Each adds 10–30ms. Aggregate latency per request: 50–100ms.

### Plan

**New file: `src/botDetector/db/batchQueue.ts`**

A `BatchQueue` class with:
- Internal `Map<string, BatchOperation>` keyed by `"${type}:${canary_id}"` — deduplication ensures only the latest write per visitor per type survives to flush
- Configurable flush trigger: periodic interval (default 5s) OR buffer size threshold (default 100 entries)
- `priority: 'immediate'` operations (bans) bypass the buffer and flush synchronously
- Flush builds optimized SQL:
  - `visitor_upsert` → multi-row `INSERT ... ON DUPLICATE KEY UPDATE (...), (...), ...`
  - `score_update` / `is_bot_update` → `UPDATE visitors SET col = CASE canary_id WHEN ? THEN ? ... END WHERE canary_id IN (...)`
- Retry failed flushes up to `maxRetries` (default 3), then log and discard
- `shutdown()` method for graceful drain on `SIGTERM`/`SIGINT`

**`src/botDetector/types/configSchema.ts`**
- Add `batchQueue` config block inside the schema:
  ```ts
  batchQueue: z.object({
    flushIntervalMs: z.number().default(5000),
    maxBufferSize:   z.number().default(100),
    maxRetries:      z.number().default(3),
  }).prefault({})
  ```

**`src/botDetector/config/config.ts`**
- Initialize `BatchQueue` singleton alongside `DataSources`
- Export `getBatchQueue()` getter
- Register `process.on('SIGTERM'/'SIGINT', () => batchQueue.shutdown())`

**Integrate into existing DB files:**

| File | Change |
|---|---|
| `src/botDetector/db/updateVisitors.ts` | `enqueue({ type: 'visitor_upsert', priority: 'deferred' })` |
| `src/botDetector/db/updateVisitorScore.ts` | `enqueue({ type: 'score_update', priority: 'deferred' })` |
| `src/botDetector/db/updateIsBot.ts` | `enqueue({ type: 'is_bot_update', priority: 'deferred' })` |
| `src/botDetector/db/updateBanned.ts` | `enqueue({ type: 'banned_upsert', priority: 'immediate' })` — security-critical, always flushes immediately |

---

## Phase 3: New Checkers

All four checkers use data already loaded into `ValidationContext` — zero additional I/O. They implement `IBotChecker`, register via `CheckerRegistry.register()`, and are imported in `src/botDetector/checkers/index.ts`.

---

### 3A. Firehol Threat Level Escalation

**File:** `src/botDetector/checkers/fireholEscalation.ts`
**Phase:** `cheap`

**The gap:** `ctx.threatLevel` (1–4) and `ctx.anon` are computed in `botDetector.ts:30–51` but **no existing checker reads them**. This checker closes that gap.

| Condition | Default Penalty | Reason Code |
|---|---|---|
| `ctx.anon === true` | 20 | `ANONYMITY_NETWORK` |
| `ctx.threatLevel === 1` | 40 | `FIREHOL_L1_THREAT` |
| `ctx.threatLevel === 2` | 30 | `FIREHOL_L2_THREAT` |
| `ctx.threatLevel === 3` | 20 | `FIREHOL_L3_THREAT` |
| `ctx.threatLevel === 4` | 10 | `FIREHOL_L4_THREAT` |

Config: `enableFireholEscalation` (discriminatedUnion, enabled by default)

---

### 3B. ASN Classification Checker

**File:** `src/botDetector/checkers/asnClassification.ts`
**Phase:** `cheap`

**The gap:** `ctx.bgp.classification` and `ctx.bgp.hits` are loaded from `asn.mmdb` but only `classification === "Content"` is used (to set a hosting boolean). The full classification and route visibility data is unused.

| Condition | Default Penalty | Reason Code |
|---|---|---|
| `classification === "Content"` (hosting ASN) | 15 | `ASN_HOSTING_CLASSIFIED` |
| `classification` is empty / unknown | 10 | `ASN_CLASSIFICATION_UNKNOWN` |
| `parseInt(hits) < threshold` (low BGP visibility) | 10 | `ASN_LOW_VISIBILITY` |

Config: `enableAsnClassification` (discriminatedUnion, enabled by default)

---

### 3C. Tor Node Deep Analysis

**File:** `src/botDetector/checkers/torAnalysis.ts`
**Phase:** `cheap`

**The gap:** `ctx.tor` is populated from `tor.mmdb` with rich fields, but the system only checks `exit_addresses` as a boolean to set the `hosting` flag. `running`, `flags`, `version_status`, `exit_probability`, etc. are all unused.

| Condition | Default Penalty | Reason Code |
|---|---|---|
| `tor.running === true` | 15 | `TOR_ACTIVE_NODE` |
| `tor.exit_addresses` non-empty | 20 + `ceil(exit_probability * 30)` | `TOR_EXIT_NODE` |
| `tor.flags` contains `"BadExit"` | 40 | `TOR_BAD_EXIT` |
| `tor.recommended_version === false` or `tor.version_status === "obsolete"` | 10 | `TOR_OBSOLETE_VERSION` |

If `ctx.tor` is empty (IP is not a Tor node) → score 0, skip.

Config: `enableTorAnalysis` (discriminatedUnion, enabled by default)

---

### 3D. Timezone Consistency Checker

**File:** `src/botDetector/checkers/timezoneConsistency.ts`
**Phase:** `cheap`

**The gap:** `configSchema.ts:234–242` has an `enableTimeZoneMapper` config entry that is enabled by default, but **there is no checker implementing it**. This checker fills that gap.

Compares:
- Timezone hint from request headers (e.g., `Sec-CH-UA-Timezone`, or a custom app-set header) vs `ctx.geoData.timezone` from `city.mmdb`
- Accept-Language region's expected timezone vs `ctx.geoData.timezone`

If no timezone header is present, score 0 (graceful skip — most requests won't have one).

New reason codes: `TZ_HEADER_GEO_MISMATCH`, `TZ_LOCALE_GEO_MISMATCH`

Uses existing `enableTimeZoneMapper` config — no new config entry needed.

---

### Registration

**`src/botDetector/checkers/index.ts`** — add 4 new imports:
```ts
import './fireholEscalation.js';
import './asnClassification.js';
import './torAnalysis.js';
import './timezoneConsistency.js';
```

**`src/botDetector/types/checkersTypes.ts`** — extend `BanReasonCode` union:
```ts
| 'FIREHOL_L1_THREAT'
| 'FIREHOL_L2_THREAT'
| 'FIREHOL_L3_THREAT'
| 'FIREHOL_L4_THREAT'
| 'ANONYMITY_NETWORK'
| 'ASN_HOSTING_CLASSIFIED'
| 'ASN_CLASSIFICATION_UNKNOWN'
| 'ASN_LOW_VISIBILITY'
| 'TOR_ACTIVE_NODE'
| 'TOR_EXIT_NODE'
| 'TOR_BAD_EXIT'
| 'TOR_OBSOLETE_VERSION'
| 'TZ_HEADER_GEO_MISMATCH'
| 'TZ_LOCALE_GEO_MISMATCH'
```

---

## Implementation Order

```
Phase 1 (UUID)   ──► Phase 2 (BatchQueue)
                                          \
Phase 3 (New Checkers) ── independent ────► done
```

Phase 1 must come before Phase 2 (eliminates the SELECT that makes batching complex). Phase 3 is fully independent and can be done in parallel.

---

## Verification Checklist

- [ ] `req.newVisitorId` is a UUID string downstream
- [ ] No `SELECT visitor_id` query in logs after Phase 1
- [ ] DB writes are deferred and appear in batches in logs after Phase 2
- [ ] Banned IPs are written immediately (not deferred)
- [ ] Graceful shutdown flushes remaining queue
- [ ] New checkers score correctly for known Tor/threat/ASN test IPs
- [ ] `enableTimeZoneMapper` config now has an active implementation
- [ ] All new `BanReasonCode` values appear in ban records when triggered
- [ ] `npx vitest` passes
