# Bot Detector — Benchmark Report

Generated on: 2026-06-18 12:01:16  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-06-18 12:00:27 UTC → 2026-06-18 12:01:10 UTC (43s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,240 |
| heavyPhase requests | 7,386 |
| total checker events | 125,224 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,240 |
| min | 0.070ms |
| p50 | 0.215ms |
| p75 | 0.261ms |
| p95 | 0.306ms |
| p99 | 0.353ms |
| max | 3.165ms |
| avg | 0.216ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,386 |
| min | 1.115ms |
| p50 | 1.434ms |
| p75 | 1.541ms |
| p95 | 1.837ms |
| p99 | 2.240ms |
| max | 24.7ms |
| avg | 1.493ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,386 |
| min | 0.022ms |
| p50 | 0.027ms |
| p75 | 0.029ms |
| p95 | 0.040ms |
| p99 | 0.055ms |
| max | 0.750ms |
| avg | 0.029ms |
|  |  |
| cache hits (<1ms) | 7,386 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,240 | 0.012ms | 0.019ms | 0.033ms | 0.163ms | 0.012ms |
| Good/Bad Bot Verification | cheap | 9,240 | 0.008ms | 0.015ms | 0.029ms | 0.191ms | 0.010ms |
| Browser and Device Verification | cheap | 9,240 | 0.009ms | 0.015ms | 0.028ms | 0.155ms | 0.010ms |
| Locale and Country Verification | cheap | 8,950 | 0.017ms | 0.030ms | 0.045ms | 0.541ms | 0.018ms |
| Known ThreatLevels | cheap | 8,950 | 0.006ms | 0.012ms | 0.025ms | 0.115ms | 0.008ms |
| ASN Classification | cheap | 7,386 | 0.007ms | 0.013ms | 0.027ms | 0.178ms | 0.008ms |
| Tor Node Analysis | cheap | 7,386 | 0.006ms | 0.012ms | 0.023ms | 0.127ms | 0.008ms |
| Timezone Consistency | cheap | 7,386 | 0.007ms | 0.013ms | 0.024ms | 0.093ms | 0.008ms |
| Honeypot Path | cheap | 7,386 | 0.006ms | 0.011ms | 0.022ms | 0.061ms | 0.007ms |
| KnownBadIps | cheap | 7,386 | 0.009ms | 0.017ms | 0.030ms | 0.182ms | 0.011ms |
| Behavior Rate Verification | heavy | 7,386 | 0.027ms | 0.040ms | 0.055ms | 0.750ms | 0.029ms |
| Proxy, ISP and Cookie Verification | heavy | 7,381 | 0.007ms | 0.011ms | 0.017ms | 0.127ms | 0.007ms |
| User agent and Header Verification | heavy | 7,381 | 0.129ms | 0.180ms | 0.217ms | 2.929ms | 0.137ms |
| Geo-Location Verification | heavy | 4,380 | 0.008ms | 0.012ms | 0.022ms | 0.183ms | 0.009ms |
| Session Coherence | heavy | 4,380 | 0.024ms | 0.039ms | 0.057ms | 0.339ms | 0.025ms |
| Velocity Fingerprinting | heavy | 4,380 | 0.017ms | 0.029ms | 0.045ms | 0.219ms | 0.018ms |
| Bad User Agent list | heavy | 7,386 | 1.138ms | 1.507ms | 1.827ms | 19.8ms | 1.197ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.215ms | 1.434ms | 1.649ms |
| p95 | 0.306ms | 1.837ms | 2.143ms |
| p99 | 0.353ms | 2.240ms | 2.593ms |
| max | 3.165ms | 24.7ms | 27.8ms |
| avg | 0.216ms | 1.493ms | 1.709ms |
