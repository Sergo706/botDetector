# Bot Detector — Benchmark Report

Generated on: 2026-03-28 16:53:26  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-28 16:52:37 UTC → 2026-03-28 16:53:20 UTC (43s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,234 |
| heavyPhase requests | 7,380 |
| total checker events | 125,122 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,234 |
| min | 0.073ms |
| p50 | 0.250ms |
| p75 | 0.310ms |
| p95 | 0.384ms |
| p99 | 0.448ms |
| max | 2.411ms |
| avg | 0.252ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,380 |
| min | 0.987ms |
| p50 | 1.387ms |
| p75 | 1.552ms |
| p95 | 1.828ms |
| p99 | 2.292ms |
| max | 22.8ms |
| avg | 1.447ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,380 |
| min | 0.022ms |
| p50 | 0.028ms |
| p75 | 0.032ms |
| p95 | 0.046ms |
| p99 | 0.062ms |
| max | 0.739ms |
| avg | 0.031ms |
|  |  |
| cache hits (<1ms) | 7,380 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,234 | 0.012ms | 0.022ms | 0.040ms | 0.124ms | 0.014ms |
| Good/Bad Bot Verification | cheap | 9,234 | 0.009ms | 0.018ms | 0.035ms | 0.199ms | 0.011ms |
| Browser and Device Verification | cheap | 9,234 | 0.009ms | 0.019ms | 0.036ms | 0.164ms | 0.011ms |
| Locale and Country Verification | cheap | 8,944 | 0.019ms | 0.038ms | 0.056ms | 0.542ms | 0.022ms |
| Known ThreatLevels | cheap | 8,944 | 0.007ms | 0.016ms | 0.031ms | 0.400ms | 0.010ms |
| ASN Classification | cheap | 7,380 | 0.007ms | 0.016ms | 0.034ms | 0.131ms | 0.009ms |
| Tor Node Analysis | cheap | 7,380 | 0.007ms | 0.015ms | 0.028ms | 0.120ms | 0.009ms |
| Timezone Consistency | cheap | 7,380 | 0.008ms | 0.017ms | 0.033ms | 0.080ms | 0.010ms |
| Honeypot Path | cheap | 7,380 | 0.006ms | 0.015ms | 0.030ms | 0.134ms | 0.009ms |
| KnownBadIps | cheap | 7,380 | 0.011ms | 0.023ms | 0.042ms | 0.116ms | 0.014ms |
| Behavior Rate Verification | heavy | 7,380 | 0.028ms | 0.046ms | 0.062ms | 0.739ms | 0.031ms |
| Proxy, ISP and Cookie Verification | heavy | 7,375 | 0.007ms | 0.015ms | 0.027ms | 0.128ms | 0.009ms |
| User agent and Header Verification | heavy | 7,375 | 0.135ms | 0.198ms | 0.236ms | 4.161ms | 0.143ms |
| Geo-Location Verification | heavy | 4,374 | 0.009ms | 0.017ms | 0.030ms | 0.179ms | 0.010ms |
| Session Coherence | heavy | 4,374 | 0.026ms | 0.045ms | 0.065ms | 0.373ms | 0.029ms |
| Velocity Fingerprinting | heavy | 4,374 | 0.018ms | 0.035ms | 0.052ms | 0.236ms | 0.021ms |
| Bad User Agent list | heavy | 7,380 | 1.059ms | 1.474ms | 1.844ms | 17.8ms | 1.123ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.250ms | 1.387ms | 1.637ms |
| p95 | 0.384ms | 1.828ms | 2.212ms |
| p99 | 0.448ms | 2.292ms | 2.740ms |
| max | 2.411ms | 22.8ms | 25.2ms |
| avg | 0.252ms | 1.447ms | 1.699ms |
