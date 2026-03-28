# Bot Detector — Benchmark Report

Generated on: 2026-03-28 16:50:14  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-28 16:49:26 UTC → 2026-03-28 16:50:08 UTC (42s)  

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
| p50 | 0.224ms |
| p75 | 0.285ms |
| p95 | 0.358ms |
| p99 | 0.425ms |
| max | 2.441ms |
| avg | 0.233ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,371 |
| min | 1.053ms |
| p50 | 1.381ms |
| p75 | 1.540ms |
| p95 | 1.810ms |
| p99 | 2.265ms |
| max | 23.1ms |
| avg | 1.439ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,371 |
| min | 0.023ms |
| p50 | 0.029ms |
| p75 | 0.032ms |
| p95 | 0.047ms |
| p99 | 0.063ms |
| max | 0.684ms |
| avg | 0.031ms |
|  |  |
| cache hits (<1ms) | 7,371 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,225 | 0.010ms | 0.019ms | 0.039ms | 0.124ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,225 | 0.008ms | 0.017ms | 0.034ms | 0.220ms | 0.010ms |
| Browser and Device Verification | cheap | 9,225 | 0.008ms | 0.017ms | 0.034ms | 0.160ms | 0.010ms |
| Locale and Country Verification | cheap | 8,935 | 0.018ms | 0.035ms | 0.054ms | 0.538ms | 0.020ms |
| Known ThreatLevels | cheap | 8,935 | 0.007ms | 0.015ms | 0.032ms | 0.738ms | 0.009ms |
| ASN Classification | cheap | 7,371 | 0.006ms | 0.015ms | 0.033ms | 0.101ms | 0.009ms |
| Tor Node Analysis | cheap | 7,371 | 0.006ms | 0.014ms | 0.029ms | 0.117ms | 0.008ms |
| Timezone Consistency | cheap | 7,371 | 0.007ms | 0.016ms | 0.030ms | 0.099ms | 0.009ms |
| Honeypot Path | cheap | 7,371 | 0.006ms | 0.014ms | 0.033ms | 0.072ms | 0.008ms |
| KnownBadIps | cheap | 7,371 | 0.010ms | 0.021ms | 0.039ms | 0.124ms | 0.012ms |
| Behavior Rate Verification | heavy | 7,371 | 0.029ms | 0.047ms | 0.063ms | 0.684ms | 0.031ms |
| Proxy, ISP and Cookie Verification | heavy | 7,366 | 0.007ms | 0.015ms | 0.026ms | 0.121ms | 0.009ms |
| User agent and Header Verification | heavy | 7,366 | 0.134ms | 0.195ms | 0.237ms | 2.958ms | 0.143ms |
| Geo-Location Verification | heavy | 4,365 | 0.008ms | 0.016ms | 0.030ms | 0.183ms | 0.010ms |
| Session Coherence | heavy | 4,365 | 0.027ms | 0.045ms | 0.064ms | 0.321ms | 0.029ms |
| Velocity Fingerprinting | heavy | 4,365 | 0.018ms | 0.033ms | 0.052ms | 0.271ms | 0.020ms |
| Bad User Agent list | heavy | 7,371 | 1.061ms | 1.454ms | 1.823ms | 18.3ms | 1.116ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.224ms | 1.381ms | 1.605ms |
| p95 | 0.358ms | 1.810ms | 2.168ms |
| p99 | 0.425ms | 2.265ms | 2.690ms |
| max | 2.441ms | 23.1ms | 25.6ms |
| avg | 0.233ms | 1.439ms | 1.673ms |
