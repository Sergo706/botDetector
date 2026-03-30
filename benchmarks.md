# Bot Detector — Benchmark Report

Generated on: 2026-03-30 12:18:08  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-30 12:17:22 UTC → 2026-03-30 12:18:02 UTC (40s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,221 |
| heavyPhase requests | 7,367 |
| total checker events | 124,901 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,221 |
| min | 0.070ms |
| p50 | 0.218ms |
| p75 | 0.267ms |
| p95 | 0.330ms |
| p99 | 0.366ms |
| max | 2.087ms |
| avg | 0.221ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,367 |
| min | 0.989ms |
| p50 | 1.248ms |
| p75 | 1.343ms |
| p95 | 1.630ms |
| p99 | 1.943ms |
| max | 20.8ms |
| avg | 1.302ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,367 |
| min | 0.020ms |
| p50 | 0.027ms |
| p75 | 0.028ms |
| p95 | 0.039ms |
| p99 | 0.049ms |
| max | 0.656ms |
| avg | 0.028ms |
|  |  |
| cache hits (<1ms) | 7,367 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,221 | 0.011ms | 0.020ms | 0.029ms | 0.147ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,221 | 0.008ms | 0.015ms | 0.024ms | 0.186ms | 0.010ms |
| Browser and Device Verification | cheap | 9,221 | 0.008ms | 0.015ms | 0.025ms | 0.165ms | 0.010ms |
| Locale and Country Verification | cheap | 8,931 | 0.018ms | 0.031ms | 0.041ms | 0.495ms | 0.019ms |
| Known ThreatLevels | cheap | 8,931 | 0.006ms | 0.012ms | 0.021ms | 0.084ms | 0.008ms |
| ASN Classification | cheap | 7,367 | 0.007ms | 0.013ms | 0.021ms | 0.082ms | 0.008ms |
| Tor Node Analysis | cheap | 7,367 | 0.006ms | 0.012ms | 0.020ms | 0.120ms | 0.008ms |
| Timezone Consistency | cheap | 7,367 | 0.007ms | 0.013ms | 0.021ms | 0.081ms | 0.008ms |
| Honeypot Path | cheap | 7,367 | 0.006ms | 0.012ms | 0.019ms | 0.051ms | 0.008ms |
| KnownBadIps | cheap | 7,367 | 0.010ms | 0.018ms | 0.027ms | 0.100ms | 0.011ms |
| Behavior Rate Verification | heavy | 7,367 | 0.027ms | 0.039ms | 0.049ms | 0.656ms | 0.028ms |
| Proxy, ISP and Cookie Verification | heavy | 7,362 | 0.007ms | 0.011ms | 0.016ms | 0.212ms | 0.007ms |
| User agent and Header Verification | heavy | 7,362 | 0.126ms | 0.171ms | 0.201ms | 2.710ms | 0.134ms |
| Geo-Location Verification | heavy | 4,361 | 0.008ms | 0.013ms | 0.020ms | 0.159ms | 0.009ms |
| Session Coherence | heavy | 4,361 | 0.024ms | 0.038ms | 0.048ms | 0.285ms | 0.025ms |
| Velocity Fingerprinting | heavy | 4,361 | 0.017ms | 0.027ms | 0.039ms | 0.195ms | 0.018ms |
| Bad User Agent list | heavy | 7,367 | 0.960ms | 1.323ms | 1.521ms | 16.4ms | 1.017ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.218ms | 1.248ms | 1.466ms |
| p95 | 0.330ms | 1.630ms | 1.960ms |
| p99 | 0.366ms | 1.943ms | 2.309ms |
| max | 2.087ms | 20.8ms | 22.9ms |
| avg | 0.221ms | 1.302ms | 1.524ms |
