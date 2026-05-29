# Bot Detector — Benchmark Report

Generated on: 2026-05-29 12:00:00  
By: [benchmark.py](scripts/benchmark.py)  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-05-29 11:59:11 UTC → 2026-05-29 11:59:53 UTC (42s)  

## Summary

| Metric | Value |
|---|---|
| cheapPhase requests | 9,213 |
| heavyPhase requests | 7,359 |
| total checker events | 124,765 |
| unique checkers seen | 17 |


## cheapPhase

> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).

| Metric | Value |
|---|---|
| count | 9,213 |
| min | 0.071ms |
| p50 | 0.232ms |
| p75 | 0.300ms |
| p95 | 0.376ms |
| p99 | 0.439ms |
| max | 2.581ms |
| avg | 0.242ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,359 |
| min | 1.072ms |
| p50 | 1.334ms |
| p75 | 1.470ms |
| p95 | 1.782ms |
| p99 | 2.288ms |
| max | 23.6ms |
| avg | 1.399ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,359 |
| min | 0.022ms |
| p50 | 0.026ms |
| p75 | 0.028ms |
| p95 | 0.041ms |
| p99 | 0.058ms |
| max | 0.735ms |
| avg | 0.028ms |
|  |  |
| cache hits (<1ms) | 7,359 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,213 | 0.010ms | 0.020ms | 0.040ms | 0.186ms | 0.013ms |
| Good/Bad Bot Verification | cheap | 9,213 | 0.008ms | 0.018ms | 0.037ms | 0.172ms | 0.011ms |
| Browser and Device Verification | cheap | 9,213 | 0.008ms | 0.018ms | 0.037ms | 0.151ms | 0.011ms |
| Locale and Country Verification | cheap | 8,923 | 0.017ms | 0.036ms | 0.051ms | 0.597ms | 0.020ms |
| Known ThreatLevels | cheap | 8,923 | 0.007ms | 0.016ms | 0.034ms | 0.457ms | 0.009ms |
| ASN Classification | cheap | 7,359 | 0.007ms | 0.016ms | 0.033ms | 0.239ms | 0.009ms |
| Tor Node Analysis | cheap | 7,359 | 0.006ms | 0.015ms | 0.030ms | 0.117ms | 0.009ms |
| Timezone Consistency | cheap | 7,359 | 0.007ms | 0.017ms | 0.032ms | 0.083ms | 0.009ms |
| Honeypot Path | cheap | 7,359 | 0.006ms | 0.014ms | 0.029ms | 0.068ms | 0.008ms |
| KnownBadIps | cheap | 7,359 | 0.010ms | 0.021ms | 0.036ms | 0.523ms | 0.013ms |
| Behavior Rate Verification | heavy | 7,359 | 0.026ms | 0.041ms | 0.058ms | 0.735ms | 0.028ms |
| Proxy, ISP and Cookie Verification | heavy | 7,354 | 0.007ms | 0.014ms | 0.019ms | 0.127ms | 0.008ms |
| User agent and Header Verification | heavy | 7,354 | 0.117ms | 0.174ms | 0.215ms | 3.063ms | 0.129ms |
| Geo-Location Verification | heavy | 4,353 | 0.008ms | 0.016ms | 0.032ms | 0.216ms | 0.009ms |
| Session Coherence | heavy | 4,353 | 0.025ms | 0.042ms | 0.060ms | 0.330ms | 0.027ms |
| Velocity Fingerprinting | heavy | 4,353 | 0.017ms | 0.032ms | 0.052ms | 0.240ms | 0.019ms |
| Bad User Agent list | heavy | 7,359 | 1.036ms | 1.451ms | 1.855ms | 18.6ms | 1.100ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.232ms | 1.334ms | 1.566ms |
| p95 | 0.376ms | 1.782ms | 2.158ms |
| p99 | 0.439ms | 2.288ms | 2.727ms |
| max | 2.581ms | 23.6ms | 26.2ms |
| avg | 0.242ms | 1.399ms | 1.641ms |
