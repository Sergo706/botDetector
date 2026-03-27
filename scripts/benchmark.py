#!/usr/bin/env python3
"""
Bot Detector — Log Benchmark Reporter
Usage:
    python3 scripts/benchmark.py [log_file] [output_file]

Defaults:
    log_file = bot-detector-logs/info.log
    output_file = bot-detector-logs/benchmark.md
"""

import sys
import json
import statistics
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict

LOG_FILE = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("bot-detector-logs/info.log")
OUT_FILE = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("bot-detector-logs/benchmark.md")

CHECKER_ORDER = [
    "IP Validation",
    "Good/Bad Bot Verification",
    "Browser and Device Verification",
    "Locale and Country Verification",
    "Known ThreatLevels",
    "ASN Classification",
    "Tor Node Analysis",
    "Timezone Consistency",
    "Honeypot Path",
    "KnownBadIps",
    "Behavior Rate Verification",
    "Proxy, ISP and Cookie Verification",
    "User agent and Header Verification",
    "Geo-Location Verification",
    "Session Coherence",
    "Velocity Fingerprinting",
    "Bad User Agent list",
]

CHEAP_CHECKERS = {
    "IP Validation",
    "Good/Bad Bot Verification",
    "Browser and Device Verification",
    "Locale and Country Verification",
    "Known ThreatLevels",
    "ASN Classification",
    "Tor Node Analysis",
    "Timezone Consistency",
    "Honeypot Path",
    "KnownBadIps",
}



def parse(path: Path):
    phase_times: dict[str, list[float]] = defaultdict(list)   # "cheapPhase" / "heavyPhase"
    checker_times: dict[str, list[float]] = defaultdict(list)
    timestamps: list[float] = []

    with path.open() as f:
        for raw in f:
            raw = raw.strip()
            if not raw:
                continue
            try:
                d = json.loads(raw)
            except json.JSONDecodeError:
                continue

            ts = d.get("time")
            if ts:
                try:
                    timestamps.append(
                        datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp()
                    )
                except ValueError:
                    pass

            event = d.get("event")
            dur = d.get("durationMs")

            if event != "end" or dur is None:
                continue

            phase = d.get("phase")
            check = d.get("check")

            if phase in ("cheapPhase", "heavyPhase"):
                phase_times[phase].append(dur)
            elif check:
                checker_times[check].append(dur)

    return phase_times, checker_times, timestamps



def pct(data: list[float], p: float) -> float:
    if not data:
        return 0.0
    return data[int((len(data) - 1) * p)]


def stats(data: list[float]) -> dict:
    if not data:
        return {}
    s = sorted(data)
    return {
        "n": len(s),
        "min": s[0],
        "p50": pct(s, 0.50),
        "p75": pct(s, 0.75),
        "p95": pct(s, 0.95),
        "p99": pct(s, 0.99),
        "max": s[-1],
        "avg": statistics.mean(s),
    }


def fmt(v: float) -> str:
    if v >= 1000:
        return f"{v:,.0f}ms"
    if v >= 10:
        return f"{v:.1f}ms"
    return f"{v:.3f}ms"



def row(*cells) -> str:
    return "| " + " | ".join(str(c) for c in cells) + " |"


def header(*cells) -> str:
    sep = "|" + "|".join("---" for _ in cells) + "|"
    return row(*cells) + "\n" + sep


def phase_table(label: str, s: dict) -> str:
    if not s:
        return f"_No data for {label}_\n"
    lines = [
        header("Metric", "Value"),
        row("count", f"{s['n']:,}"),
        row("min", fmt(s["min"])),
        row("p50", fmt(s["p50"])),
        row("p75", fmt(s["p75"])),
        row("p95", fmt(s["p95"])),
        row("p99", fmt(s["p99"])),
        row("max", fmt(s["max"])),
        row("avg", fmt(s["avg"])),
    ]
    return "\n".join(lines) + "\n"


def checker_table(checker_times: dict[str, list[float]]) -> str:
    lines = [
        header("Checker", "Phase", "n", "p50", "p95", "p99", "max", "avg"),
    ]
    for name in CHECKER_ORDER:
        data = checker_times.get(name)
        if not data:
            continue
        s = stats(data)
        phase = "cheap" if name in CHEAP_CHECKERS else "heavy"
        lines.append(row(
            name, phase,
            f"{s['n']:,}",
            fmt(s["p50"]),
            fmt(s["p95"]),
            fmt(s["p99"]),
            fmt(s["max"]),
            fmt(s["avg"]),
        ))
    return "\n".join(lines) + "\n"


