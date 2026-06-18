# Bot Detector — Benchmark Report

Generated on: 2026-06-18 11:16:38  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-06-18 11:15:49 UTC → 2026-06-18 11:16:32 UTC (43s)  

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
| min | 0.070ms |
| p50 | 0.213ms |
| p75 | 0.261ms |
| p95 | 0.311ms |
| p99 | 0.367ms |
| max | 2.195ms |
| avg | 0.214ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,371 |
| min | 1.099ms |
| p50 | 1.435ms |
| p75 | 1.535ms |
| p95 | 1.837ms |
| p99 | 2.258ms |
| max | 24.1ms |
| avg | 1.496ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,371 |
| min | 0.022ms |
| p50 | 0.027ms |
| p75 | 0.029ms |
| p95 | 0.040ms |
| p99 | 0.055ms |
| max | 0.804ms |
| avg | 0.029ms |
|  |  |
| cache hits (<1ms) | 7,371 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,225 | 0.012ms | 0.018ms | 0.034ms | 0.163ms | 0.012ms |
| Good/Bad Bot Verification | cheap | 9,225 | 0.009ms | 0.014ms | 0.027ms | 0.220ms | 0.009ms |
| Browser and Device Verification | cheap | 9,225 | 0.009ms | 0.014ms | 0.028ms | 0.157ms | 0.010ms |
| Locale and Country Verification | cheap | 8,935 | 0.018ms | 0.032ms | 0.047ms | 0.515ms | 0.019ms |
| Known ThreatLevels | cheap | 8,935 | 0.006ms | 0.012ms | 0.025ms | 0.203ms | 0.008ms |
| ASN Classification | cheap | 7,371 | 0.006ms | 0.012ms | 0.026ms | 0.126ms | 0.008ms |
| Tor Node Analysis | cheap | 7,371 | 0.006ms | 0.012ms | 0.024ms | 0.110ms | 0.008ms |
| Timezone Consistency | cheap | 7,371 | 0.007ms | 0.013ms | 0.027ms | 0.066ms | 0.009ms |
| Honeypot Path | cheap | 7,371 | 0.006ms | 0.011ms | 0.024ms | 0.065ms | 0.007ms |
| KnownBadIps | cheap | 7,371 | 0.009ms | 0.017ms | 0.032ms | 0.109ms | 0.011ms |
| Behavior Rate Verification | heavy | 7,371 | 0.027ms | 0.040ms | 0.055ms | 0.804ms | 0.029ms |
| Proxy, ISP and Cookie Verification | heavy | 7,366 | 0.006ms | 0.011ms | 0.017ms | 0.129ms | 0.007ms |
| User agent and Header Verification | heavy | 7,366 | 0.135ms | 0.185ms | 0.228ms | 3.058ms | 0.142ms |
| Geo-Location Verification | heavy | 4,365 | 0.008ms | 0.012ms | 0.026ms | 0.202ms | 0.008ms |
| Session Coherence | heavy | 4,365 | 0.023ms | 0.040ms | 0.060ms | 0.302ms | 0.026ms |
| Velocity Fingerprinting | heavy | 4,365 | 0.017ms | 0.029ms | 0.046ms | 0.207ms | 0.018ms |
| Bad User Agent list | heavy | 7,371 | 1.134ms | 1.512ms | 1.824ms | 19.1ms | 1.194ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.213ms | 1.435ms | 1.648ms |
| p95 | 0.311ms | 1.837ms | 2.148ms |
| p99 | 0.367ms | 2.258ms | 2.625ms |
| max | 2.195ms | 24.1ms | 26.3ms |
| avg | 0.214ms | 1.496ms | 1.710ms |
