# Bot Detector — Benchmark Report

Generated on: 2026-03-29 13:17:18  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-29 13:16:28 UTC → 2026-03-29 13:17:12 UTC (43s)  

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
| p50 | 0.254ms |
| p75 | 0.325ms |
| p95 | 0.409ms |
| p99 | 0.480ms |
| max | 2.502ms |
| avg | 0.262ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,386 |
| min | 0.986ms |
| p50 | 1.381ms |
| p75 | 1.549ms |
| p95 | 1.854ms |
| p99 | 2.347ms |
| max | 23.0ms |
| avg | 1.450ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,386 |
| min | 0.022ms |
| p50 | 0.029ms |
| p75 | 0.034ms |
| p95 | 0.049ms |
| p99 | 0.065ms |
| max | 0.683ms |
| avg | 0.032ms |
|  |  |
| cache hits (<1ms) | 7,386 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,240 | 0.013ms | 0.024ms | 0.043ms | 0.122ms | 0.015ms |
| Good/Bad Bot Verification | cheap | 9,240 | 0.009ms | 0.019ms | 0.037ms | 0.192ms | 0.012ms |
| Browser and Device Verification | cheap | 9,240 | 0.009ms | 0.020ms | 0.039ms | 0.166ms | 0.012ms |
| Locale and Country Verification | cheap | 8,950 | 0.020ms | 0.040ms | 0.057ms | 1.447ms | 0.023ms |
| Known ThreatLevels | cheap | 8,950 | 0.007ms | 0.017ms | 0.034ms | 0.222ms | 0.010ms |
| ASN Classification | cheap | 7,386 | 0.007ms | 0.017ms | 0.035ms | 0.198ms | 0.010ms |
| Tor Node Analysis | cheap | 7,386 | 0.007ms | 0.016ms | 0.034ms | 0.344ms | 0.009ms |
| Timezone Consistency | cheap | 7,386 | 0.008ms | 0.017ms | 0.033ms | 0.477ms | 0.010ms |
| Honeypot Path | cheap | 7,386 | 0.006ms | 0.015ms | 0.033ms | 0.252ms | 0.009ms |
| KnownBadIps | cheap | 7,386 | 0.011ms | 0.024ms | 0.043ms | 0.132ms | 0.014ms |
| Behavior Rate Verification | heavy | 7,386 | 0.029ms | 0.049ms | 0.065ms | 0.683ms | 0.032ms |
| Proxy, ISP and Cookie Verification | heavy | 7,381 | 0.008ms | 0.015ms | 0.028ms | 0.588ms | 0.009ms |
| User agent and Header Verification | heavy | 7,381 | 0.141ms | 0.204ms | 0.248ms | 3.469ms | 0.148ms |
| Geo-Location Verification | heavy | 4,380 | 0.009ms | 0.018ms | 0.033ms | 0.188ms | 0.011ms |
| Session Coherence | heavy | 4,380 | 0.027ms | 0.048ms | 0.065ms | 0.371ms | 0.029ms |
| Velocity Fingerprinting | heavy | 4,380 | 0.019ms | 0.036ms | 0.054ms | 0.230ms | 0.021ms |
| Bad User Agent list | heavy | 7,386 | 1.044ms | 1.487ms | 1.849ms | 18.0ms | 1.117ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.254ms | 1.381ms | 1.635ms |
| p95 | 0.409ms | 1.854ms | 2.263ms |
| p99 | 0.480ms | 2.347ms | 2.827ms |
| max | 2.502ms | 23.0ms | 25.5ms |
| avg | 0.262ms | 1.450ms | 1.712ms |
