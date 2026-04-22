# Bot Detector — Benchmark Report

Generated on: 2026-04-22 21:56:05  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-04-22 21:55:16 UTC → 2026-04-22 21:55:59 UTC (43s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,241 |
| heavyPhase requests | 7,387 |
| total checker events | 125,241 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,241 |
| min | 0.075ms |
| p50 | 0.243ms |
| p75 | 0.306ms |
| p95 | 0.385ms |
| p99 | 0.452ms |
| max | 2.455ms |
| avg | 0.249ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,387 |
| min | 0.990ms |
| p50 | 1.336ms |
| p75 | 1.466ms |
| p95 | 1.812ms |
| p99 | 2.299ms |
| max | 23.0ms |
| avg | 1.407ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,387 |
| min | 0.022ms |
| p50 | 0.026ms |
| p75 | 0.029ms |
| p95 | 0.042ms |
| p99 | 0.058ms |
| max | 0.661ms |
| avg | 0.029ms |
|  |  |
| cache hits (<1ms) | 7,387 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,241 | 0.011ms | 0.021ms | 0.040ms | 0.395ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,241 | 0.008ms | 0.018ms | 0.037ms | 0.202ms | 0.011ms |
| Browser and Device Verification | cheap | 9,241 | 0.008ms | 0.018ms | 0.037ms | 1.087ms | 0.011ms |
| Locale and Country Verification | cheap | 8,951 | 0.018ms | 0.035ms | 0.052ms | 0.532ms | 0.021ms |
| Known ThreatLevels | cheap | 8,951 | 0.007ms | 0.016ms | 0.034ms | 0.126ms | 0.009ms |
| ASN Classification | cheap | 7,387 | 0.007ms | 0.016ms | 0.032ms | 0.097ms | 0.009ms |
| Tor Node Analysis | cheap | 7,387 | 0.007ms | 0.015ms | 0.031ms | 0.336ms | 0.009ms |
| Timezone Consistency | cheap | 7,387 | 0.008ms | 0.017ms | 0.033ms | 0.156ms | 0.010ms |
| Honeypot Path | cheap | 7,387 | 0.006ms | 0.014ms | 0.029ms | 0.068ms | 0.008ms |
| KnownBadIps | cheap | 7,387 | 0.010ms | 0.022ms | 0.041ms | 0.124ms | 0.013ms |
| Behavior Rate Verification | heavy | 7,387 | 0.026ms | 0.042ms | 0.058ms | 0.661ms | 0.029ms |
| Proxy, ISP and Cookie Verification | heavy | 7,382 | 0.007ms | 0.014ms | 0.024ms | 0.133ms | 0.008ms |
| User agent and Header Verification | heavy | 7,382 | 0.128ms | 0.185ms | 0.222ms | 2.837ms | 0.136ms |
| Geo-Location Verification | heavy | 4,381 | 0.008ms | 0.016ms | 0.030ms | 0.170ms | 0.009ms |
| Session Coherence | heavy | 4,381 | 0.025ms | 0.043ms | 0.063ms | 0.677ms | 0.028ms |
| Velocity Fingerprinting | heavy | 4,381 | 0.017ms | 0.033ms | 0.055ms | 0.231ms | 0.019ms |
| Bad User Agent list | heavy | 7,387 | 1.026ms | 1.453ms | 1.845ms | 18.4ms | 1.095ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.243ms | 1.336ms | 1.579ms |
| p95 | 0.385ms | 1.812ms | 2.197ms |
| p99 | 0.452ms | 2.299ms | 2.751ms |
| max | 2.455ms | 23.0ms | 25.5ms |
| avg | 0.249ms | 1.407ms | 1.656ms |
