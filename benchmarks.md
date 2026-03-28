# Bot Detector — Benchmark Report

Generated on: 2026-03-28 16:37:50  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-28 16:37:03 UTC → 2026-03-28 16:37:44 UTC (41s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,229 |
| heavyPhase requests | 7,375 |
| total checker events | 125,037 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,229 |
| min | 0.069ms |
| p50 | 0.240ms |
| p75 | 0.302ms |
| p95 | 0.380ms |
| p99 | 0.456ms |
| max | 5.337ms |
| avg | 0.246ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,375 |
| min | 0.969ms |
| p50 | 1.358ms |
| p75 | 1.528ms |
| p95 | 1.807ms |
| p99 | 2.251ms |
| max | 22.4ms |
| avg | 1.422ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,375 |
| min | 0.021ms |
| p50 | 0.026ms |
| p75 | 0.028ms |
| p95 | 0.042ms |
| p99 | 0.058ms |
| max | 0.658ms |
| avg | 0.028ms |
|  |  |
| cache hits (<1ms) | 7,375 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,229 | 0.011ms | 0.020ms | 0.039ms | 0.171ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,229 | 0.008ms | 0.018ms | 0.035ms | 0.175ms | 0.011ms |
| Browser and Device Verification | cheap | 9,229 | 0.008ms | 0.018ms | 0.036ms | 0.310ms | 0.011ms |
| Locale and Country Verification | cheap | 8,939 | 0.017ms | 0.035ms | 0.052ms | 1.555ms | 0.020ms |
| Known ThreatLevels | cheap | 8,939 | 0.007ms | 0.016ms | 0.034ms | 0.317ms | 0.009ms |
| ASN Classification | cheap | 7,375 | 0.007ms | 0.015ms | 0.032ms | 0.570ms | 0.009ms |
| Tor Node Analysis | cheap | 7,375 | 0.006ms | 0.015ms | 0.029ms | 0.116ms | 0.009ms |
| Timezone Consistency | cheap | 7,375 | 0.007ms | 0.016ms | 0.033ms | 0.099ms | 0.009ms |
| Honeypot Path | cheap | 7,375 | 0.006ms | 0.014ms | 0.030ms | 0.069ms | 0.008ms |
| KnownBadIps | cheap | 7,375 | 0.010ms | 0.021ms | 0.039ms | 0.259ms | 0.013ms |
| Behavior Rate Verification | heavy | 7,375 | 0.026ms | 0.042ms | 0.058ms | 0.658ms | 0.028ms |
| Proxy, ISP and Cookie Verification | heavy | 7,370 | 0.007ms | 0.014ms | 0.020ms | 0.115ms | 0.008ms |
| User agent and Header Verification | heavy | 7,370 | 0.117ms | 0.170ms | 0.203ms | 2.734ms | 0.127ms |
| Geo-Location Verification | heavy | 4,369 | 0.008ms | 0.016ms | 0.031ms | 0.162ms | 0.010ms |
| Session Coherence | heavy | 4,369 | 0.024ms | 0.042ms | 0.059ms | 0.310ms | 0.026ms |
| Velocity Fingerprinting | heavy | 4,369 | 0.017ms | 0.033ms | 0.053ms | 0.278ms | 0.019ms |
| Bad User Agent list | heavy | 7,375 | 1.058ms | 1.475ms | 1.846ms | 17.8ms | 1.124ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.240ms | 1.358ms | 1.598ms |
| p95 | 0.380ms | 1.807ms | 2.187ms |
| p99 | 0.456ms | 2.251ms | 2.707ms |
| max | 5.337ms | 22.4ms | 27.7ms |
| avg | 0.246ms | 1.422ms | 1.669ms |
