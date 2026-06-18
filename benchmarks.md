# Bot Detector — Benchmark Report

Generated on: 2026-06-18 17:34:42  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-06-18 17:34:00 UTC → 2026-06-18 17:34:36 UTC (36s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,217 |
| heavyPhase requests | 7,363 |
| total checker events | 124,833 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,217 |
| min | 0.051ms |
| p50 | 0.140ms |
| p75 | 0.173ms |
| p95 | 0.212ms |
| p99 | 0.243ms |
| max | 1.673ms |
| avg | 0.145ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,363 |
| min | 0.886ms |
| p50 | 1.098ms |
| p75 | 1.214ms |
| p95 | 1.414ms |
| p99 | 1.725ms |
| max | 18.5ms |
| avg | 1.145ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,363 |
| min | 0.017ms |
| p50 | 0.021ms |
| p75 | 0.023ms |
| p95 | 0.030ms |
| p99 | 0.042ms |
| max | 0.539ms |
| avg | 0.022ms |
|  |  |
| cache hits (<1ms) | 7,363 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,217 | 0.007ms | 0.012ms | 0.019ms | 0.087ms | 0.008ms |
| Good/Bad Bot Verification | cheap | 9,217 | 0.005ms | 0.009ms | 0.012ms | 0.136ms | 0.006ms |
| Browser and Device Verification | cheap | 9,217 | 0.005ms | 0.009ms | 0.012ms | 0.123ms | 0.006ms |
| Locale and Country Verification | cheap | 8,927 | 0.012ms | 0.020ms | 0.030ms | 0.403ms | 0.012ms |
| Known ThreatLevels | cheap | 8,927 | 0.005ms | 0.008ms | 0.010ms | 0.143ms | 0.005ms |
| ASN Classification | cheap | 7,363 | 0.005ms | 0.008ms | 0.011ms | 0.071ms | 0.006ms |
| Tor Node Analysis | cheap | 7,363 | 0.005ms | 0.008ms | 0.010ms | 0.083ms | 0.005ms |
| Timezone Consistency | cheap | 7,363 | 0.005ms | 0.009ms | 0.012ms | 0.242ms | 0.006ms |
| Honeypot Path | cheap | 7,363 | 0.004ms | 0.008ms | 0.010ms | 0.043ms | 0.005ms |
| KnownBadIps | cheap | 7,363 | 0.006ms | 0.011ms | 0.016ms | 0.121ms | 0.008ms |
| Behavior Rate Verification | heavy | 7,363 | 0.021ms | 0.030ms | 0.042ms | 0.539ms | 0.022ms |
| Proxy, ISP and Cookie Verification | heavy | 7,358 | 0.005ms | 0.008ms | 0.012ms | 0.095ms | 0.006ms |
| User agent and Header Verification | heavy | 7,358 | 0.103ms | 0.139ms | 0.170ms | 2.183ms | 0.108ms |
| Geo-Location Verification | heavy | 4,357 | 0.006ms | 0.010ms | 0.013ms | 0.132ms | 0.007ms |
| Session Coherence | heavy | 4,357 | 0.018ms | 0.029ms | 0.041ms | 0.227ms | 0.019ms |
| Velocity Fingerprinting | heavy | 4,357 | 0.013ms | 0.021ms | 0.034ms | 0.157ms | 0.014ms |
| Bad User Agent list | heavy | 7,363 | 0.865ms | 1.159ms | 1.407ms | 14.9ms | 0.916ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.140ms | 1.098ms | 1.238ms |
| p95 | 0.212ms | 1.414ms | 1.626ms |
| p99 | 0.243ms | 1.725ms | 1.968ms |
| max | 1.673ms | 18.5ms | 20.1ms |
| avg | 0.145ms | 1.145ms | 1.291ms |
