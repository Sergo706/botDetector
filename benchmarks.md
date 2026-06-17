# Bot Detector — Benchmark Report

Generated on: 2026-06-17 13:46:28  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-06-17 13:45:41 UTC → 2026-06-17 13:46:23 UTC (42s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,242 |
| heavyPhase requests | 7,388 |
| total checker events | 125,258 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,242 |
| min | 0.070ms |
| p50 | 0.211ms |
| p75 | 0.256ms |
| p95 | 0.298ms |
| p99 | 0.340ms |
| max | 2.260ms |
| avg | 0.210ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,388 |
| min | 1.107ms |
| p50 | 1.425ms |
| p75 | 1.530ms |
| p95 | 1.806ms |
| p99 | 2.217ms |
| max | 23.6ms |
| avg | 1.481ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,388 |
| min | 0.022ms |
| p50 | 0.027ms |
| p75 | 0.029ms |
| p95 | 0.039ms |
| p99 | 0.053ms |
| max | 0.723ms |
| avg | 0.029ms |
|  |  |
| cache hits (<1ms) | 7,388 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,242 | 0.012ms | 0.018ms | 0.032ms | 0.118ms | 0.012ms |
| Good/Bad Bot Verification | cheap | 9,242 | 0.008ms | 0.014ms | 0.027ms | 0.206ms | 0.009ms |
| Browser and Device Verification | cheap | 9,242 | 0.008ms | 0.014ms | 0.027ms | 0.166ms | 0.009ms |
| Locale and Country Verification | cheap | 8,952 | 0.017ms | 0.029ms | 0.044ms | 0.527ms | 0.018ms |
| Known ThreatLevels | cheap | 8,952 | 0.006ms | 0.012ms | 0.023ms | 0.094ms | 0.008ms |
| ASN Classification | cheap | 7,388 | 0.006ms | 0.012ms | 0.024ms | 0.110ms | 0.008ms |
| Tor Node Analysis | cheap | 7,388 | 0.006ms | 0.011ms | 0.023ms | 0.112ms | 0.007ms |
| Timezone Consistency | cheap | 7,388 | 0.007ms | 0.013ms | 0.023ms | 0.083ms | 0.008ms |
| Honeypot Path | cheap | 7,388 | 0.006ms | 0.011ms | 0.022ms | 0.064ms | 0.007ms |
| KnownBadIps | cheap | 7,388 | 0.009ms | 0.017ms | 0.029ms | 0.105ms | 0.011ms |
| Behavior Rate Verification | heavy | 7,388 | 0.027ms | 0.039ms | 0.053ms | 0.723ms | 0.029ms |
| Proxy, ISP and Cookie Verification | heavy | 7,383 | 0.006ms | 0.011ms | 0.016ms | 0.125ms | 0.007ms |
| User agent and Header Verification | heavy | 7,383 | 0.126ms | 0.172ms | 0.204ms | 2.891ms | 0.134ms |
| Geo-Location Verification | heavy | 4,382 | 0.008ms | 0.013ms | 0.025ms | 0.166ms | 0.008ms |
| Session Coherence | heavy | 4,382 | 0.023ms | 0.038ms | 0.054ms | 0.304ms | 0.025ms |
| Velocity Fingerprinting | heavy | 4,382 | 0.016ms | 0.026ms | 0.043ms | 0.213ms | 0.017ms |
| Bad User Agent list | heavy | 7,388 | 1.131ms | 1.491ms | 1.819ms | 18.9ms | 1.191ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.211ms | 1.425ms | 1.636ms |
| p95 | 0.298ms | 1.806ms | 2.104ms |
| p99 | 0.340ms | 2.217ms | 2.557ms |
| max | 2.260ms | 23.6ms | 25.9ms |
| avg | 0.210ms | 1.481ms | 1.691ms |
