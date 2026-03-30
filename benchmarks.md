# Bot Detector — Benchmark Report

Generated on: 2026-03-30 09:57:07  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-30 09:56:20 UTC → 2026-03-30 09:57:01 UTC (41s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,244 |
| heavyPhase requests | 7,390 |
| total checker events | 125,292 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,244 |
| min | 0.066ms |
| p50 | 0.219ms |
| p75 | 0.262ms |
| p95 | 0.313ms |
| p99 | 0.375ms |
| max | 2.208ms |
| avg | 0.217ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,390 |
| min | 1.121ms |
| p50 | 1.455ms |
| p75 | 1.590ms |
| p95 | 1.853ms |
| p99 | 2.226ms |
| max | 23.6ms |
| avg | 1.515ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,390 |
| min | 0.022ms |
| p50 | 0.027ms |
| p75 | 0.029ms |
| p95 | 0.039ms |
| p99 | 0.052ms |
| max | 0.718ms |
| avg | 0.029ms |
|  |  |
| cache hits (<1ms) | 7,390 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,244 | 0.012ms | 0.018ms | 0.033ms | 0.125ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,244 | 0.009ms | 0.014ms | 0.028ms | 0.194ms | 0.010ms |
| Browser and Device Verification | cheap | 9,244 | 0.009ms | 0.014ms | 0.029ms | 0.158ms | 0.010ms |
| Locale and Country Verification | cheap | 8,954 | 0.018ms | 0.030ms | 0.047ms | 0.533ms | 0.019ms |
| Known ThreatLevels | cheap | 8,954 | 0.006ms | 0.012ms | 0.026ms | 0.087ms | 0.008ms |
| ASN Classification | cheap | 7,390 | 0.006ms | 0.012ms | 0.026ms | 0.212ms | 0.008ms |
| Tor Node Analysis | cheap | 7,390 | 0.006ms | 0.012ms | 0.025ms | 0.158ms | 0.008ms |
| Timezone Consistency | cheap | 7,390 | 0.007ms | 0.013ms | 0.026ms | 0.084ms | 0.008ms |
| Honeypot Path | cheap | 7,390 | 0.006ms | 0.011ms | 0.022ms | 0.254ms | 0.007ms |
| KnownBadIps | cheap | 7,390 | 0.010ms | 0.017ms | 0.031ms | 0.113ms | 0.011ms |
| Behavior Rate Verification | heavy | 7,390 | 0.027ms | 0.039ms | 0.052ms | 0.718ms | 0.029ms |
| Proxy, ISP and Cookie Verification | heavy | 7,385 | 0.007ms | 0.011ms | 0.020ms | 0.120ms | 0.007ms |
| User agent and Header Verification | heavy | 7,385 | 0.132ms | 0.177ms | 0.209ms | 2.887ms | 0.138ms |
| Geo-Location Verification | heavy | 4,384 | 0.007ms | 0.012ms | 0.026ms | 0.176ms | 0.008ms |
| Session Coherence | heavy | 4,384 | 0.023ms | 0.037ms | 0.055ms | 0.282ms | 0.024ms |
| Velocity Fingerprinting | heavy | 4,384 | 0.016ms | 0.027ms | 0.043ms | 0.209ms | 0.018ms |
| Bad User Agent list | heavy | 7,390 | 1.154ms | 1.534ms | 1.837ms | 18.9ms | 1.218ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.219ms | 1.455ms | 1.674ms |
| p95 | 0.313ms | 1.853ms | 2.166ms |
| p99 | 0.375ms | 2.226ms | 2.601ms |
| max | 2.208ms | 23.6ms | 25.8ms |
| avg | 0.217ms | 1.515ms | 1.732ms |
