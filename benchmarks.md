# Bot Detector — Benchmark Report

Generated on: 2026-03-28 16:47:09  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-28 16:46:21 UTC → 2026-03-28 16:47:02 UTC (42s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,231 |
| heavyPhase requests | 7,377 |
| total checker events | 125,071 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,231 |
| min | 0.070ms |
| p50 | 0.242ms |
| p75 | 0.308ms |
| p95 | 0.388ms |
| p99 | 0.458ms |
| max | 2.331ms |
| avg | 0.248ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,377 |
| min | 0.988ms |
| p50 | 1.347ms |
| p75 | 1.521ms |
| p95 | 1.835ms |
| p99 | 2.292ms |
| max | 22.1ms |
| avg | 1.420ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,377 |
| min | 0.021ms |
| p50 | 0.026ms |
| p75 | 0.028ms |
| p95 | 0.042ms |
| p99 | 0.058ms |
| max | 0.637ms |
| avg | 0.028ms |
|  |  |
| cache hits (<1ms) | 7,377 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,231 | 0.011ms | 0.021ms | 0.040ms | 0.232ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,231 | 0.008ms | 0.018ms | 0.036ms | 0.214ms | 0.011ms |
| Browser and Device Verification | cheap | 9,231 | 0.008ms | 0.019ms | 0.037ms | 0.153ms | 0.011ms |
| Locale and Country Verification | cheap | 8,941 | 0.018ms | 0.038ms | 0.053ms | 0.535ms | 0.021ms |
| Known ThreatLevels | cheap | 8,941 | 0.007ms | 0.016ms | 0.033ms | 0.156ms | 0.009ms |
| ASN Classification | cheap | 7,377 | 0.007ms | 0.016ms | 0.035ms | 1.141ms | 0.009ms |
| Tor Node Analysis | cheap | 7,377 | 0.006ms | 0.015ms | 0.033ms | 0.119ms | 0.009ms |
| Timezone Consistency | cheap | 7,377 | 0.008ms | 0.017ms | 0.034ms | 0.370ms | 0.010ms |
| Honeypot Path | cheap | 7,377 | 0.006ms | 0.015ms | 0.031ms | 0.211ms | 0.009ms |
| KnownBadIps | cheap | 7,377 | 0.010ms | 0.021ms | 0.039ms | 0.113ms | 0.013ms |
| Behavior Rate Verification | heavy | 7,377 | 0.026ms | 0.042ms | 0.058ms | 0.637ms | 0.028ms |
| Proxy, ISP and Cookie Verification | heavy | 7,372 | 0.007ms | 0.014ms | 0.025ms | 0.119ms | 0.008ms |
| User agent and Header Verification | heavy | 7,372 | 0.125ms | 0.176ms | 0.208ms | 2.753ms | 0.132ms |
| Geo-Location Verification | heavy | 4,371 | 0.008ms | 0.015ms | 0.030ms | 0.166ms | 0.009ms |
| Session Coherence | heavy | 4,371 | 0.024ms | 0.043ms | 0.062ms | 0.308ms | 0.027ms |
| Velocity Fingerprinting | heavy | 4,371 | 0.017ms | 0.032ms | 0.051ms | 0.225ms | 0.019ms |
| Bad User Agent list | heavy | 7,377 | 1.047ms | 1.503ms | 1.866ms | 17.6ms | 1.117ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.242ms | 1.347ms | 1.589ms |
| p95 | 0.388ms | 1.835ms | 2.223ms |
| p99 | 0.458ms | 2.292ms | 2.750ms |
| max | 2.331ms | 22.1ms | 24.4ms |
| avg | 0.248ms | 1.420ms | 1.669ms |
