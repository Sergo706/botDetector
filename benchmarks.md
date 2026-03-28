# Bot Detector — Benchmark Report

Generated on: 2026-03-28 09:55:40  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-28 09:54:43 UTC → 2026-03-28 09:55:34 UTC (51s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,245 |
| heavyPhase requests | 7,391 |
| total checker events | 125,309 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,245 |
| min | 0.072ms |
| p50 | 0.324ms |
| p75 | 0.381ms |
| p95 | 0.535ms |
| p99 | 0.830ms |
| max | 3.380ms |
| avg | 0.327ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,391 |
| min | 1.109ms |
| p50 | 1.815ms |
| p75 | 2.208ms |
| p95 | 2.591ms |
| p99 | 3.455ms |
| max | 22.3ms |
| avg | 1.885ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,391 |
| min | 0.022ms |
| p50 | 0.030ms |
| p75 | 0.039ms |
| p95 | 0.056ms |
| p99 | 0.075ms |
| max | 0.640ms |
| avg | 0.034ms |
|  |  |
| cache hits (<1ms) | 7,391 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,245 | 0.015ms | 0.032ms | 0.065ms | 3.093ms | 0.017ms |
| Good/Bad Bot Verification | cheap | 9,245 | 0.013ms | 0.024ms | 0.058ms | 1.158ms | 0.014ms |
| Browser and Device Verification | cheap | 9,245 | 0.013ms | 0.027ms | 0.065ms | 2.161ms | 0.015ms |
| Locale and Country Verification | cheap | 8,955 | 0.024ms | 0.050ms | 0.088ms | 1.125ms | 0.026ms |
| Known ThreatLevels | cheap | 8,955 | 0.011ms | 0.019ms | 0.057ms | 0.731ms | 0.013ms |
| ASN Classification | cheap | 7,391 | 0.011ms | 0.018ms | 0.049ms | 1.266ms | 0.012ms |
| Tor Node Analysis | cheap | 7,391 | 0.011ms | 0.018ms | 0.045ms | 0.927ms | 0.012ms |
| Timezone Consistency | cheap | 7,391 | 0.012ms | 0.020ms | 0.051ms | 1.466ms | 0.013ms |
| Honeypot Path | cheap | 7,391 | 0.010ms | 0.017ms | 0.050ms | 2.384ms | 0.012ms |
| KnownBadIps | cheap | 7,391 | 0.016ms | 0.033ms | 0.062ms | 2.328ms | 0.018ms |
| Behavior Rate Verification | heavy | 7,391 | 0.030ms | 0.056ms | 0.075ms | 0.640ms | 0.034ms |
| Proxy, ISP and Cookie Verification | heavy | 7,386 | 0.008ms | 0.016ms | 0.038ms | 1.044ms | 0.010ms |
| User agent and Header Verification | heavy | 7,386 | 0.141ms | 0.211ms | 0.289ms | 2.890ms | 0.150ms |
| Geo-Location Verification | heavy | 4,385 | 0.009ms | 0.018ms | 0.040ms | 0.214ms | 0.011ms |
| Session Coherence | heavy | 4,385 | 0.028ms | 0.050ms | 0.074ms | 0.350ms | 0.032ms |
| Velocity Fingerprinting | heavy | 4,385 | 0.019ms | 0.038ms | 0.061ms | 0.580ms | 0.023ms |
| Bad User Agent list | heavy | 7,391 | 1.475ms | 2.151ms | 2.811ms | 17.6ms | 1.525ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.324ms | 1.815ms | 2.139ms |
| p95 | 0.535ms | 2.591ms | 3.126ms |
| p99 | 0.830ms | 3.455ms | 4.285ms |
| max | 3.380ms | 22.3ms | 25.7ms |
| avg | 0.327ms | 1.885ms | 2.212ms |
