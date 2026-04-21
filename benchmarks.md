# Bot Detector — Benchmark Report

Generated on: 2026-04-21 21:58:32  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-04-21 21:57:45 UTC → 2026-04-21 21:58:27 UTC (41s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,250 |
| heavyPhase requests | 7,396 |
| total checker events | 125,394 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,250 |
| min | 0.070ms |
| p50 | 0.206ms |
| p75 | 0.257ms |
| p95 | 0.306ms |
| p99 | 0.355ms |
| max | 2.121ms |
| avg | 0.210ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,396 |
| min | 1.105ms |
| p50 | 1.418ms |
| p75 | 1.518ms |
| p95 | 1.794ms |
| p99 | 2.218ms |
| max | 23.1ms |
| avg | 1.475ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,396 |
| min | 0.022ms |
| p50 | 0.026ms |
| p75 | 0.028ms |
| p95 | 0.038ms |
| p99 | 0.054ms |
| max | 0.757ms |
| avg | 0.028ms |
|  |  |
| cache hits (<1ms) | 7,396 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,250 | 0.011ms | 0.017ms | 0.032ms | 0.108ms | 0.012ms |
| Good/Bad Bot Verification | cheap | 9,250 | 0.008ms | 0.014ms | 0.028ms | 0.150ms | 0.009ms |
| Browser and Device Verification | cheap | 9,250 | 0.008ms | 0.014ms | 0.028ms | 0.357ms | 0.010ms |
| Locale and Country Verification | cheap | 8,960 | 0.016ms | 0.029ms | 0.044ms | 0.541ms | 0.018ms |
| Known ThreatLevels | cheap | 8,960 | 0.006ms | 0.012ms | 0.024ms | 0.093ms | 0.008ms |
| ASN Classification | cheap | 7,396 | 0.006ms | 0.012ms | 0.025ms | 0.086ms | 0.008ms |
| Tor Node Analysis | cheap | 7,396 | 0.006ms | 0.011ms | 0.024ms | 0.127ms | 0.007ms |
| Timezone Consistency | cheap | 7,396 | 0.007ms | 0.012ms | 0.025ms | 0.461ms | 0.008ms |
| Honeypot Path | cheap | 7,396 | 0.006ms | 0.011ms | 0.023ms | 0.100ms | 0.007ms |
| KnownBadIps | cheap | 7,396 | 0.009ms | 0.016ms | 0.030ms | 0.103ms | 0.011ms |
| Behavior Rate Verification | heavy | 7,396 | 0.026ms | 0.038ms | 0.054ms | 0.757ms | 0.028ms |
| Proxy, ISP and Cookie Verification | heavy | 7,391 | 0.007ms | 0.011ms | 0.018ms | 0.262ms | 0.007ms |
| User agent and Header Verification | heavy | 7,391 | 0.123ms | 0.170ms | 0.199ms | 2.756ms | 0.132ms |
| Geo-Location Verification | heavy | 4,390 | 0.008ms | 0.012ms | 0.025ms | 0.164ms | 0.008ms |
| Session Coherence | heavy | 4,390 | 0.023ms | 0.037ms | 0.053ms | 0.283ms | 0.025ms |
| Velocity Fingerprinting | heavy | 4,390 | 0.016ms | 0.025ms | 0.044ms | 0.204ms | 0.017ms |
| Bad User Agent list | heavy | 7,396 | 1.129ms | 1.476ms | 1.822ms | 18.6ms | 1.186ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.206ms | 1.418ms | 1.624ms |
| p95 | 0.306ms | 1.794ms | 2.100ms |
| p99 | 0.355ms | 2.218ms | 2.573ms |
| max | 2.121ms | 23.1ms | 25.2ms |
| avg | 0.210ms | 1.475ms | 1.685ms |
