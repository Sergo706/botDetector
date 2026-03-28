# Bot Detector — Benchmark Report

Generated on: 2026-03-28 15:33:09  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-28 15:32:23 UTC → 2026-03-28 15:33:03 UTC (40s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,221 |
| heavyPhase requests | 7,367 |
| total checker events | 124,901 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,221 |
| min | 0.066ms |
| p50 | 0.215ms |
| p75 | 0.268ms |
| p95 | 0.333ms |
| p99 | 0.369ms |
| max | 2.115ms |
| avg | 0.220ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,367 |
| min | 0.950ms |
| p50 | 1.250ms |
| p75 | 1.350ms |
| p95 | 1.639ms |
| p99 | 1.946ms |
| max | 20.8ms |
| avg | 1.305ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,367 |
| min | 0.019ms |
| p50 | 0.026ms |
| p75 | 0.028ms |
| p95 | 0.039ms |
| p99 | 0.050ms |
| max | 0.654ms |
| avg | 0.027ms |
|  |  |
| cache hits (<1ms) | 7,367 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,221 | 0.011ms | 0.020ms | 0.029ms | 0.106ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,221 | 0.008ms | 0.015ms | 0.024ms | 0.173ms | 0.010ms |
| Browser and Device Verification | cheap | 9,221 | 0.008ms | 0.016ms | 0.026ms | 0.147ms | 0.010ms |
| Locale and Country Verification | cheap | 8,931 | 0.018ms | 0.033ms | 0.044ms | 0.490ms | 0.019ms |
| Known ThreatLevels | cheap | 8,931 | 0.006ms | 0.012ms | 0.021ms | 0.098ms | 0.008ms |
| ASN Classification | cheap | 7,367 | 0.007ms | 0.013ms | 0.022ms | 0.115ms | 0.008ms |
| Tor Node Analysis | cheap | 7,367 | 0.006ms | 0.012ms | 0.021ms | 0.099ms | 0.008ms |
| Timezone Consistency | cheap | 7,367 | 0.007ms | 0.014ms | 0.023ms | 0.214ms | 0.009ms |
| Honeypot Path | cheap | 7,367 | 0.006ms | 0.012ms | 0.021ms | 0.061ms | 0.007ms |
| KnownBadIps | cheap | 7,367 | 0.009ms | 0.019ms | 0.029ms | 0.100ms | 0.011ms |
| Behavior Rate Verification | heavy | 7,367 | 0.026ms | 0.039ms | 0.050ms | 0.654ms | 0.027ms |
| Proxy, ISP and Cookie Verification | heavy | 7,362 | 0.007ms | 0.011ms | 0.016ms | 0.125ms | 0.007ms |
| User agent and Header Verification | heavy | 7,362 | 0.129ms | 0.177ms | 0.217ms | 2.700ms | 0.137ms |
| Geo-Location Verification | heavy | 4,361 | 0.008ms | 0.012ms | 0.020ms | 0.168ms | 0.008ms |
| Session Coherence | heavy | 4,361 | 0.024ms | 0.038ms | 0.050ms | 0.319ms | 0.025ms |
| Velocity Fingerprinting | heavy | 4,361 | 0.017ms | 0.027ms | 0.038ms | 0.194ms | 0.018ms |
| Bad User Agent list | heavy | 7,367 | 0.961ms | 1.329ms | 1.541ms | 16.4ms | 1.018ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.215ms | 1.250ms | 1.465ms |
| p95 | 0.333ms | 1.639ms | 1.972ms |
| p99 | 0.369ms | 1.946ms | 2.315ms |
| max | 2.115ms | 20.8ms | 23.0ms |
| avg | 0.220ms | 1.305ms | 1.525ms |
