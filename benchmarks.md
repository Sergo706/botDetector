# Bot Detector — Benchmark Report

Generated on: 2026-03-28 16:56:42  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-28 16:55:55 UTC → 2026-03-28 16:56:36 UTC (42s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,237 |
| heavyPhase requests | 7,383 |
| total checker events | 125,173 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,237 |
| min | 0.068ms |
| p50 | 0.245ms |
| p75 | 0.308ms |
| p95 | 0.387ms |
| p99 | 0.453ms |
| max | 2.438ms |
| avg | 0.249ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,383 |
| min | 0.976ms |
| p50 | 1.353ms |
| p75 | 1.520ms |
| p95 | 1.813ms |
| p99 | 2.286ms |
| max | 22.6ms |
| avg | 1.422ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,383 |
| min | 0.022ms |
| p50 | 0.027ms |
| p75 | 0.029ms |
| p95 | 0.044ms |
| p99 | 0.060ms |
| max | 0.660ms |
| avg | 0.029ms |
|  |  |
| cache hits (<1ms) | 7,383 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,237 | 0.011ms | 0.021ms | 0.041ms | 0.624ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,237 | 0.009ms | 0.018ms | 0.036ms | 0.151ms | 0.011ms |
| Browser and Device Verification | cheap | 9,237 | 0.009ms | 0.018ms | 0.036ms | 0.154ms | 0.011ms |
| Locale and Country Verification | cheap | 8,947 | 0.018ms | 0.036ms | 0.052ms | 0.646ms | 0.021ms |
| Known ThreatLevels | cheap | 8,947 | 0.007ms | 0.017ms | 0.035ms | 0.091ms | 0.010ms |
| ASN Classification | cheap | 7,383 | 0.007ms | 0.016ms | 0.035ms | 0.110ms | 0.009ms |
| Tor Node Analysis | cheap | 7,383 | 0.006ms | 0.015ms | 0.031ms | 0.418ms | 0.009ms |
| Timezone Consistency | cheap | 7,383 | 0.008ms | 0.017ms | 0.033ms | 0.081ms | 0.010ms |
| Honeypot Path | cheap | 7,383 | 0.006ms | 0.015ms | 0.032ms | 0.068ms | 0.009ms |
| KnownBadIps | cheap | 7,383 | 0.011ms | 0.022ms | 0.040ms | 0.505ms | 0.013ms |
| Behavior Rate Verification | heavy | 7,383 | 0.027ms | 0.044ms | 0.060ms | 0.660ms | 0.029ms |
| Proxy, ISP and Cookie Verification | heavy | 7,378 | 0.007ms | 0.014ms | 0.021ms | 0.120ms | 0.008ms |
| User agent and Header Verification | heavy | 7,378 | 0.124ms | 0.177ms | 0.208ms | 3.216ms | 0.133ms |
| Geo-Location Verification | heavy | 4,377 | 0.008ms | 0.016ms | 0.033ms | 0.166ms | 0.009ms |
| Session Coherence | heavy | 4,377 | 0.025ms | 0.042ms | 0.061ms | 0.312ms | 0.027ms |
| Velocity Fingerprinting | heavy | 4,377 | 0.017ms | 0.032ms | 0.050ms | 0.289ms | 0.019ms |
| Bad User Agent list | heavy | 7,383 | 1.048ms | 1.480ms | 1.868ms | 18.0ms | 1.118ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.245ms | 1.353ms | 1.598ms |
| p95 | 0.387ms | 1.813ms | 2.200ms |
| p99 | 0.453ms | 2.286ms | 2.739ms |
| max | 2.438ms | 22.6ms | 25.0ms |
| avg | 0.249ms | 1.422ms | 1.671ms |
