# Bot Detector — Benchmark Report

Generated: 2026-03-27 18:38:01  
Based on: [http.stress.test.ts](test/e2e/http.stress.test.ts)  
Log file: `bot-detector-logs/info.log`  
Log span: 2026-03-27 18:37:03 UTC → 2026-03-27 18:37:54 UTC (52s)  

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
| min | 0.072ms |
| p50 | 0.312ms |
| p75 | 0.370ms |
| p95 | 0.516ms |
| p99 | 0.770ms |
| max | 6.720ms |
| avg | 0.316ms |


## heavyPhase

> Checkers that may involve cache lookups (BRV, session, velocity).

| Metric | Value |
|---|---|
| count | 7,387 |
| min | 1.148ms |
| p50 | 1.795ms |
| p75 | 2.208ms |
| p95 | 2.601ms |
| p99 | 3.527ms |
| max | 23.1ms |
| avg | 1.876ms |


## Behavior Rate Verification (BRV)

> Cache-hit path: pure in-memory storage get.  

> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).

| Metric | Value |
|---|---|
| total calls | 7,387 |
| min | 0.021ms |
| p50 | 0.031ms |
| p75 | 0.038ms |
| p95 | 0.056ms |
| p99 | 0.078ms |
| max | 0.697ms |
| avg | 0.034ms |
|  |  |
| cache hits (<1ms) | 7,387 (100.0%) |
| DB queries (≥1ms) | 0 (0.0%) |


## All Checkers

| Checker | Phase | n | p50 | p95 | p99 | max | avg |
|---|---|---|---|---|---|---|---|
| IP Validation | cheap | 9,241 | 0.015ms | 0.029ms | 0.063ms | 1.197ms | 0.017ms |
| Good/Bad Bot Verification | cheap | 9,241 | 0.012ms | 0.023ms | 0.057ms | 1.776ms | 0.014ms |
| Browser and Device Verification | cheap | 9,241 | 0.012ms | 0.021ms | 0.053ms | 4.043ms | 0.014ms |
| Locale and Country Verification | cheap | 8,951 | 0.024ms | 0.048ms | 0.089ms | 4.065ms | 0.027ms |
| Known ThreatLevels | cheap | 8,951 | 0.011ms | 0.018ms | 0.051ms | 0.713ms | 0.012ms |
| ASN Classification | cheap | 7,387 | 0.011ms | 0.017ms | 0.046ms | 1.603ms | 0.012ms |
| Tor Node Analysis | cheap | 7,387 | 0.010ms | 0.016ms | 0.044ms | 0.246ms | 0.011ms |
| Timezone Consistency | cheap | 7,387 | 0.011ms | 0.018ms | 0.046ms | 0.331ms | 0.012ms |
| Honeypot Path | cheap | 7,387 | 0.010ms | 0.015ms | 0.044ms | 0.400ms | 0.011ms |
| KnownBadIps | cheap | 7,387 | 0.016ms | 0.028ms | 0.060ms | 0.568ms | 0.017ms |
| Behavior Rate Verification | heavy | 7,387 | 0.031ms | 0.056ms | 0.078ms | 0.697ms | 0.034ms |
| Proxy, ISP and Cookie Verification | heavy | 7,382 | 0.008ms | 0.016ms | 0.038ms | 0.163ms | 0.010ms |
| User agent and Header Verification | heavy | 7,382 | 0.156ms | 0.244ms | 0.325ms | 5.953ms | 0.167ms |
| Geo-Location Verification | heavy | 4,381 | 0.009ms | 0.017ms | 0.038ms | 2.044ms | 0.012ms |
| Session Coherence | heavy | 4,381 | 0.028ms | 0.049ms | 0.071ms | 1.825ms | 0.032ms |
| Velocity Fingerprinting | heavy | 4,381 | 0.019ms | 0.037ms | 0.062ms | 1.021ms | 0.023ms |
| Bad User Agent list | heavy | 7,387 | 1.447ms | 2.117ms | 2.900ms | 18.1ms | 1.496ms |


## End-to-End Pipeline Estimate

> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.

| Percentile | cheapPhase | heavyPhase | combined |
|---|---|---|---|
| p50 | 0.312ms | 1.795ms | 2.107ms |
| p95 | 0.516ms | 2.601ms | 3.117ms |
| p99 | 0.770ms | 3.527ms | 4.297ms |
| max | 6.720ms | 23.1ms | 29.8ms |
| avg | 0.316ms | 1.876ms | 2.191ms |