def brv_table(data: list[float]) -> str:
    if not data:
        return "_No BRV data found_\n"
    s = stats(data)
    cache_hits = [t for t in data if t < 1.0]
    db_queries  = [t for t in data if t >= 1.0]
    total = len(data)

    lines = [
        header("Metric", "Value"),
        row("total calls", f"{total:,}"),
        row("min", fmt(s["min"])),
        row("p50", fmt(s["p50"])),
        row("p75", fmt(s["p75"])),
        row("p95", fmt(s["p95"])),
        row("p99", fmt(s["p99"])),
        row("max", fmt(s["max"])),
        row("avg", fmt(s["avg"])),
        row("", ""),
        row("cache hits (<1ms)", f"{len(cache_hits):,} ({100*len(cache_hits)/total:.1f}%)"),
        row("DB queries (≥1ms)", f"{len(db_queries):,} ({100*len(db_queries)/total:.1f}%)"),
    ]
    if db_queries:
        db_s = stats(db_queries)
        lines.append(row("DB query p50", fmt(db_s["p50"])))
        lines.append(row("DB query max", fmt(db_s["max"])))
    return "\n".join(lines) + "\n"



def main():
    if not LOG_FILE.exists():
        print(f"Log file not found: {LOG_FILE}", file=sys.stderr)
        sys.exit(1)

    print(f"Parsing {LOG_FILE} …")
    phase_times, checker_times, timestamps = parse(LOG_FILE)

    cheap_s  = stats(phase_times.get("cheapPhase", []))
    heavy_s  = stats(phase_times.get("heavyPhase", []))
    brv_data = checker_times.get("Behavior Rate Verification", [])

    span_str = "unknown"
    if len(timestamps) >= 2:
        span_sec = max(timestamps) - min(timestamps)
        t_start  = datetime.fromtimestamp(min(timestamps), tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        t_end    = datetime.fromtimestamp(max(timestamps), tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        span_str = f"{t_start} → {t_end} ({span_sec:.0f}s)"

    total_cheap  = cheap_s.get("n", 0)
    total_heavy  = heavy_s.get("n", 0)
    total_events = sum(len(v) for name, v in checker_times.items() if name in CHECKER_ORDER)

    md = []
    md.append("# Bot Detector — Benchmark Report\n")
    md.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  ")
    md.append(f"Based on: `http.stress.test.ts`  ")
    md.append(f"Log file: `{LOG_FILE}`  ")
    md.append(f"Log span: {span_str}  \n")

    md.append("## Summary\n")
    md.append(header("Metric", "Value"))
    md.append(row("cheapPhase requests", f"{total_cheap:,}"))
    md.append(row("heavyPhase requests", f"{total_heavy:,}"))
    md.append(row("total checker events", f"{total_events:,}"))
    md.append(row("unique checkers seen", str(sum(1 for n in checker_times if n in CHECKER_ORDER))))
    md.append("")

    md.append("\n## cheapPhase\n")
    md.append("> All 9–11 cheap checkers combined (MMDB/LMDB memory-mapped reads, no I/O).\n")
    md.append(phase_table("cheapPhase", cheap_s))

    md.append("\n## heavyPhase\n")
    md.append("> Checkers that may involve cache lookups (BRV, session, velocity).\n")
    md.append(phase_table("heavyPhase", heavy_s))

    md.append("\n## Behavior Rate Verification (BRV)\n")
    md.append("> Cache-hit path: pure in-memory storage get.  \n")
    md.append("> DB-query path: MySQL `SELECT` on first-ever visit (cold miss).\n")
    md.append(brv_table(brv_data))

    md.append("\n## All Checkers\n")
    md.append(checker_table(checker_times))

    md.append("\n## End-to-End Pipeline Estimate\n")
    md.append("> cheapPhase + heavyPhase combined (no early-exit). Blocking latency added to each request.\n")
    if cheap_s and heavy_s:
        e2e_lines = [header("Percentile", "cheapPhase", "heavyPhase", "combined")]
        for label, cp_key, hp_key in [
            ("p50", "p50", "p50"),
            ("p95", "p95", "p95"),
            ("p99", "p99", "p99"),
            ("max", "max", "max"),
            ("avg", "avg", "avg"),
        ]:
            cp = cheap_s[cp_key]
            hp = heavy_s[hp_key]
            e2e_lines.append(row(label, fmt(cp), fmt(hp), fmt(cp + hp)))
        md.append("\n".join(e2e_lines) + "\n")
    else:
        md.append("_Insufficient data_\n")

    output = "\n".join(md)
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(output)
    print(f"Report written to {OUT_FILE}")
    print(f"  cheapPhase:  {total_cheap:,} requests")
    print(f"  heavyPhase:  {total_heavy:,} requests")
    print(f"  BRV cache hit rate: {100*len([t for t in brv_data if t < 1])/len(brv_data):.1f}%" if brv_data else "  BRV: no data")


if __name__ == "__main__":
    main()