# Bot Detector — Benchmark Report

Generated on: 2026-03-28 16:21:01  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-28 16:20:15 UTC → 2026-03-28 16:20:56 UTC (41s)  

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
| p50 | 0.231ms |
| p75 | 0.290ms |
| p95 | 0.367ms |
| p99 | 0.427ms |
| max | 2.423ms |
| avg | 0.237ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,377 |
| min | 1.015ms |
| p50 | 1.373ms |
| p75 | 1.543ms |
| p95 | 1.823ms |
| p99 | 2.261ms |
| max | 21.9ms |
| avg | 1.434ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,377 |
| min | 0.022ms |
| p50 | 0.026ms |
| p75 | 0.029ms |
| p95 | 0.042ms |
| p99 | 0.058ms |
| max | 0.605ms |
| avg | 0.029ms |
|  |  |
| cache hits (<1ms) | 7,377 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,231 | 0.010ms | 0.020ms | 0.038ms | 0.196ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,231 | 0.008ms | 0.017ms | 0.035ms | 0.151ms | 0.010ms |
| Browser and Device Verification | cheap | 9,231 | 0.008ms | 0.017ms | 0.035ms | 0.176ms | 0.010ms |
| Locale and Country Verification | cheap | 8,941 | 0.017ms | 0.036ms | 0.051ms | 0.564ms | 0.019ms |
| Known ThreatLevels | cheap | 8,941 | 0.006ms | 0.014ms | 0.033ms | 0.155ms | 0.009ms |
| ASN Classification | cheap | 7,377 | 0.007ms | 0.015ms | 0.034ms | 0.099ms | 0.009ms |
| Tor Node Analysis | cheap | 7,377 | 0.006ms | 0.014ms | 0.032ms | 0.121ms | 0.009ms |
| Timezone Consistency | cheap | 7,377 | 0.007ms | 0.016ms | 0.034ms | 0.112ms | 0.009ms |
| Honeypot Path | cheap | 7,377 | 0.006ms | 0.014ms | 0.033ms | 0.236ms | 0.008ms |
| KnownBadIps | cheap | 7,377 | 0.010ms | 0.021ms | 0.039ms | 0.173ms | 0.013ms |
| Behavior Rate Verification | heavy | 7,377 | 0.026ms | 0.042ms | 0.058ms | 0.605ms | 0.029ms |
| Proxy, ISP and Cookie Verification | heavy | 7,372 | 0.007ms | 0.014ms | 0.022ms | 0.114ms | 0.008ms |
| User agent and Header Verification | heavy | 7,372 | 0.122ms | 0.171ms | 0.206ms | 2.754ms | 0.129ms |
| Geo-Location Verification | heavy | 4,371 | 0.008ms | 0.016ms | 0.024ms | 0.167ms | 0.010ms |
| Session Coherence | heavy | 4,371 | 0.025ms | 0.041ms | 0.058ms | 0.353ms | 0.027ms |
| Velocity Fingerprinting | heavy | 4,371 | 0.017ms | 0.032ms | 0.051ms | 0.226ms | 0.020ms |
| Bad User Agent list | heavy | 7,377 | 1.070ms | 1.488ms | 1.855ms | 17.4ms | 1.131ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.231ms | 1.373ms | 1.604ms |
| p95 | 0.367ms | 1.823ms | 2.190ms |
| p99 | 0.427ms | 2.261ms | 2.688ms |
| max | 2.423ms | 21.9ms | 24.3ms |
| avg | 0.237ms | 1.434ms | 1.671ms |
