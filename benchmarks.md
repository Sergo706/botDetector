# Bot Detector — Benchmark Report

Generated on: 2026-03-28 16:40:59  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-28 16:40:11 UTC → 2026-03-28 16:40:52 UTC (42s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,237 |
| heavyPhase requests | 7,383 |
| total checker events | 125,173 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,237 |
| min | 0.069ms |
| p50 | 0.239ms |
| p75 | 0.300ms |
| p95 | 0.381ms |
| p99 | 0.449ms |
| max | 2.460ms |
| avg | 0.243ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,383 |
| min | 0.999ms |
| p50 | 1.364ms |
| p75 | 1.536ms |
| p95 | 1.815ms |
| p99 | 2.283ms |
| max | 22.4ms |
| avg | 1.432ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,383 |
| min | 0.022ms |
| p50 | 0.027ms |
| p75 | 0.030ms |
| p95 | 0.044ms |
| p99 | 0.059ms |
| max | 0.637ms |
| avg | 0.029ms |
|  |  |
| cache hits (<1ms) | 7,383 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,237 | 0.011ms | 0.020ms | 0.038ms | 0.183ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,237 | 0.008ms | 0.017ms | 0.036ms | 0.191ms | 0.011ms |
| Browser and Device Verification | cheap | 9,237 | 0.008ms | 0.018ms | 0.037ms | 0.702ms | 0.011ms |
| Locale and Country Verification | cheap | 8,947 | 0.018ms | 0.037ms | 0.053ms | 0.622ms | 0.021ms |
| Known ThreatLevels | cheap | 8,947 | 0.007ms | 0.015ms | 0.033ms | 0.323ms | 0.009ms |
| ASN Classification | cheap | 7,383 | 0.007ms | 0.015ms | 0.032ms | 0.115ms | 0.009ms |
| Tor Node Analysis | cheap | 7,383 | 0.006ms | 0.014ms | 0.033ms | 0.148ms | 0.009ms |
| Timezone Consistency | cheap | 7,383 | 0.007ms | 0.016ms | 0.033ms | 0.192ms | 0.010ms |
| Honeypot Path | cheap | 7,383 | 0.006ms | 0.014ms | 0.028ms | 0.115ms | 0.008ms |
| KnownBadIps | cheap | 7,383 | 0.011ms | 0.022ms | 0.041ms | 0.121ms | 0.013ms |
| Behavior Rate Verification | heavy | 7,383 | 0.027ms | 0.044ms | 0.059ms | 0.637ms | 0.029ms |
| Proxy, ISP and Cookie Verification | heavy | 7,378 | 0.007ms | 0.014ms | 0.027ms | 0.123ms | 0.008ms |
| User agent and Header Verification | heavy | 7,378 | 0.129ms | 0.184ms | 0.217ms | 2.831ms | 0.137ms |
| Geo-Location Verification | heavy | 4,377 | 0.008ms | 0.015ms | 0.029ms | 0.168ms | 0.010ms |
| Session Coherence | heavy | 4,377 | 0.025ms | 0.041ms | 0.057ms | 0.350ms | 0.027ms |
| Velocity Fingerprinting | heavy | 4,377 | 0.017ms | 0.031ms | 0.048ms | 0.275ms | 0.019ms |
| Bad User Agent list | heavy | 7,383 | 1.054ms | 1.479ms | 1.846ms | 17.8ms | 1.120ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.239ms | 1.364ms | 1.603ms |
| p95 | 0.381ms | 1.815ms | 2.196ms |
| p99 | 0.449ms | 2.283ms | 2.732ms |
| max | 2.460ms | 22.4ms | 24.9ms |
| avg | 0.243ms | 1.432ms | 1.674ms |
