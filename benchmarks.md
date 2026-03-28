# Bot Detector — Benchmark Report

Generated on: 2026-03-28 16:44:03  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-28 16:43:15 UTC → 2026-03-28 16:43:56 UTC (41s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,217 |
| heavyPhase requests | 7,363 |
| total checker events | 124,833 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,217 |
| min | 0.068ms |
| p50 | 0.216ms |
| p75 | 0.269ms |
| p95 | 0.344ms |
| p99 | 0.403ms |
| max | 2.466ms |
| avg | 0.224ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,363 |
| min | 0.990ms |
| p50 | 1.379ms |
| p75 | 1.536ms |
| p95 | 1.826ms |
| p99 | 2.342ms |
| max | 23.5ms |
| avg | 1.438ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,363 |
| min | 0.021ms |
| p50 | 0.026ms |
| p75 | 0.029ms |
| p95 | 0.041ms |
| p99 | 0.059ms |
| max | 0.688ms |
| avg | 0.028ms |
|  |  |
| cache hits (<1ms) | 7,363 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,217 | 0.010ms | 0.018ms | 0.036ms | 0.161ms | 0.012ms |
| Good/Bad Bot Verification | cheap | 9,217 | 0.008ms | 0.015ms | 0.033ms | 0.203ms | 0.010ms |
| Browser and Device Verification | cheap | 9,217 | 0.007ms | 0.015ms | 0.033ms | 0.180ms | 0.010ms |
| Locale and Country Verification | cheap | 8,927 | 0.017ms | 0.032ms | 0.049ms | 0.556ms | 0.019ms |
| Known ThreatLevels | cheap | 8,927 | 0.006ms | 0.014ms | 0.030ms | 0.119ms | 0.008ms |
| ASN Classification | cheap | 7,363 | 0.006ms | 0.014ms | 0.031ms | 0.100ms | 0.008ms |
| Tor Node Analysis | cheap | 7,363 | 0.006ms | 0.013ms | 0.030ms | 0.119ms | 0.008ms |
| Timezone Consistency | cheap | 7,363 | 0.007ms | 0.015ms | 0.031ms | 0.080ms | 0.009ms |
| Honeypot Path | cheap | 7,363 | 0.006ms | 0.012ms | 0.027ms | 0.075ms | 0.008ms |
| KnownBadIps | cheap | 7,363 | 0.010ms | 0.020ms | 0.037ms | 0.127ms | 0.012ms |
| Behavior Rate Verification | heavy | 7,363 | 0.026ms | 0.041ms | 0.059ms | 0.688ms | 0.028ms |
| Proxy, ISP and Cookie Verification | heavy | 7,358 | 0.007ms | 0.013ms | 0.026ms | 0.125ms | 0.008ms |
| User agent and Header Verification | heavy | 7,358 | 0.128ms | 0.184ms | 0.217ms | 2.946ms | 0.136ms |
| Geo-Location Verification | heavy | 4,357 | 0.008ms | 0.015ms | 0.030ms | 0.172ms | 0.009ms |
| Session Coherence | heavy | 4,357 | 0.025ms | 0.043ms | 0.060ms | 0.357ms | 0.027ms |
| Velocity Fingerprinting | heavy | 4,357 | 0.017ms | 0.030ms | 0.048ms | 0.230ms | 0.019ms |
| Bad User Agent list | heavy | 7,363 | 1.079ms | 1.480ms | 1.882ms | 18.7ms | 1.128ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.216ms | 1.379ms | 1.595ms |
| p95 | 0.344ms | 1.826ms | 2.170ms |
| p99 | 0.403ms | 2.342ms | 2.745ms |
| max | 2.466ms | 23.5ms | 26.0ms |
| avg | 0.224ms | 1.438ms | 1.661ms |
