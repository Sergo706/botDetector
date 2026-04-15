# Bot Detector — Benchmark Report

Generated on: 2026-04-15 14:07:53  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-04-15 14:07:05 UTC → 2026-04-15 14:07:47 UTC (42s)  

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
| min | 0.074ms |
| p50 | 0.239ms |
| p75 | 0.305ms |
| p95 | 0.376ms |
| p99 | 0.440ms |
| max | 2.339ms |
| avg | 0.247ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,380 |
| min | 1.002ms |
| p50 | 1.337ms |
| p75 | 1.484ms |
| p95 | 1.800ms |
| p99 | 2.255ms |
| max | 22.1ms |
| avg | 1.407ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,380 |
| min | 0.022ms |
| p50 | 0.026ms |
| p75 | 0.028ms |
| p95 | 0.042ms |
| p99 | 0.058ms |
| max | 0.641ms |
| avg | 0.029ms |
|  |  |
| cache hits (<1ms) | 7,380 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,234 | 0.011ms | 0.021ms | 0.042ms | 0.133ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,234 | 0.008ms | 0.018ms | 0.033ms | 0.178ms | 0.011ms |
| Browser and Device Verification | cheap | 9,234 | 0.008ms | 0.018ms | 0.036ms | 0.149ms | 0.011ms |
| Locale and Country Verification | cheap | 8,944 | 0.017ms | 0.033ms | 0.052ms | 0.523ms | 0.020ms |
| Known ThreatLevels | cheap | 8,944 | 0.007ms | 0.016ms | 0.034ms | 0.255ms | 0.009ms |
| ASN Classification | cheap | 7,380 | 0.007ms | 0.016ms | 0.032ms | 0.112ms | 0.009ms |
| Tor Node Analysis | cheap | 7,380 | 0.006ms | 0.015ms | 0.031ms | 0.166ms | 0.009ms |
| Timezone Consistency | cheap | 7,380 | 0.007ms | 0.017ms | 0.029ms | 0.266ms | 0.010ms |
| Honeypot Path | cheap | 7,380 | 0.006ms | 0.015ms | 0.030ms | 0.095ms | 0.008ms |
| KnownBadIps | cheap | 7,380 | 0.010ms | 0.021ms | 0.036ms | 0.120ms | 0.013ms |
| Behavior Rate Verification | heavy | 7,380 | 0.026ms | 0.042ms | 0.058ms | 0.641ms | 0.029ms |
| Proxy, ISP and Cookie Verification | heavy | 7,375 | 0.007ms | 0.014ms | 0.021ms | 0.120ms | 0.008ms |
| User agent and Header Verification | heavy | 7,375 | 0.125ms | 0.178ms | 0.211ms | 2.736ms | 0.133ms |
| Geo-Location Verification | heavy | 4,374 | 0.008ms | 0.016ms | 0.032ms | 0.220ms | 0.010ms |
| Session Coherence | heavy | 4,374 | 0.025ms | 0.043ms | 0.059ms | 0.310ms | 0.026ms |
| Velocity Fingerprinting | heavy | 4,374 | 0.017ms | 0.032ms | 0.049ms | 0.228ms | 0.019ms |
| Bad User Agent list | heavy | 7,380 | 1.040ms | 1.453ms | 1.849ms | 17.6ms | 1.100ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.239ms | 1.337ms | 1.576ms |
| p95 | 0.376ms | 1.800ms | 2.176ms |
| p99 | 0.440ms | 2.255ms | 2.695ms |
| max | 2.339ms | 22.1ms | 24.4ms |
| avg | 0.247ms | 1.407ms | 1.653ms |
