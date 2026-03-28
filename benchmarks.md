# Bot Detector — Benchmark Report

Generated on: 2026-03-28 16:31:37  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-28 16:30:49 UTC → 2026-03-28 16:31:31 UTC (42s)  

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
| p50 | 0.236ms |
| p75 | 0.305ms |
| p95 | 0.389ms |
| p99 | 0.460ms |
| max | 2.452ms |
| avg | 0.247ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,397 |
| min | 1.063ms |
| p50 | 1.358ms |
| p75 | 1.526ms |
| p95 | 1.815ms |
| p99 | 2.301ms |
| max | 23.1ms |
| avg | 1.426ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,397 |
| min | 0.022ms |
| p50 | 0.027ms |
| p75 | 0.030ms |
| p95 | 0.045ms |
| p99 | 0.062ms |
| max | 0.675ms |
| avg | 0.029ms |
|  |  |
| cache hits (<1ms) | 7,397 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,251 | 0.011ms | 0.021ms | 0.041ms | 0.122ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,251 | 0.008ms | 0.018ms | 0.036ms | 0.198ms | 0.011ms |
| Browser and Device Verification | cheap | 9,251 | 0.008ms | 0.018ms | 0.037ms | 0.665ms | 0.011ms |
| Locale and Country Verification | cheap | 8,961 | 0.018ms | 0.036ms | 0.054ms | 0.564ms | 0.021ms |
| Known ThreatLevels | cheap | 8,961 | 0.007ms | 0.016ms | 0.032ms | 0.109ms | 0.009ms |
| ASN Classification | cheap | 7,397 | 0.007ms | 0.016ms | 0.035ms | 0.105ms | 0.009ms |
| Tor Node Analysis | cheap | 7,397 | 0.006ms | 0.015ms | 0.033ms | 0.115ms | 0.009ms |
| Timezone Consistency | cheap | 7,397 | 0.007ms | 0.017ms | 0.032ms | 0.080ms | 0.010ms |
| Honeypot Path | cheap | 7,397 | 0.006ms | 0.014ms | 0.028ms | 0.065ms | 0.008ms |
| KnownBadIps | cheap | 7,397 | 0.010ms | 0.022ms | 0.039ms | 0.130ms | 0.013ms |
| Behavior Rate Verification | heavy | 7,397 | 0.027ms | 0.045ms | 0.062ms | 0.675ms | 0.029ms |
| Proxy, ISP and Cookie Verification | heavy | 7,392 | 0.007ms | 0.014ms | 0.027ms | 0.116ms | 0.008ms |
| User agent and Header Verification | heavy | 7,392 | 0.130ms | 0.189ms | 0.224ms | 2.912ms | 0.138ms |
| Geo-Location Verification | heavy | 4,391 | 0.008ms | 0.016ms | 0.030ms | 0.176ms | 0.009ms |
| Session Coherence | heavy | 4,391 | 0.025ms | 0.042ms | 0.058ms | 0.349ms | 0.027ms |
| Velocity Fingerprinting | heavy | 4,391 | 0.017ms | 0.031ms | 0.051ms | 0.232ms | 0.019ms |
| Bad User Agent list | heavy | 7,397 | 1.047ms | 1.467ms | 1.855ms | 18.4ms | 1.114ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.236ms | 1.358ms | 1.594ms |
| p95 | 0.389ms | 1.815ms | 2.204ms |
| p99 | 0.460ms | 2.301ms | 2.761ms |
| max | 2.452ms | 23.1ms | 25.6ms |
| avg | 0.247ms | 1.426ms | 1.673ms |
