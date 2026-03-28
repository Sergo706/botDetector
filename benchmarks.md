# Bot Detector — Benchmark Report

Generated on: 2026-03-28 15:22:41  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-28 15:21:53 UTC → 2026-03-28 15:22:34 UTC (42s)  

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
| min | 0.068ms |
| p50 | 0.233ms |
| p75 | 0.296ms |
| p95 | 0.369ms |
| p99 | 0.442ms |
| max | 2.534ms |
| avg | 0.240ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,384 |
| min | 1.002ms |
| p50 | 1.352ms |
| p75 | 1.505ms |
| p95 | 1.813ms |
| p99 | 2.277ms |
| max | 24.3ms |
| avg | 1.418ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,384 |
| min | 0.021ms |
| p50 | 0.026ms |
| p75 | 0.030ms |
| p95 | 0.042ms |
| p99 | 0.059ms |
| max | 0.798ms |
| avg | 0.029ms |
|  |  |
| cache hits (<1ms) | 7,384 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,238 | 0.011ms | 0.019ms | 0.037ms | 0.197ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,238 | 0.008ms | 0.016ms | 0.034ms | 0.196ms | 0.010ms |
| Browser and Device Verification | cheap | 9,238 | 0.008ms | 0.017ms | 0.035ms | 0.167ms | 0.010ms |
| Locale and Country Verification | cheap | 8,948 | 0.018ms | 0.033ms | 0.052ms | 0.601ms | 0.020ms |
| Known ThreatLevels | cheap | 8,948 | 0.007ms | 0.014ms | 0.031ms | 0.098ms | 0.009ms |
| ASN Classification | cheap | 7,384 | 0.007ms | 0.014ms | 0.031ms | 0.143ms | 0.009ms |
| Tor Node Analysis | cheap | 7,384 | 0.006ms | 0.014ms | 0.030ms | 0.121ms | 0.008ms |
| Timezone Consistency | cheap | 7,384 | 0.008ms | 0.016ms | 0.026ms | 0.341ms | 0.009ms |
| Honeypot Path | cheap | 7,384 | 0.006ms | 0.013ms | 0.029ms | 0.093ms | 0.008ms |
| KnownBadIps | cheap | 7,384 | 0.010ms | 0.020ms | 0.038ms | 0.158ms | 0.013ms |
| Behavior Rate Verification | heavy | 7,384 | 0.026ms | 0.042ms | 0.059ms | 0.798ms | 0.029ms |
| Proxy, ISP and Cookie Verification | heavy | 7,379 | 0.007ms | 0.014ms | 0.018ms | 0.131ms | 0.008ms |
| User agent and Header Verification | heavy | 7,379 | 0.126ms | 0.181ms | 0.217ms | 3.125ms | 0.134ms |
| Geo-Location Verification | heavy | 4,378 | 0.008ms | 0.015ms | 0.026ms | 0.180ms | 0.009ms |
| Session Coherence | heavy | 4,378 | 0.025ms | 0.041ms | 0.058ms | 0.373ms | 0.027ms |
| Velocity Fingerprinting | heavy | 4,378 | 0.017ms | 0.031ms | 0.048ms | 0.241ms | 0.019ms |
| Bad User Agent list | heavy | 7,384 | 1.046ms | 1.469ms | 1.840ms | 19.2ms | 1.111ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.233ms | 1.352ms | 1.585ms |
| p95 | 0.369ms | 1.813ms | 2.182ms |
| p99 | 0.442ms | 2.277ms | 2.719ms |
| max | 2.534ms | 24.3ms | 26.9ms |
| avg | 0.240ms | 1.418ms | 1.658ms |
