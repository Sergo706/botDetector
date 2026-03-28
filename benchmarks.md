# Bot Detector — Benchmark Report

Generated on: 2026-03-28 15:28:56  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-28 15:28:08 UTC → 2026-03-28 15:28:49 UTC (42s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,230 |
| heavyPhase requests | 7,376 |
| total checker events | 125,054 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,230 |
| min | 0.070ms |
| p50 | 0.243ms |
| p75 | 0.303ms |
| p95 | 0.376ms |
| p99 | 0.433ms |
| max | 3.380ms |
| avg | 0.247ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,376 |
| min | 1.052ms |
| p50 | 1.357ms |
| p75 | 1.525ms |
| p95 | 1.795ms |
| p99 | 2.205ms |
| max | 21.8ms |
| avg | 1.421ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,376 |
| min | 0.021ms |
| p50 | 0.026ms |
| p75 | 0.029ms |
| p95 | 0.043ms |
| p99 | 0.059ms |
| max | 0.639ms |
| avg | 0.029ms |
|  |  |
| cache hits (<1ms) | 7,376 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,230 | 0.011ms | 0.020ms | 0.039ms | 0.201ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,230 | 0.008ms | 0.017ms | 0.030ms | 0.148ms | 0.011ms |
| Browser and Device Verification | cheap | 9,230 | 0.008ms | 0.018ms | 0.034ms | 0.154ms | 0.011ms |
| Locale and Country Verification | cheap | 8,940 | 0.018ms | 0.034ms | 0.052ms | 0.558ms | 0.020ms |
| Known ThreatLevels | cheap | 8,940 | 0.007ms | 0.016ms | 0.029ms | 0.337ms | 0.009ms |
| ASN Classification | cheap | 7,376 | 0.007ms | 0.016ms | 0.030ms | 3.047ms | 0.010ms |
| Tor Node Analysis | cheap | 7,376 | 0.006ms | 0.015ms | 0.029ms | 0.337ms | 0.009ms |
| Timezone Consistency | cheap | 7,376 | 0.008ms | 0.017ms | 0.030ms | 0.135ms | 0.010ms |
| Honeypot Path | cheap | 7,376 | 0.006ms | 0.014ms | 0.022ms | 0.071ms | 0.008ms |
| KnownBadIps | cheap | 7,376 | 0.011ms | 0.021ms | 0.038ms | 0.137ms | 0.013ms |
| Behavior Rate Verification | heavy | 7,376 | 0.026ms | 0.043ms | 0.059ms | 0.639ms | 0.029ms |
| Proxy, ISP and Cookie Verification | heavy | 7,371 | 0.007ms | 0.015ms | 0.023ms | 0.119ms | 0.008ms |
| User agent and Header Verification | heavy | 7,371 | 0.126ms | 0.178ms | 0.208ms | 2.835ms | 0.134ms |
| Geo-Location Verification | heavy | 4,370 | 0.008ms | 0.016ms | 0.029ms | 0.606ms | 0.010ms |
| Session Coherence | heavy | 4,370 | 0.024ms | 0.043ms | 0.061ms | 0.314ms | 0.027ms |
| Velocity Fingerprinting | heavy | 4,370 | 0.017ms | 0.032ms | 0.050ms | 0.262ms | 0.019ms |
| Bad User Agent list | heavy | 7,376 | 1.049ms | 1.456ms | 1.802ms | 17.2ms | 1.113ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.243ms | 1.357ms | 1.600ms |
| p95 | 0.376ms | 1.795ms | 2.171ms |
| p99 | 0.433ms | 2.205ms | 2.638ms |
| max | 3.380ms | 21.8ms | 25.2ms |
| avg | 0.247ms | 1.421ms | 1.668ms |
