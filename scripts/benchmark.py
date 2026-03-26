#!/usr/bin/env python3
"""
Bot Detector — Log Benchmark Reporter
Usage:
    python3 scripts/benchmark.py [log_file] [output_file]

Defaults:
    log_file = bot-detector-logs/info.log
    output_file = bot-detector-logs/benchmark.md
"""

import sys
import json
import statistics
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict

LOG_FILE = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("bot-detector-logs/info.log")
OUT_FILE = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("bot-detector-logs/benchmark.md")

CHECKER_ORDER = [
    "IP Validation",
    "Good/Bad Bot Verification",
    "Browser and Device Verification",
    "Locale and Country Verification",
    "Known ThreatLevels",
    "ASN Classification",
    "Tor Node Analysis",
    "Timezone Consistency",
    "Honeypot Path",
    "KnownBadIps",
    "Behavior Rate Verification",
    "Proxy, ISP and Cookie Verification",
    "User agent and Header Verification",
    "Geo-Location Verification",
    "Session Coherence",
    "Velocity Fingerprinting",
    "Bad User Agent list",
]

CHEAP_CHECKERS = {
    "IP Validation",
    "Good/Bad Bot Verification",
    "Browser and Device Verification",
    "Locale and Country Verification",
    "Known ThreatLevels",
    "ASN Classification",
    "Tor Node Analysis",
    "Timezone Consistency",
    "Honeypot Path",
    "KnownBadIps",
}



def parse(path: Path):
    phase_times: dict[str, list[float]] = defaultdict(list)   # "cheapPhase" / "heavyPhase"
    checker_times: dict[str, list[float]] = defaultdict(list)
    timestamps: list[float] = []

    with path.open() as f:
        for raw in f:
            raw = raw.strip()
            if not raw:
                continue
            try:
                d = json.loads(raw)
            except json.JSONDecodeError:
                continue

            ts = d.get("time")
            if ts:
                try:
                    timestamps.append(
                        datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp()
                    )
                except ValueError:
                    pass

            event = d.get("event")
            dur = d.get("durationMs")

            if event != "end" or dur is None:
                continue

            phase = d.get("phase")
            check = d.get("check")

            if phase in ("cheapPhase", "heavyPhase"):
                phase_times[phase].append(dur)
            elif check:
                checker_times[check].append(dur)

    return phase_times, checker_times, timestamps



def pct(data: list[float], p: float) -> float:
    if not data:
        return 0.0
    idx = int(len(data) * p)
    idx = min(idx, len(data) - 1)
    return data[idx]


def stats(data: list[float]) -> dict:
    if not data:
        return {}
    s = sorted(data)
    return {
        "n": len(s),
        "min": s[0],
        "p50": pct(s, 0.50),
        "p75": pct(s, 0.75),
        "p95": pct(s, 0.95),
        "p99": pct(s, 0.99),
        "max": s[-1],
        "avg": statistics.mean(s),
    }


def fmt(v: float) -> str:
    if v >= 1000:
        return f"{v:,.0f}ms"
    if v >= 10:
        return f"{v:.1f}ms"
    return f"{v:.3f}ms"



def row(*cells) -> str:
    return "| " + " | ".join(str(c) for c in cells) + " |"


def header(*cells) -> str:
    sep = "|" + "|".join("---" for _ in cells) + "|"
    return row(*cells) + "\n" + sep


def phase_table(label: str, s: dict) -> str:
    if not s:
        return f"_No data for {label}_\n"
    lines = [
        header("Metric", "Value"),
        row("count", f"{s['n']:,}"),
        row("min", fmt(s["min"])),
        row("p50", fmt(s["p50"])),
        row("p75", fmt(s["p75"])),
        row("p95", fmt(s["p95"])),
        row("p99", fmt(s["p99"])),
        row("max", fmt(s["max"])),
        row("avg", fmt(s["avg"])),
    ]
    return "\n".join(lines) + "\n"


