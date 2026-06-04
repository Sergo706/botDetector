# Bot Detector — Benchmark Report

Generated on: 2026-06-04 14:07:40  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-06-04 14:06:50 UTC → 2026-06-04 14:07:34 UTC (43s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,241 |
| heavyPhase requests | 7,387 |
| total checker events | 125,241 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,241 |
| min | 0.071ms |
| p50 | 0.234ms |
| p75 | 0.303ms |
| p95 | 0.380ms |
| p99 | 0.449ms |
| max | 2.479ms |
| avg | 0.243ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,387 |
| min | 1.010ms |
| p50 | 1.325ms |
| p75 | 1.451ms |
| p95 | 1.765ms |
| p99 | 2.328ms |
| max | 24.4ms |
| avg | 1.393ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,387 |
| min | 0.022ms |
| p50 | 0.026ms |
| p75 | 0.029ms |
| p95 | 0.043ms |
| p99 | 0.060ms |
| max | 0.814ms |
| avg | 0.029ms |
|  |  |
| cache hits (<1ms) | 7,387 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,241 | 0.011ms | 0.022ms | 0.040ms | 0.633ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,241 | 0.008ms | 0.018ms | 0.036ms | 0.225ms | 0.011ms |
| Browser and Device Verification | cheap | 9,241 | 0.008ms | 0.018ms | 0.036ms | 0.257ms | 0.011ms |
| Locale and Country Verification | cheap | 8,951 | 0.017ms | 0.037ms | 0.054ms | 0.548ms | 0.020ms |
| Known ThreatLevels | cheap | 8,951 | 0.007ms | 0.016ms | 0.033ms | 0.104ms | 0.009ms |
| ASN Classification | cheap | 7,387 | 0.007ms | 0.016ms | 0.032ms | 0.108ms | 0.009ms |
| Tor Node Analysis | cheap | 7,387 | 0.007ms | 0.015ms | 0.033ms | 0.196ms | 0.009ms |
| Timezone Consistency | cheap | 7,387 | 0.008ms | 0.017ms | 0.033ms | 0.399ms | 0.010ms |
| Honeypot Path | cheap | 7,387 | 0.006ms | 0.015ms | 0.032ms | 0.078ms | 0.008ms |
| KnownBadIps | cheap | 7,387 | 0.010ms | 0.022ms | 0.040ms | 0.494ms | 0.013ms |
| Behavior Rate Verification | heavy | 7,387 | 0.026ms | 0.043ms | 0.060ms | 0.814ms | 0.029ms |
| Proxy, ISP and Cookie Verification | heavy | 7,382 | 0.007ms | 0.014ms | 0.020ms | 0.131ms | 0.008ms |
| User agent and Header Verification | heavy | 7,382 | 0.128ms | 0.194ms | 0.253ms | 3.224ms | 0.139ms |
| Geo-Location Verification | heavy | 4,381 | 0.008ms | 0.016ms | 0.029ms | 0.181ms | 0.009ms |
| Session Coherence | heavy | 4,381 | 0.026ms | 0.045ms | 0.064ms | 0.364ms | 0.028ms |
| Velocity Fingerprinting | heavy | 4,381 | 0.017ms | 0.033ms | 0.053ms | 0.241ms | 0.019ms |
| Bad User Agent list | heavy | 7,387 | 1.019ms | 1.418ms | 1.868ms | 19.3ms | 1.084ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.234ms | 1.325ms | 1.559ms |
| p95 | 0.380ms | 1.765ms | 2.145ms |
| p99 | 0.449ms | 2.328ms | 2.777ms |
| max | 2.479ms | 24.4ms | 26.9ms |
| avg | 0.243ms | 1.393ms | 1.637ms |
