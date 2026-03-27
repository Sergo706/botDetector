# Bot Detector — Benchmark Report

Generated on: 2026-03-27 18:54:33  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-27 18:53:40 UTC → 2026-03-27 18:54:27 UTC (47s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,251 |
| heavyPhase requests | 7,397 |
| total checker events | 125,411 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,251 |
| min | 0.073ms |
| p50 | 0.293ms |
| p75 | 0.332ms |
| p95 | 0.413ms |
| p99 | 0.587ms |
| max | 5.280ms |
| avg | 0.278ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,397 |
| min | 0.994ms |
| p50 | 1.605ms |
| p75 | 1.837ms |
| p95 | 2.128ms |
| p99 | 2.680ms |
| max | 22.3ms |
| avg | 1.642ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,397 |
| min | 0.021ms |
| p50 | 0.031ms |
| p75 | 0.040ms |
| p95 | 0.051ms |
| p99 | 0.068ms |
| max | 1.156ms |
| avg | 0.035ms |
|  |  |
| cache hits (<1ms) | 7,396 (100.0%) |
| DB queries (≥1ms) | 1 (0.0%) |
| DB query p50 | 1.156ms |
| DB query max | 1.156ms |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,251 | 0.015ms | 0.023ms | 0.048ms | 2.309ms | 0.016ms |
| Good/Bad Bot Verification | cheap | 9,251 | 0.012ms | 0.016ms | 0.035ms | 0.976ms | 0.012ms |
| Browser and Device Verification | cheap | 9,251 | 0.012ms | 0.018ms | 0.036ms | 0.720ms | 0.012ms |
| Locale and Country Verification | cheap | 8,961 | 0.024ms | 0.040ms | 0.068ms | 0.851ms | 0.024ms |
| Known ThreatLevels | cheap | 8,961 | 0.010ms | 0.013ms | 0.032ms | 0.187ms | 0.010ms |
| ASN Classification | cheap | 7,397 | 0.010ms | 0.014ms | 0.029ms | 0.251ms | 0.010ms |
| Tor Node Analysis | cheap | 7,397 | 0.010ms | 0.013ms | 0.027ms | 0.623ms | 0.010ms |
| Timezone Consistency | cheap | 7,397 | 0.010ms | 0.015ms | 0.031ms | 0.624ms | 0.011ms |
| Honeypot Path | cheap | 7,397 | 0.010ms | 0.012ms | 0.027ms | 1.307ms | 0.010ms |
| KnownBadIps | cheap | 7,397 | 0.016ms | 0.023ms | 0.041ms | 1.345ms | 0.016ms |
| Behavior Rate Verification | heavy | 7,397 | 0.031ms | 0.051ms | 0.068ms | 1.156ms | 0.035ms |
| Proxy, ISP and Cookie Verification | heavy | 7,392 | 0.007ms | 0.013ms | 0.027ms | 0.159ms | 0.009ms |
| User agent and Header Verification | heavy | 7,392 | 0.149ms | 0.217ms | 0.269ms | 3.005ms | 0.160ms |
| Geo-Location Verification | heavy | 4,391 | 0.009ms | 0.015ms | 0.028ms | 0.216ms | 0.010ms |
| Session Coherence | heavy | 4,391 | 0.027ms | 0.046ms | 0.064ms | 2.068ms | 0.031ms |
| Velocity Fingerprinting | heavy | 4,391 | 0.018ms | 0.030ms | 0.046ms | 0.544ms | 0.020ms |
| Bad User Agent list | heavy | 7,397 | 1.278ms | 1.677ms | 2.080ms | 17.5ms | 1.287ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.293ms | 1.605ms | 1.898ms |
| p95 | 0.413ms | 2.128ms | 2.541ms |
| p99 | 0.587ms | 2.680ms | 3.267ms |
| max | 5.280ms | 22.3ms | 27.6ms |
| avg | 0.278ms | 1.642ms | 1.920ms |