def checker_table(checker_times: dict[str, list[float]]) -> str:
    lines = [
        header("Checker", "Phase", "n", "p50", "p95", "p99", "max", "avg"),
    ]
    for name in CHECKER_ORDER:
        data = checker_times.get(name)
        if not data:
            continue
        s = stats(data)
        phase = "cheap" if name in CHEAP_CHECKERS else "heavy"
        lines.append(row(
            name, phase,
            f"{s['n']:,}",
            fmt(s["p50"]),
            fmt(s["p95"]),
            fmt(s["p99"]),
            fmt(s["max"]),
            fmt(s["avg"]),
        ))
    # any checkers in the log not in our known list
    for name, data in checker_times.items():
        if name not in CHECKER_ORDER:
            s = stats(data)
            lines.append(row(
                f"_{name}_", "?",
                f"{s['n']:,}",
                fmt(s["p50"]),
                fmt(s["p95"]),
                fmt(s["p99"]),
                fmt(s["max"]),
                fmt(s["avg"]),
            ))
    return "\n".join(lines) + "\n"


def brv_table(data: list[float]) -> str:
    if not data:
        return "_No BRV data found_\n"
    s = stats(data)
    cache_hits = [t for t in data if t < 1.0]
    db_queries  = [t for t in data if t >= 1.0]
    total = len(data)

    lines = [
        header("Metric", "Value"),
        row("total calls", f"{total:,}"),
        row("min", fmt(s["min"])),
        row("p50", fmt(s["p50"])),
        row("p75", fmt(s["p75"])),
        row("p95", fmt(s["p95"])),
        row("p99", fmt(s["p99"])),
        row("max", fmt(s["max"])),
        row("avg", fmt(s["avg"])),
        row("", ""),
        row("cache hits (<1ms)", f"{len(cache_hits):,} ({100*len(cache_hits)/total:.1f}%)"),
        row("DB queries (≥1ms)", f"{len(db_queries):,} ({100*len(db_queries)/total:.1f}%)"),
    ]
    if db_queries:
        db_s = stats(db_queries)
        lines.append(row("DB query p50", fmt(db_s["p50"])))
        lines.append(row("DB query max", fmt(db_s["max"])))
    return "\n".join(lines) + "\n"



