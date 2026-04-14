# Bot Detector — Benchmark Report

Generated on: 2026-04-14 09:00:02  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-04-14 08:59:15 UTC → 2026-04-14 08:59:57 UTC (41s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,235 |
| heavyPhase requests | 7,381 |
| total checker events | 125,139 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,235 |
| min | 0.071ms |
| p50 | 0.240ms |
| p75 | 0.298ms |
| p95 | 0.363ms |
| p99 | 0.418ms |
| max | 2.791ms |
| avg | 0.241ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,381 |
| min | 0.988ms |
| p50 | 1.330ms |
| p75 | 1.462ms |
| p95 | 1.742ms |
| p99 | 2.237ms |
| max | 22.4ms |
| avg | 1.389ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,381 |
| min | 0.022ms |
| p50 | 0.026ms |
| p75 | 0.028ms |
| p95 | 0.039ms |
| p99 | 0.055ms |
| max | 0.606ms |
| avg | 0.028ms |
|  |  |
| cache hits (<1ms) | 7,381 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,235 | 0.011ms | 0.018ms | 0.039ms | 0.166ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,235 | 0.009ms | 0.016ms | 0.034ms | 0.196ms | 0.011ms |
| Browser and Device Verification | cheap | 9,235 | 0.008ms | 0.017ms | 0.035ms | 0.153ms | 0.011ms |
| Locale and Country Verification | cheap | 8,945 | 0.017ms | 0.032ms | 0.050ms | 0.576ms | 0.019ms |
| Known ThreatLevels | cheap | 8,945 | 0.007ms | 0.014ms | 0.033ms | 0.095ms | 0.009ms |
| ASN Classification | cheap | 7,381 | 0.007ms | 0.015ms | 0.032ms | 0.095ms | 0.009ms |
| Tor Node Analysis | cheap | 7,381 | 0.006ms | 0.014ms | 0.032ms | 0.115ms | 0.009ms |
| Timezone Consistency | cheap | 7,381 | 0.007ms | 0.015ms | 0.032ms | 0.096ms | 0.009ms |
| Honeypot Path | cheap | 7,381 | 0.006ms | 0.013ms | 0.027ms | 0.073ms | 0.008ms |
| KnownBadIps | cheap | 7,381 | 0.010ms | 0.020ms | 0.037ms | 0.122ms | 0.013ms |
| Behavior Rate Verification | heavy | 7,381 | 0.026ms | 0.039ms | 0.055ms | 0.606ms | 0.028ms |
| Proxy, ISP and Cookie Verification | heavy | 7,376 | 0.007ms | 0.013ms | 0.020ms | 0.144ms | 0.008ms |
| User agent and Header Verification | heavy | 7,376 | 0.114ms | 0.162ms | 0.191ms | 2.809ms | 0.124ms |
| Geo-Location Verification | heavy | 4,375 | 0.008ms | 0.015ms | 0.022ms | 0.198ms | 0.009ms |
| Session Coherence | heavy | 4,375 | 0.025ms | 0.040ms | 0.056ms | 0.306ms | 0.026ms |
| Velocity Fingerprinting | heavy | 4,375 | 0.017ms | 0.029ms | 0.046ms | 0.230ms | 0.018ms |
| Bad User Agent list | heavy | 7,381 | 1.038ms | 1.431ms | 1.840ms | 17.9ms | 1.098ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.240ms | 1.330ms | 1.570ms |
| p95 | 0.363ms | 1.742ms | 2.105ms |
| p99 | 0.418ms | 2.237ms | 2.655ms |
| max | 2.791ms | 22.4ms | 25.2ms |
| avg | 0.241ms | 1.389ms | 1.631ms |
