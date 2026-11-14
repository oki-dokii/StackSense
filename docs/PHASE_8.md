# Phase 8: reference workload and reproducible measurements

Implemented 14 November 2026 IST. This phase starts the capacity-evidence roadmap with a local reference recipe. Application 0.7.0, recommendation engine 0.6.0 and analysis 0.1.0 remain unchanged. No recommendation output, catalog price or capacity coefficient is recalibrated from these results.

## What runs

`benchmarks/reference/workload.mjs` starts a separate Node HTTP process on an ephemeral IPv4 loopback port. Its deterministic catalog contains 10,000 products. Four out of every five scheduled requests read one product; every fifth scans the catalog for a category and returns 100 products. The generator checks status and response fields, consumes JSON bodies, and records timeouts, errors and latency for every measured request. The workload has no persistence or external dependencies.

The checked-in profile specifies 50 serial warmup requests, concurrency 1/4/16, at most 2 seconds or 20,000 samples per stage, 2-second request timeout, zero think time and no retries. Warmup is excluded from stage metrics. Outstanding requests drain before stage timing ends. The deterministic sequence restarts in each stage; category queries visit multiples of five. This is a deliberately skewed synthetic distribution, not an observed customer trace.

```sh
node benchmarks/reference/run.mjs --out tmp/calibration/new-run
node benchmarks/reference/verify.mjs tmp/calibration/new-run
node --test scripts/tests/calibration.test.mjs
```

The output directory must be new; its parent is created automatically. No external-target argument is accepted. The runner exits 1 on failed acceptance or execution errors. The verifier exits 1 for integrity errors; a verified historical result can legitimately have `passed: false`. Read that acceptance field separately.

## Artifacts and acceptance

- `summary.json`: actual runtime/OS/CPU/memory, canonical profile digest, workload/runner/default-profile digests, warmup/stage settings, nearest-rank latency percentiles, throughput, errors, cap flags and individual acceptance checks.
- `samples-N.jsonl`: all measured requests with index, operation, input ID, latency, status, correctness result and error class. SHA-256 digests are included in the summary.
- Child-process CPU and peak RSS span warmup and every stage; they are not per-request resource measurements. The generator runs on the same host and competes for resources.
- Each stage passes only when p95 ≤100 ms, error rate =0 and at least 100 requests complete. These are author-defined reference smoke gates, not project SLOs or provider promises. Hardware-specific performance thresholds are not CI gates.
- The independent verifier checks raw hashes, source hashes, sample indices/mix, percentiles, counts, throughput arithmetic and acceptance decisions. Hashes detect accidental change; they are not a signature or independent attestation.

The [committed measured run](../evaluation/calibration/reference-run-1/summary.json) has 56,687 requests and zero errors. Concurrency 4 and 16 hit the sample cap after approximately 1.385 and 1.289 seconds. Their shorter elapsed durations are preserved, rather than described as full two-second measurements.

| Concurrency | Requests | Elapsed seconds | Requests/second | p95 ms | Cap reached |
|---|---:|---:|---:|---:|---|
| 1 | 16,687 | 2.000 | 8,343 | 0.225 | No |
| 4 | 20,000 | 1.385 | 14,445 | 0.403 | Yes |
| 16 | 20,000 | 1.289 | 15,514 | 2.445 | Yes |

Five native tests cover nearest-rank and threshold boundaries, rejection of unbounded profiles, corrupt/incomplete bodies, a real child HTTP run, deliberate failed minimum-sample acceptance, overwrite refusal and raw-evidence tampering. CI runs those correctness checks across its OS/Node matrix. It does not assert the local throughput numbers.

## Method choices and research

[Grafana k6 thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/) motivate explicit metric acceptance and a failing outcome; k6 itself is not used or claimed to have run. Node's [versioned performance APIs](https://nodejs.org/docs/latest-v22.x/api/perf_hooks.html) provide monotonic timing. The [k6 open/closed model explanation](https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/open-vs-closed/) describes why closed-loop request rates decrease when responses slow down. Our fixed-worker loop therefore cannot establish behavior under a fixed arrival rate and can hide demand during stalls. Research informs this limitation, rather than correcting the measurements after the fact.

## Boundary and next gate

This recipe measures Node HTTP and in-memory reads/filtering on one host. It does not measure StackSense recommendation speed, PostgreSQL, Fastify, Cloud Run, network/TLS, authentication, payments, persistence, multi-region behavior, SLA, monthly cost or production capacity. There is no cost-per-request conversion and no automatic engine override. One short run does not establish repeatability or saturation.

The next calibration gate requires a selected-stack recipe with a real database, pinned deployment/resources/region, realistic payload and data sizes, an independently specified open arrival-rate profile, repeated steady-state runs, external generator, observed billing and reviewed mapping from workload to cost coefficients. Follow that with source freshness review, accessibility/browser QA, and independent owner/architecture review. Do not deploy paid cloud resources merely to complete this local phase.

The existing 25-page report remains the reviewed Phase 7 report. This Phase 8 record and the expanded README accompany the refreshed source archive; the report's engine/application claims remain current, but it does not claim to contain the new workload experiment.
