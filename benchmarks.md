# Bot Detector — Benchmark Report

Generated on: 2026-05-29 12:07:04  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-05-29 12:06:12 UTC → 2026-05-29 12:06:58 UTC (46s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,212 |
| heavyPhase requests | 7,358 |
| total checker events | 124,748 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,212 |
| min | 0.075ms |
| p50 | 0.212ms |
| p75 | 0.261ms |
| p95 | 0.314ms |
| p99 | 0.362ms |
| max | 2.302ms |
| avg | 0.217ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,358 |
| min | 1.252ms |
| p50 | 1.472ms |
| p75 | 1.552ms |
| p95 | 1.844ms |
| p99 | 2.302ms |
| max | 24.1ms |
| avg | 1.520ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,358 |
| min | 0.022ms |
| p50 | 0.031ms |
| p75 | 0.033ms |
| p95 | 0.045ms |
| p99 | 0.058ms |
| max | 0.810ms |
| avg | 0.032ms |
|  |  |
| cache hits (<1ms) | 7,358 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,212 | 0.013ms | 0.021ms | 0.036ms | 0.115ms | 0.014ms |
| Good/Bad Bot Verification | cheap | 9,212 | 0.008ms | 0.015ms | 0.029ms | 0.210ms | 0.010ms |
| Browser and Device Verification | cheap | 9,212 | 0.009ms | 0.015ms | 0.030ms | 0.216ms | 0.010ms |
| Locale and Country Verification | cheap | 8,922 | 0.020ms | 0.035ms | 0.050ms | 0.567ms | 0.021ms |
| Known ThreatLevels | cheap | 8,922 | 0.006ms | 0.012ms | 0.025ms | 0.135ms | 0.008ms |
| ASN Classification | cheap | 7,358 | 0.007ms | 0.012ms | 0.026ms | 0.192ms | 0.008ms |
| Tor Node Analysis | cheap | 7,358 | 0.007ms | 0.011ms | 0.022ms | 0.136ms | 0.008ms |
| Timezone Consistency | cheap | 7,358 | 0.007ms | 0.013ms | 0.026ms | 0.342ms | 0.009ms |
| Honeypot Path | cheap | 7,358 | 0.006ms | 0.011ms | 0.022ms | 0.086ms | 0.007ms |
| KnownBadIps | cheap | 7,358 | 0.011ms | 0.019ms | 0.034ms | 0.152ms | 0.012ms |
| Behavior Rate Verification | heavy | 7,358 | 0.031ms | 0.045ms | 0.058ms | 0.810ms | 0.032ms |
| Proxy, ISP and Cookie Verification | heavy | 7,353 | 0.007ms | 0.012ms | 0.022ms | 0.124ms | 0.008ms |
| User agent and Header Verification | heavy | 7,353 | 0.173ms | 0.228ms | 0.274ms | 2.933ms | 0.176ms |
| Geo-Location Verification | heavy | 4,352 | 0.008ms | 0.014ms | 0.022ms | 0.176ms | 0.009ms |
| Session Coherence | heavy | 4,352 | 0.027ms | 0.043ms | 0.059ms | 0.299ms | 0.029ms |
| Velocity Fingerprinting | heavy | 4,352 | 0.019ms | 0.033ms | 0.055ms | 0.244ms | 0.022ms |
| Bad User Agent list | heavy | 7,358 | 1.129ms | 1.461ms | 1.830ms | 19.2ms | 1.175ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.212ms | 1.472ms | 1.684ms |
| p95 | 0.314ms | 1.844ms | 2.158ms |
| p99 | 0.362ms | 2.302ms | 2.664ms |
| max | 2.302ms | 24.1ms | 26.4ms |
| avg | 0.217ms | 1.520ms | 1.737ms |
