# Bot Detector — Benchmark Report

Generated: 2026-03-27 18:28:22  
Based on: `http.stress.test.ts`  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-27 18:27:25 UTC → 2026-03-27 18:28:16 UTC (51s)  

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
| min | 0.073ms |
| p50 | 0.304ms |
| p75 | 0.366ms |
| p95 | 0.498ms |
| p99 | 0.834ms |
| max | 3.346ms |
| avg | 0.309ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,397 |
| min | 1.132ms |
| p50 | 1.849ms |
| p75 | 2.139ms |
| p95 | 2.581ms |
| p99 | 3.454ms |
| max | 31.5ms |
| avg | 1.893ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,397 |
| min | 0.022ms |
| p50 | 0.031ms |
| p75 | 0.039ms |
| p95 | 0.056ms |
| p99 | 0.074ms |
| max | 1.847ms |
| avg | 0.035ms |
|  |  |
| cache hits (<1ms) | 7,396 (100.0%) |
| DB queries (≥1ms) | 1 (0.0%) |
| DB query p50 | 1.847ms |
| DB query max | 1.847ms |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,251 | 0.014ms | 0.025ms | 0.057ms | 0.844ms | 0.016ms |
| Good/Bad Bot Verification | cheap | 9,251 | 0.012ms | 0.020ms | 0.057ms | 1.347ms | 0.014ms |
| Browser and Device Verification | cheap | 9,251 | 0.012ms | 0.021ms | 0.057ms | 1.409ms | 0.014ms |
| Locale and Country Verification | cheap | 8,961 | 0.022ms | 0.045ms | 0.081ms | 1.152ms | 0.024ms |
| Known ThreatLevels | cheap | 8,961 | 0.010ms | 0.017ms | 0.047ms | 0.590ms | 0.012ms |
| ASN Classification | cheap | 7,397 | 0.010ms | 0.017ms | 0.049ms | 2.696ms | 0.012ms |
| Tor Node Analysis | cheap | 7,397 | 0.010ms | 0.016ms | 0.044ms | 1.597ms | 0.011ms |
| Timezone Consistency | cheap | 7,397 | 0.011ms | 0.018ms | 0.046ms | 0.860ms | 0.012ms |
| Honeypot Path | cheap | 7,397 | 0.010ms | 0.016ms | 0.042ms | 1.060ms | 0.011ms |
| KnownBadIps | cheap | 7,397 | 0.015ms | 0.027ms | 0.058ms | 1.562ms | 0.016ms |
| Behavior Rate Verification | heavy | 7,397 | 0.031ms | 0.056ms | 0.074ms | 1.847ms | 0.035ms |
| Proxy, ISP and Cookie Verification | heavy | 7,392 | 0.008ms | 0.016ms | 0.038ms | 0.333ms | 0.011ms |
| User agent and Header Verification | heavy | 7,392 | 0.151ms | 0.231ms | 0.321ms | 7.256ms | 0.163ms |
| Geo-Location Verification | heavy | 4,391 | 0.009ms | 0.017ms | 0.040ms | 0.253ms | 0.012ms |
| Session Coherence | heavy | 4,391 | 0.029ms | 0.051ms | 0.073ms | 0.433ms | 0.032ms |
| Velocity Fingerprinting | heavy | 4,391 | 0.019ms | 0.038ms | 0.059ms | 0.621ms | 0.023ms |
| Bad User Agent list | heavy | 7,397 | 1.480ms | 2.113ms | 2.857ms | 30.9ms | 1.510ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.304ms | 1.849ms | 2.153ms |
| p95 | 0.498ms | 2.581ms | 3.079ms |
| p99 | 0.834ms | 3.454ms | 4.288ms |
| max | 3.346ms | 31.5ms | 34.8ms |
| avg | 0.309ms | 1.893ms | 2.203ms |
