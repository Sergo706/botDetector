# Bot Detector — Benchmark Report

Generated on: 2026-03-28 16:24:02  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-28 16:23:16 UTC → 2026-03-28 16:23:56 UTC (39s)  

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
| min | 0.067ms |
| p50 | 0.211ms |
| p75 | 0.263ms |
| p95 | 0.330ms |
| p99 | 0.371ms |
| max | 2.035ms |
| avg | 0.218ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,381 |
| min | 0.947ms |
| p50 | 1.248ms |
| p75 | 1.351ms |
| p95 | 1.637ms |
| p99 | 1.949ms |
| max | 21.2ms |
| avg | 1.306ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,381 |
| min | 0.019ms |
| p50 | 0.026ms |
| p75 | 0.028ms |
| p95 | 0.038ms |
| p99 | 0.048ms |
| max | 0.707ms |
| avg | 0.027ms |
|  |  |
| cache hits (<1ms) | 7,381 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,235 | 0.011ms | 0.019ms | 0.029ms | 0.103ms | 0.012ms |
| Good/Bad Bot Verification | cheap | 9,235 | 0.008ms | 0.015ms | 0.024ms | 0.138ms | 0.010ms |
| Browser and Device Verification | cheap | 9,235 | 0.008ms | 0.015ms | 0.024ms | 0.132ms | 0.010ms |
| Locale and Country Verification | cheap | 8,945 | 0.018ms | 0.032ms | 0.042ms | 0.494ms | 0.019ms |
| Known ThreatLevels | cheap | 8,945 | 0.006ms | 0.012ms | 0.022ms | 0.118ms | 0.008ms |
| ASN Classification | cheap | 7,381 | 0.006ms | 0.013ms | 0.023ms | 0.086ms | 0.008ms |
| Tor Node Analysis | cheap | 7,381 | 0.006ms | 0.012ms | 0.021ms | 0.102ms | 0.008ms |
| Timezone Consistency | cheap | 7,381 | 0.007ms | 0.014ms | 0.022ms | 0.069ms | 0.008ms |
| Honeypot Path | cheap | 7,381 | 0.006ms | 0.011ms | 0.020ms | 0.053ms | 0.007ms |
| KnownBadIps | cheap | 7,381 | 0.009ms | 0.018ms | 0.028ms | 0.103ms | 0.011ms |
| Behavior Rate Verification | heavy | 7,381 | 0.026ms | 0.038ms | 0.048ms | 0.707ms | 0.027ms |
| Proxy, ISP and Cookie Verification | heavy | 7,376 | 0.007ms | 0.011ms | 0.017ms | 0.113ms | 0.007ms |
| User agent and Header Verification | heavy | 7,376 | 0.134ms | 0.175ms | 0.208ms | 2.769ms | 0.139ms |
| Geo-Location Verification | heavy | 4,375 | 0.008ms | 0.013ms | 0.021ms | 0.164ms | 0.008ms |
| Session Coherence | heavy | 4,375 | 0.023ms | 0.037ms | 0.050ms | 0.280ms | 0.024ms |
| Velocity Fingerprinting | heavy | 4,375 | 0.017ms | 0.027ms | 0.039ms | 0.300ms | 0.017ms |
| Bad User Agent list | heavy | 7,381 | 0.962ms | 1.330ms | 1.556ms | 16.7ms | 1.016ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.211ms | 1.248ms | 1.459ms |
| p95 | 0.330ms | 1.637ms | 1.967ms |
| p99 | 0.371ms | 1.949ms | 2.320ms |
| max | 2.035ms | 21.2ms | 23.2ms |
| avg | 0.218ms | 1.306ms | 1.524ms |
