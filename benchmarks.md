# Bot Detector — Benchmark Report

Generated on: 2026-03-29 11:59:43  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-29 11:58:54 UTC → 2026-03-29 11:59:37 UTC (42s)  

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
| min | 0.070ms |
| p50 | 0.250ms |
| p75 | 0.318ms |
| p95 | 0.405ms |
| p99 | 0.480ms |
| max | 2.464ms |
| avg | 0.256ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,397 |
| min | 1.031ms |
| p50 | 1.383ms |
| p75 | 1.559ms |
| p95 | 1.888ms |
| p99 | 2.372ms |
| max | 23.3ms |
| avg | 1.455ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,397 |
| min | 0.022ms |
| p50 | 0.028ms |
| p75 | 0.031ms |
| p95 | 0.047ms |
| p99 | 0.065ms |
| max | 0.731ms |
| avg | 0.031ms |
|  |  |
| cache hits (<1ms) | 7,397 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,251 | 0.013ms | 0.023ms | 0.042ms | 0.123ms | 0.014ms |
| Good/Bad Bot Verification | cheap | 9,251 | 0.009ms | 0.019ms | 0.039ms | 0.151ms | 0.011ms |
| Browser and Device Verification | cheap | 9,251 | 0.009ms | 0.019ms | 0.038ms | 0.157ms | 0.011ms |
| Locale and Country Verification | cheap | 8,961 | 0.019ms | 0.040ms | 0.059ms | 0.571ms | 0.022ms |
| Known ThreatLevels | cheap | 8,961 | 0.007ms | 0.017ms | 0.036ms | 0.139ms | 0.010ms |
| ASN Classification | cheap | 7,397 | 0.007ms | 0.017ms | 0.035ms | 0.118ms | 0.010ms |
| Tor Node Analysis | cheap | 7,397 | 0.007ms | 0.016ms | 0.033ms | 0.133ms | 0.009ms |
| Timezone Consistency | cheap | 7,397 | 0.008ms | 0.018ms | 0.036ms | 0.085ms | 0.010ms |
| Honeypot Path | cheap | 7,397 | 0.006ms | 0.015ms | 0.031ms | 0.131ms | 0.009ms |
| KnownBadIps | cheap | 7,397 | 0.011ms | 0.023ms | 0.042ms | 0.130ms | 0.014ms |
| Behavior Rate Verification | heavy | 7,397 | 0.028ms | 0.047ms | 0.065ms | 0.731ms | 0.031ms |
| Proxy, ISP and Cookie Verification | heavy | 7,392 | 0.007ms | 0.015ms | 0.023ms | 0.122ms | 0.008ms |
| User agent and Header Verification | heavy | 7,392 | 0.130ms | 0.196ms | 0.241ms | 3.114ms | 0.141ms |
| Geo-Location Verification | heavy | 4,391 | 0.008ms | 0.016ms | 0.033ms | 0.234ms | 0.010ms |
| Session Coherence | heavy | 4,391 | 0.026ms | 0.046ms | 0.067ms | 0.380ms | 0.029ms |
| Velocity Fingerprinting | heavy | 4,391 | 0.018ms | 0.035ms | 0.056ms | 0.296ms | 0.021ms |
| Bad User Agent list | heavy | 7,397 | 1.060ms | 1.519ms | 1.866ms | 18.2ms | 1.135ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.250ms | 1.383ms | 1.633ms |
| p95 | 0.405ms | 1.888ms | 2.293ms |
| p99 | 0.480ms | 2.372ms | 2.852ms |
| max | 2.464ms | 23.3ms | 25.8ms |
| avg | 0.256ms | 1.455ms | 1.710ms |
