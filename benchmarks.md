# Bot Detector — Benchmark Report

Generated on: 2026-04-01 17:55:51  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-04-01 17:55:03 UTC → 2026-04-01 17:55:45 UTC (42s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,234 |
| heavyPhase requests | 7,380 |
| total checker events | 125,122 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,234 |
| min | 0.071ms |
| p50 | 0.246ms |
| p75 | 0.307ms |
| p95 | 0.379ms |
| p99 | 0.442ms |
| max | 2.412ms |
| avg | 0.250ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,380 |
| min | 0.989ms |
| p50 | 1.364ms |
| p75 | 1.542ms |
| p95 | 1.848ms |
| p99 | 2.271ms |
| max | 21.9ms |
| avg | 1.436ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,380 |
| min | 0.022ms |
| p50 | 0.026ms |
| p75 | 0.029ms |
| p95 | 0.042ms |
| p99 | 0.059ms |
| max | 0.604ms |
| avg | 0.029ms |
|  |  |
| cache hits (<1ms) | 7,380 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,234 | 0.011ms | 0.020ms | 0.040ms | 0.403ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,234 | 0.009ms | 0.018ms | 0.036ms | 0.217ms | 0.011ms |
| Browser and Device Verification | cheap | 9,234 | 0.009ms | 0.018ms | 0.036ms | 0.163ms | 0.011ms |
| Locale and Country Verification | cheap | 8,944 | 0.018ms | 0.034ms | 0.052ms | 0.573ms | 0.021ms |
| Known ThreatLevels | cheap | 8,944 | 0.007ms | 0.016ms | 0.033ms | 0.134ms | 0.009ms |
| ASN Classification | cheap | 7,380 | 0.007ms | 0.015ms | 0.033ms | 0.095ms | 0.009ms |
| Tor Node Analysis | cheap | 7,380 | 0.006ms | 0.015ms | 0.028ms | 0.151ms | 0.009ms |
| Timezone Consistency | cheap | 7,380 | 0.008ms | 0.016ms | 0.032ms | 0.077ms | 0.010ms |
| Honeypot Path | cheap | 7,380 | 0.006ms | 0.014ms | 0.030ms | 0.073ms | 0.009ms |
| KnownBadIps | cheap | 7,380 | 0.010ms | 0.021ms | 0.036ms | 0.145ms | 0.013ms |
| Behavior Rate Verification | heavy | 7,380 | 0.026ms | 0.042ms | 0.059ms | 0.604ms | 0.029ms |
| Proxy, ISP and Cookie Verification | heavy | 7,375 | 0.007ms | 0.014ms | 0.020ms | 0.149ms | 0.008ms |
| User agent and Header Verification | heavy | 7,375 | 0.125ms | 0.179ms | 0.214ms | 2.777ms | 0.133ms |
| Geo-Location Verification | heavy | 4,374 | 0.008ms | 0.016ms | 0.030ms | 0.209ms | 0.010ms |
| Session Coherence | heavy | 4,374 | 0.025ms | 0.042ms | 0.057ms | 0.309ms | 0.027ms |
| Velocity Fingerprinting | heavy | 4,374 | 0.017ms | 0.031ms | 0.047ms | 0.227ms | 0.019ms |
| Bad User Agent list | heavy | 7,380 | 1.058ms | 1.508ms | 1.859ms | 17.4ms | 1.127ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.246ms | 1.364ms | 1.610ms |
| p95 | 0.379ms | 1.848ms | 2.227ms |
| p99 | 0.442ms | 2.271ms | 2.713ms |
| max | 2.412ms | 21.9ms | 24.4ms |
| avg | 0.250ms | 1.436ms | 1.686ms |
