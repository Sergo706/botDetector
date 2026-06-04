# Bot Detector — Benchmark Report

Generated on: 2026-06-04 13:48:01  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-06-04 13:47:12 UTC → 2026-06-04 13:47:55 UTC (43s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,238 |
| heavyPhase requests | 7,384 |
| total checker events | 125,190 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,238 |
| min | 0.075ms |
| p50 | 0.244ms |
| p75 | 0.307ms |
| p95 | 0.377ms |
| p99 | 0.444ms |
| max | 2.478ms |
| avg | 0.247ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,384 |
| min | 0.986ms |
| p50 | 1.329ms |
| p75 | 1.448ms |
| p95 | 1.724ms |
| p99 | 2.210ms |
| max | 23.1ms |
| avg | 1.388ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,384 |
| min | 0.022ms |
| p50 | 0.026ms |
| p75 | 0.028ms |
| p95 | 0.042ms |
| p99 | 0.059ms |
| max | 0.616ms |
| avg | 0.029ms |
|  |  |
| cache hits (<1ms) | 7,384 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,238 | 0.011ms | 0.021ms | 0.039ms | 0.153ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,238 | 0.009ms | 0.018ms | 0.037ms | 0.208ms | 0.011ms |
| Browser and Device Verification | cheap | 9,238 | 0.008ms | 0.018ms | 0.036ms | 0.422ms | 0.011ms |
| Locale and Country Verification | cheap | 8,948 | 0.018ms | 0.034ms | 0.053ms | 0.570ms | 0.020ms |
| Known ThreatLevels | cheap | 8,948 | 0.007ms | 0.016ms | 0.032ms | 0.097ms | 0.009ms |
| ASN Classification | cheap | 7,384 | 0.007ms | 0.016ms | 0.032ms | 0.097ms | 0.009ms |
| Tor Node Analysis | cheap | 7,384 | 0.006ms | 0.015ms | 0.032ms | 0.120ms | 0.009ms |
| Timezone Consistency | cheap | 7,384 | 0.008ms | 0.017ms | 0.030ms | 0.106ms | 0.010ms |
| Honeypot Path | cheap | 7,384 | 0.006ms | 0.015ms | 0.028ms | 0.181ms | 0.009ms |
| KnownBadIps | cheap | 7,384 | 0.010ms | 0.021ms | 0.039ms | 0.126ms | 0.013ms |
| Behavior Rate Verification | heavy | 7,384 | 0.026ms | 0.042ms | 0.059ms | 0.616ms | 0.029ms |
| Proxy, ISP and Cookie Verification | heavy | 7,379 | 0.007ms | 0.014ms | 0.022ms | 0.120ms | 0.008ms |
| User agent and Header Verification | heavy | 7,379 | 0.126ms | 0.173ms | 0.204ms | 3.210ms | 0.133ms |
| Geo-Location Verification | heavy | 4,378 | 0.008ms | 0.016ms | 0.028ms | 0.176ms | 0.009ms |
| Session Coherence | heavy | 4,378 | 0.025ms | 0.041ms | 0.058ms | 0.355ms | 0.027ms |
| Velocity Fingerprinting | heavy | 4,378 | 0.018ms | 0.032ms | 0.049ms | 0.239ms | 0.019ms |
| Bad User Agent list | heavy | 7,384 | 1.028ms | 1.397ms | 1.811ms | 18.4ms | 1.085ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.244ms | 1.329ms | 1.573ms |
| p95 | 0.377ms | 1.724ms | 2.101ms |
| p99 | 0.444ms | 2.210ms | 2.654ms |
| max | 2.478ms | 23.1ms | 25.6ms |
| avg | 0.247ms | 1.388ms | 1.635ms |
