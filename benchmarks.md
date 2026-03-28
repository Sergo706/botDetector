# Bot Detector — Benchmark Report

Generated on: 2026-03-28 16:34:46  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-28 16:33:58 UTC → 2026-03-28 16:34:40 UTC (41s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,229 |
| heavyPhase requests | 7,375 |
| total checker events | 125,037 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,229 |
| min | 0.069ms |
| p50 | 0.221ms |
| p75 | 0.278ms |
| p95 | 0.352ms |
| p99 | 0.407ms |
| max | 2.430ms |
| avg | 0.229ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,375 |
| min | 1.096ms |
| p50 | 1.391ms |
| p75 | 1.541ms |
| p95 | 1.829ms |
| p99 | 2.238ms |
| max | 22.4ms |
| avg | 1.445ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,375 |
| min | 0.022ms |
| p50 | 0.026ms |
| p75 | 0.030ms |
| p95 | 0.043ms |
| p99 | 0.057ms |
| max | 0.619ms |
| avg | 0.029ms |
|  |  |
| cache hits (<1ms) | 7,375 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,229 | 0.010ms | 0.019ms | 0.037ms | 0.512ms | 0.012ms |
| Good/Bad Bot Verification | cheap | 9,229 | 0.008ms | 0.016ms | 0.034ms | 0.154ms | 0.010ms |
| Browser and Device Verification | cheap | 9,229 | 0.008ms | 0.016ms | 0.033ms | 0.157ms | 0.010ms |
| Locale and Country Verification | cheap | 8,939 | 0.017ms | 0.033ms | 0.050ms | 0.623ms | 0.019ms |
| Known ThreatLevels | cheap | 8,939 | 0.006ms | 0.014ms | 0.030ms | 0.092ms | 0.009ms |
| ASN Classification | cheap | 7,375 | 0.006ms | 0.014ms | 0.031ms | 0.095ms | 0.009ms |
| Tor Node Analysis | cheap | 7,375 | 0.006ms | 0.013ms | 0.031ms | 0.118ms | 0.008ms |
| Timezone Consistency | cheap | 7,375 | 0.007ms | 0.015ms | 0.032ms | 0.087ms | 0.009ms |
| Honeypot Path | cheap | 7,375 | 0.006ms | 0.013ms | 0.029ms | 0.085ms | 0.008ms |
| KnownBadIps | cheap | 7,375 | 0.010ms | 0.020ms | 0.038ms | 0.156ms | 0.012ms |
| Behavior Rate Verification | heavy | 7,375 | 0.026ms | 0.043ms | 0.057ms | 0.619ms | 0.029ms |
| Proxy, ISP and Cookie Verification | heavy | 7,370 | 0.007ms | 0.014ms | 0.025ms | 0.115ms | 0.008ms |
| User agent and Header Verification | heavy | 7,370 | 0.131ms | 0.187ms | 0.217ms | 2.781ms | 0.138ms |
| Geo-Location Verification | heavy | 4,369 | 0.008ms | 0.016ms | 0.030ms | 0.196ms | 0.010ms |
| Session Coherence | heavy | 4,369 | 0.025ms | 0.043ms | 0.060ms | 0.347ms | 0.027ms |
| Velocity Fingerprinting | heavy | 4,369 | 0.017ms | 0.033ms | 0.052ms | 0.228ms | 0.020ms |
| Bad User Agent list | heavy | 7,375 | 1.079ms | 1.466ms | 1.833ms | 17.8ms | 1.130ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.221ms | 1.391ms | 1.612ms |
| p95 | 0.352ms | 1.829ms | 2.181ms |
| p99 | 0.407ms | 2.238ms | 2.645ms |
| max | 2.430ms | 22.4ms | 24.8ms |
| avg | 0.229ms | 1.445ms | 1.674ms |
