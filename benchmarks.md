# Bot Detector — Benchmark Report

Generated on: 2026-04-14 08:54:20  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-04-14 08:53:31 UTC → 2026-04-14 08:54:14 UTC (43s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,225 |
| heavyPhase requests | 7,371 |
| total checker events | 124,969 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,225 |
| min | 0.071ms |
| p50 | 0.241ms |
| p75 | 0.310ms |
| p95 | 0.392ms |
| p99 | 0.455ms |
| max | 2.467ms |
| avg | 0.249ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,371 |
| min | 1.035ms |
| p50 | 1.350ms |
| p75 | 1.485ms |
| p95 | 1.787ms |
| p99 | 2.278ms |
| max | 23.1ms |
| avg | 1.410ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,371 |
| min | 0.022ms |
| p50 | 0.027ms |
| p75 | 0.029ms |
| p95 | 0.044ms |
| p99 | 0.060ms |
| max | 0.650ms |
| avg | 0.029ms |
|  |  |
| cache hits (<1ms) | 7,371 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,225 | 0.011ms | 0.022ms | 0.041ms | 0.133ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,225 | 0.009ms | 0.018ms | 0.037ms | 0.159ms | 0.011ms |
| Browser and Device Verification | cheap | 9,225 | 0.008ms | 0.019ms | 0.038ms | 0.156ms | 0.011ms |
| Locale and Country Verification | cheap | 8,935 | 0.019ms | 0.037ms | 0.054ms | 0.577ms | 0.021ms |
| Known ThreatLevels | cheap | 8,935 | 0.007ms | 0.016ms | 0.035ms | 0.546ms | 0.010ms |
| ASN Classification | cheap | 7,371 | 0.007ms | 0.016ms | 0.034ms | 0.105ms | 0.009ms |
| Tor Node Analysis | cheap | 7,371 | 0.006ms | 0.015ms | 0.032ms | 0.156ms | 0.009ms |
| Timezone Consistency | cheap | 7,371 | 0.008ms | 0.017ms | 0.032ms | 0.762ms | 0.010ms |
| Honeypot Path | cheap | 7,371 | 0.006ms | 0.015ms | 0.032ms | 0.069ms | 0.009ms |
| KnownBadIps | cheap | 7,371 | 0.010ms | 0.023ms | 0.043ms | 0.822ms | 0.013ms |
| Behavior Rate Verification | heavy | 7,371 | 0.027ms | 0.044ms | 0.060ms | 0.650ms | 0.029ms |
| Proxy, ISP and Cookie Verification | heavy | 7,366 | 0.007ms | 0.015ms | 0.024ms | 0.119ms | 0.008ms |
| User agent and Header Verification | heavy | 7,366 | 0.127ms | 0.185ms | 0.222ms | 3.000ms | 0.135ms |
| Geo-Location Verification | heavy | 4,365 | 0.009ms | 0.017ms | 0.027ms | 0.268ms | 0.010ms |
| Session Coherence | heavy | 4,365 | 0.025ms | 0.043ms | 0.062ms | 0.331ms | 0.028ms |
| Velocity Fingerprinting | heavy | 4,365 | 0.018ms | 0.033ms | 0.048ms | 0.294ms | 0.020ms |
| Bad User Agent list | heavy | 7,371 | 1.040ms | 1.432ms | 1.837ms | 18.4ms | 1.100ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.241ms | 1.350ms | 1.591ms |
| p95 | 0.392ms | 1.787ms | 2.179ms |
| p99 | 0.455ms | 2.278ms | 2.733ms |
| max | 2.467ms | 23.1ms | 25.6ms |
| avg | 0.249ms | 1.410ms | 1.660ms |
