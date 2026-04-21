# Bot Detector — Benchmark Report

Generated on: 2026-04-21 22:22:32  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-04-21 22:21:44 UTC → 2026-04-21 22:22:26 UTC (42s)  

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
| min | 0.072ms |
| p50 | 0.235ms |
| p75 | 0.298ms |
| p95 | 0.370ms |
| p99 | 0.429ms |
| max | 2.454ms |
| avg | 0.241ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,375 |
| min | 0.991ms |
| p50 | 1.326ms |
| p75 | 1.461ms |
| p95 | 1.762ms |
| p99 | 2.226ms |
| max | 22.1ms |
| avg | 1.392ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,375 |
| min | 0.022ms |
| p50 | 0.026ms |
| p75 | 0.028ms |
| p95 | 0.041ms |
| p99 | 0.059ms |
| max | 0.654ms |
| avg | 0.029ms |
|  |  |
| cache hits (<1ms) | 7,375 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,229 | 0.011ms | 0.021ms | 0.039ms | 0.129ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,229 | 0.008ms | 0.018ms | 0.035ms | 0.219ms | 0.011ms |
| Browser and Device Verification | cheap | 9,229 | 0.008ms | 0.017ms | 0.036ms | 0.158ms | 0.011ms |
| Locale and Country Verification | cheap | 8,939 | 0.017ms | 0.034ms | 0.050ms | 0.528ms | 0.020ms |
| Known ThreatLevels | cheap | 8,939 | 0.007ms | 0.015ms | 0.032ms | 0.113ms | 0.009ms |
| ASN Classification | cheap | 7,375 | 0.007ms | 0.016ms | 0.031ms | 0.101ms | 0.009ms |
| Tor Node Analysis | cheap | 7,375 | 0.006ms | 0.014ms | 0.031ms | 0.119ms | 0.009ms |
| Timezone Consistency | cheap | 7,375 | 0.008ms | 0.016ms | 0.034ms | 0.157ms | 0.010ms |
| Honeypot Path | cheap | 7,375 | 0.006ms | 0.014ms | 0.029ms | 1.203ms | 0.009ms |
| KnownBadIps | cheap | 7,375 | 0.010ms | 0.021ms | 0.036ms | 0.157ms | 0.013ms |
| Behavior Rate Verification | heavy | 7,375 | 0.026ms | 0.041ms | 0.059ms | 0.654ms | 0.029ms |
| Proxy, ISP and Cookie Verification | heavy | 7,370 | 0.007ms | 0.014ms | 0.024ms | 0.118ms | 0.008ms |
| User agent and Header Verification | heavy | 7,370 | 0.117ms | 0.170ms | 0.199ms | 2.789ms | 0.128ms |
| Geo-Location Verification | heavy | 4,369 | 0.008ms | 0.015ms | 0.029ms | 0.163ms | 0.009ms |
| Session Coherence | heavy | 4,369 | 0.025ms | 0.043ms | 0.059ms | 0.313ms | 0.027ms |
| Velocity Fingerprinting | heavy | 4,369 | 0.017ms | 0.031ms | 0.048ms | 0.231ms | 0.019ms |
| Bad User Agent list | heavy | 7,375 | 1.034ms | 1.436ms | 1.819ms | 17.5ms | 1.094ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.235ms | 1.326ms | 1.561ms |
| p95 | 0.370ms | 1.762ms | 2.132ms |
| p99 | 0.429ms | 2.226ms | 2.655ms |
| max | 2.454ms | 22.1ms | 24.5ms |
| avg | 0.241ms | 1.392ms | 1.633ms |