def main():
    if not LOG_FILE.exists():
        print(f"Log file not found: {LOG_FILE}", file=sys.stderr)
        sys.exit(1)

    print(f"Parsing {LOG_FILE} …")
    phase_times, checker_times, timestamps = parse(LOG_FILE)

    cheap_s  = stats(phase_times.get("cheapPhase", []))
    heavy_s  = stats(phase_times.get("heavyPhase", []))
    brv_data = checker_times.get("Behavior Rate Verification", [])

    span_str = "unknown"
    if len(timestamps) >= 2:
        span_sec = max(timestamps) - min(timestamps)
        t_start  = datetime.fromtimestamp(min(timestamps), tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        t_end    = datetime.fromtimestamp(max(timestamps), tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        span_str = f"{t_start} → {t_end} ({span_sec:.0f}s)"

    total_cheap  = cheap_s.get("n", 0)
    total_heavy  = heavy_s.get("n", 0)
    total_events = sum(len(v) for v in checker_times.values())

    md = []
    md.append("# Bot Detector — Benchmark Report\n")
    md.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  ")
    md.append(f"Based on: `http.stress.test.ts`  ")
    md.append(f"Log file: `{LOG_FILE}`  ")
    md.append(f"Log span: {span_str}  \n")

    md.append("## Summary\n")
    md.append(header("Metric", "Value"))
    md.append(row("cheapPhase requests", f"{total_cheap:,}"))
    md.append(row("heavyPhase requests", f"{total_heavy:,}"))
    md.append(row("total checker events", f"{total_events:,}"))
    md.append(row("unique checkers seen", str(len(checker_times))))
    md.append("")

    md.append("\n## cheapPhase\n")
    md.append("> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).\n")
    md.append(phase_table("cheapPhase", cheap_s))

    md.append("\n## heavyPhase\n")
    md.append("> Checkers that may involve cache lookups (BRV, session, velocity).\n")
    md.append(phase_table("heavyPhase", heavy_s))

    md.append("\n## Behavior Rate Verification (BRV)\n")
    md.append("> Cache-hit path: pure in-memory storage get.  \n")
    md.append("> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).\n")
    md.append(brv_table(brv_data))

    md.append("\n## All Checkers\n")
    md.append(checker_table(checker_times))

    md.append("\n## End-to-End Pipeline Estimate\n")
    md.append("> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.\n")
    if cheap_s and heavy_s:
        e2e_lines = [header("Percentile", "cheapPhase", "heavyPhase", "combined")]
        for label, cp_key, hp_key in [
            ("p50", "p50", "p50"),
            ("p95", "p95", "p95"),
            ("p99", "p99", "p99"),
            ("max", "max", "max"),
            ("avg", "avg", "avg"),
        ]:
            cp = cheap_s[cp_key]
            hp = heavy_s[hp_key]
            e2e_lines.append(row(label, fmt(cp), fmt(hp), fmt(cp + hp)))
        md.append("\n".join(e2e_lines) + "\n")
    else:
        md.append("_Insufficient data_\n")

    output = "\n".join(md)
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(output)
    print(f"Report written to {OUT_FILE}")
    print(f"  cheapPhase:  {total_cheap:,} requests")
    print(f"  heavyPhase:  {total_heavy:,} requests")
    print(f"  BRV cache hit rate: {100*len([t for t in brv_data if t < 1])/len(brv_data):.1f}%" if brv_data else "  BRV: no data")


if __name__ == "__main__":
    main()


#     Bot Detector — System Overview

# What it is

# A Node.js Express middleware library that sits in front of your application routes and makes a real-time binary decision on every HTTP request: is this visitor a bot or a human? It accumulates a threat score from 17 independent signal checkers, bans confirmed bots immediately, and persists all visitor data asynchronously to MySQL without blocking the response.



# It is designed as a drop-in npm package — the consuming application calls configuration() once at startup, then attaches validator() as Express middleware. Everything else is internal.



# Initialization — configuration()

# config.ts



# Called once by the host application before the server starts listening. Runs four tasks in parallel:



# DataSources.initialize() — opens 11 MaxMind .mmdb files and 2 LMDB databases concurrently via Promise.all. All subsequent reads are synchronous memory-mapped lookups — no I/O after this point.



# BatchQueue — instantiates the singleton write queue and registers SIGTERM/SIGINT handlers that call shutdown() to drain pending jobs before the process exits.



# Storage — initializes the unstorage instance (driver is configurable — memory, Redis, filesystem, etc.) used by all caches.



# DB — opens the db0 MySQL connection pool used by BRV (now only for visitor upserts and score writes via BatchQueue) and the reputation system.



# Configuration is validated at the boundary via a Zod schema (configSchema.ts). Every checker's enable flag, every penalty value, and every threshold has a typed default. Invalid input fails at startup, not at request time. Notable constraint: banScore: z.number().max(100) — the ban threshold is capped at 100.



# Data Sources — What's in Memory

# mmdbDataReaders.ts



# DataSources is a class wrapping all readers behind a clean interface. Every lookup method is a synchronous call into a C-level MaxMind binary search tree:



# Database Content

# asn.mmdb BGP/ASN routing data — org name, network, classification

# city.mmdb City, region, lat/lon, timezone, subregion

# country.mmdb Country-level geo + continent

# goodBots.mmdb Known legitimate crawler IP ranges (Googlebot, Bingbot, etc.)

# tor.mmdb Tor node types: exit, guard, web-exit-capable, bad-exit, obsolete

# proxy.mmdb Proxy/VPN/hosting detection with comment/type

# firehol_anonymous.mmdb Anonymizer network operators

# firehol_l1.mmdb Critical active threat feed

# firehol_l2.mmdb Current attack feed

# firehol_l3.mmdb Broader threat aggregation

# firehol_l4.mmdb Extended threat coverage

# banned.mmdb (optional) Previously banned IPs, generated from your own ban DB

# highRisk.mmdb (optional) High-risk IP ranges, generated from your own data

# Two LMDB databases opened alongside:



# useragent.mdb — up to 10,000 UA regex patterns with severity labels (critical, high, medium, low, none). Loaded once into a patterns[] array at startup via loadUaPatterns().

# ja4.mdb — JA4 TLS fingerprint records for TLS-layer bot detection.

# All these are opened with watchForUpdates: true in production — MaxMind's library hot-reloads the memory map when a file changes on disk, enabling live DB refreshes with zero downtime.



# The Middleware — validator()

# canaryCookieChecker.ts



# The exported factory function. Returns an Express RequestHandler. Every request goes through this sequence:



# 1. Canary cookie check

# Reads req.cookies.canary_id. If present, checks visitorCache (keyed canary:{id}). If the cache returns { banned: true } → res.sendStatus(403), return immediately. Zero computation, zero checkers, zero DB. This is the fastest exit for repeat bots.



# If checksTimeRateControl.checkEveryRequest is false and the visitor is in cache as clean → next() immediately. The entire detection pipeline is bypassed for known-clean returning visitors until the cache TTL expires.



# 2. Cookie generation

# If no canary exists, generates a 32-byte cryptographically random hex string (randomBytes(32).toString('hex')), sets it as HttpOnly; SameSite=lax; Secure; path=/; maxAge=90 days. This becomes the visitor's persistent identity token — survives across sessions, browser restarts, and tab closes for 90 days.



# 3. Geo + UA parsing

# getData(ip) — synchronous MaxMind city/country lookup. parseUA(ua) — ua-parser-js parses the User-Agent string into structured browser/device/OS fields. Both are sub-millisecond.



# 4. Visitor upsert queued

# getBatchQueue().addQueue(canary, ip, 'visitor_upsert', { insert: userValidation }, 'deferred') — fired and forgotten. The request does not wait for the DB write. The visitor record (with geo, device, UA fields, first_seen, last_seen, request_count) will be written to MySQL asynchronously.



# 5. Whitelist check

# If the IP is in config.whiteList, skip all detection, cache the visitor as clean, set req.botDetection, call next().



# 6. BRV pre-seed

# Checks rateCache.get(canary). If no entry exists, seeds { score: 0, timestamp: now, request_count: 1 } with TTL = behavioral_window / 1000 seconds. This means BRV's checker will always find a cache entry — the MySQL cold-path in BRV is structurally unreachable.



# 7. Bot detection

# uaAndGeoBotDetector() — the main pipeline. Runs cheapPhase, then heavyPhase if score hasn't reached banScore.



# 8. Result handling

# visitorCache.set(canary, { banned: isBot, visitor_id }) — caches the result for the fast-path on next request. If bot: res.sendStatus(403). If clean: req.botDetection is populated, next() is called, userReputation() is fired as a void promise.



# The Detection Pipeline — uaAndGeoBotDetector()

# botDetector.ts



# Before phases run, all MMDB databases are queried synchronously to build a ValidationContext snapshot:





# threatLevel ← fireholLvl1-4 checked in priority order

# tor ← torDataBase(ip)

# asn ← asnDataBase(ip)

# anon ← fireholAnonDataBase(ip)

# proxy ← proxyDataBase(ip)

# This context object is passed to every checker. No checker queries a database directly — they all read from this pre-built snapshot. The only exceptions are BRV (storage cache), Session Coherence (storage cache), Velocity Fingerprint (storage cache), and Reputation (storage cache).



# Then:





# cheapPhase → if botScore < banScore → heavyPhase

# processChecks() (processChecks.ts) runs each phase. It iterates checkers sequentially, accumulating score. After each checker it checks:



# If reasons contains GOOD_BOT_IDENTIFIED → throw GoodBotDetected → immediate allow, no further processing

# If reasons contains BAD_BOT_DETECTED → throw BadBotDetected → immediate ban, no further processing

# If botScore >= banScore → break — remaining checkers are skipped

# Every checker start/end is logged with durationMs, score, and reasons — this is the data the benchmark script consumes.



# After phases complete, if botScore >= banScore:



# banIp(ipAddress, bannedInfo) — writes to the in-process banned IP set

# Two addQueue calls: update_banned_ip and is_bot_update — both deferred

# Checker Registry

# CheckerRegistry.ts



# A module-level array. Each checker file self-registers via CheckerRegistry.register(new XyzChecker()) at import time. The registry side-effect imports in index.ts ensure all 17 checkers are loaded when botDetector.ts imports the index.



# getEnabled(phase, config) filters by checker.phase === phase && checker.isEnabled(config) — checkers that are disabled in config are cleanly excluded from the run loop without any conditional branching inside the checkers themselves.



# Cheap Phase Checkers (11 total — all synchronous)

# Bad User Agent list — LMDB regex scan. Iterates the patterns[] array (up to 10k entries, loaded once at startup) against the raw User-Agent string. First match wins. Severity maps to penalty: critical=100, high=80, medium=30, low=10. A critical match immediately pushes score to banScore.



# IP Validation — Rejects private/reserved/loopback IPs. Prevents spoofed internal addresses from bypassing geo checks.



# Good/Bad Bot Verification — Queries goodBotsDataBase(ip). If the IP is a known legitimate crawler: throws GoodBotDetected (early allow). If it's a bot IP but not in the good list and banUnlistedBots=true: throws BadBotDetected (immediate ban).



# Browser and Device Verification — Inspects the parsed UA for: CLI/library clients (cliOrLibrary=100), Internet Explorer (=100), impossible browser/OS combinations (=30), unknown browser type/name/version, unknown device vendor/model, desktop UA without an OS.



# Locale and Country Verification — Compares Accept-Language header against the IP's geo country. Mismatch scores ipAndHeaderMismatch. Also penalizes missing/malformed Accept-Language headers.



# Known ThreatLevels (FireholEscalation) — Uses the pre-built threatLevel from context (1–4). Level 1 = critical (40pts), level 2 = current attacks (30pts), level 3/4 progressively lower. Also penalizes anonymous network membership.



# ASN Classification — Checks the BGP ASN type. Datacenter/hosting ASNs score higher. Low-visibility ASNs (few IP allocations) score an additional penalty. Combined hosting+low-visibility stacks both.



# Tor Node Analysis — Inspects Tor node flags: exit node, guard, web-exit-capable, bad-exit, obsolete version. Each has an independent penalty that accumulates.



# Timezone Consistency — Reads a timezone header sent by the client (if present) and compares against the IP's geo timezone. Mismatch = penalty.



# Honeypot Path — Checks if the request path matches any configured honeypot paths. Any hit is an automatic penalty.



# KnownBadIps — Queries bannedDataBase(ip) and highRiskDataBase(ip). If either returns a record, applies a highRiskPenalty.



# Heavy Phase Checkers (6 total — storage + header analysis)

# Behavior Rate Verification (rateTracker.ts)

# Purely cache-driven after the middleware pre-seed. Reads rateCache.get(canary). If within behavioral_window: increments request_count, checks against behavioral_threshold. Above threshold → BEHAVIOR_TOO_FAST + penalties. The TTL on every rateCache.set is set to ceil(behavioral_window / 1000) seconds — storage expiry and window expiry are always synchronized. No MySQL queries are made from this checker.



# Proxy, ISP and Cookie Verification — Combines proxy/VPN detection, hosting provider classification, ISP/org name analysis, and cookie presence signals. Missing cookie on a request that should have one (cookieMissing=80). Proxy detected (proxyDetected=40). Hosting ASN (hostingDetected=50). Unknown ISP/org gets smaller penalties. Multi-source corroboration (2–3 signals, 4+ signals) applies bonus multipliers.



# User Agent and Header Verification — The deepest header analysis. Checks for headless browser indicators in the UA. Scores short/truncated UAs. For Blink-engine browsers: verifies client hints headers are present, penalizes unexpected TE headers. For Gecko: opposite — unexpected client hints, missing TE penalized. Also checks: missing Accept header, Cache-Control: no-cache on GET, Sec-Fetch-Mode inconsistency, Origin: null, missing referer on cross-site, Connection: close, Postman/Insomnia header combinations, host header mismatch.



# Geo-Location Verification — Inspects the MaxMind city record for completeness: missing lat/lon, missing district, city, region, subregion, continent, timezone, phone code. Each missing field is a small independent penalty. Heavily incomplete geo data is a strong bot signal — legitimate residential ISPs provide complete geo records.



# Session Coherence — Reads sessionCache.get(canary) to retrieve the visitor's last visited path. Checks: missing referer on navigation requests (missingReferer=20), referer domain mismatch (domainMismatch=30), path inconsistency between stored last path and current referer (pathMismatch=10). Updates the session cache after evaluation.



# Velocity Fingerprinting — Reads timingCache to retrieve inter-request timing history for this canary. Computes the coefficient of variation (stddev / mean) of request intervals. Human browsing has high CV — irregular, unpredictable timing. Bot traffic has low CV — mechanically uniform intervals. Below cvThreshold (default 0.1) = VELOCITY_FINGERPRINT_TOO_UNIFORM + penalty.



# BatchQueue — Async Write Pipeline

# batchQueue.ts



# All MySQL writes go through here. Never blocks a request. The queue is a Map<string, BatchJob> keyed by "type:canary:ip" — inserting the same key twice overwrites, so duplicate updates for the same visitor within a flush window collapse into one write.



# Job types, in execution order within executeBatch():



# visitor_upsert — INSERT/UPSERT into visitors (runs first to satisfy FK constraints)

# score_update — UPDATE visitors.suspicious_activity_score

# is_bot_update — UPDATE visitors.is_bot = true

# update_banned_ip — INSERT into banned

# Flush triggers:



# priority: 'immediate' on addQueue — blocks until flushed (not currently used in the hot path)

# jobs.size >= maxBufferSize (default 100) — automatic flush

# Timer every flushIntervalMs (default 5,000ms) — background drain

# shutdown() on SIGTERM/SIGINT — drains everything before process exits

# The while loop in flush() prevents a race condition where competing voided addQueue continuations could each start independent flush promises after the first completes. flush() only returns when both flushPromise === null AND jobs.size === 0 are simultaneously true.



# Retry logic in executeBatch() retries only the original batch snapshot on failure (up to maxRetries, default 3, with 1s delay). New jobs queued during a retry are not absorbed — they wait in this.jobs for the next flush cycle.



# Caching Architecture

# Six independent caches, all backed by unstorage with configurable drivers (memory, Redis, filesystem):



# Cache Key prefix TTL Stores

# visitorCache canary: none { banned, visitor_id } — fast-path result

# reputationCache rep: none { isBot, score } — prevents re-scoring known visitors

# rateCache rate: = behavioral_window { score, timestamp, request_count } — BRV window state

# sessionCache session: 10 min { lastPath } — session coherence state

# timingCache (in velocityFingerprint) — timing history array per canary

# dnsLookupCache — — DNS reverse lookup memoization

# The rateCache TTL is now driven by behavioral_window from config — they're always in sync. A storage expiry and a window expiry are equivalent events.



# Reputation Healer

# reputation.ts



# Fires as a non-blocking void promise after every clean request. Reads reputationCache.get(canary). If a score exists and 0 < score < banScore: subtracts restoredReputationPoints (default 10) and writes the lower value back to both cache and DB via addQueue.



# This implements score decay — a visitor who scored 60 from suspicious signals (partial proxy, minor header issues, incomplete geo) will have their score healed toward 0 over subsequent clean requests. The speed of healing is tunable via restoredReputationPoints.



# setNewComputedScore in config controls the interaction:



# false (default — snapshot-then-heal): detector writes score once on first visit. The healer owns subsequent DB updates. Score can only go down until cache expires.

# true (live snapshot): every request recalculates and overwrites the score. The healer runs afterward. Score oscillates between computed and healed values. Useful when you want the live risk snapshot always visible in the DB.

# Schema — what gets persisted

# schema.ts



# Two primary tables:



# visitors — one row per canary. Tracks: canary_id, ip_address, user_agent, device_type, browser, browser_version, browserType, os, deviceVendor, deviceModel, country, region, city, lat, lon, timezone, is_bot, request_count, first_seen, last_seen, suspicious_activity_score, activity_score.



# banned — one row per banned canary. Tracks: canary_id, ip_address, country, user_agent, reason (JSON array of BanReasonCode[]), banned_at, score.



# banned.canary_id references visitors.canary_id — this FK is why executeBatch always runs visitor upserts before banned inserts.



# Test Suite

# 7 stress tests + 9 unit tests, all passing:



# Stress tests (http.stress.test.ts) use a real Express app backed by a real MySQL instance in Docker. They test the full middleware stack end-to-end:



# 300 concurrent clean requests — zero bans

# 300 unique bot IPs with known-bad UAs — all blocked, all written to banned

# Each banned row has a non-empty reason JSON array

# 300 rapid requests from one IP — no crashes, valid statuses throughout

# Mixed bot/clean traffic — correct binary separation

# 5 returning visitors breaching behavioral_threshold — all banned with BEHAVIOR_TOO_FAST

# 100 visitors × 5 req/sec × 3 seconds under default threshold — zero false positives

# Unit tests (rateTracker.test.ts) test BehavioralDbChecker in isolation with a real storage instance but no DB dependency — all paths are now fully cache-driven. No insertVisitor / deleteVisitor needed. # 