# Cost estimation specification

Current budget-planning implementation: [method and evidence](BUDGET_PLANNING.md). Always-on support has a full-month floor; activity fees are included in an additional reconciled total. The original infrastructure budget comparison remains explicit. Optional changed-requirement proposals do not replace the baseline.

Implemented Phase 3 details and limits: [phase evidence](PHASE_3.md). The specification below includes future refinements; current rates contain published references and explicitly authored envelopes, not exact region-specific quotations.

## Output and meaning

Return `estimated_monthly_cost_usd: {min, max, assumptions[]}`. Estimates are order-of-magnitude operating bands, not quotes. Project convention: estimate the expected month-12 operating footprint and label that horizon; optionally add launch cost as an extension. Budget comparison uses the same horizon. If no stack exists, 0–0 is a structural placeholder with a “no estimate” assumption; never render it as a free solution.

## Categories

Compute/hosting, database/storage/backups, network/CDN/egress, object storage, cache/queue/search, auth/OTP, realtime service, observability, paid CI/CD when needed, ML inference/training, and payment-service costs where estimable. Identify included taxes/support and exclusions. Development salaries are excluded from infrastructure; explicitly exclude or separately show domain registration and one-time hardware. On-premise is not automatically zero cost: distinguish existing licensed hardware from incremental operating cost.

## Calculation

Each deployment price model records currency USD, source URL/date, region, billing unit, included allowance, lower/upper usage assumptions, tier thresholds, and fixed minimum. Sum components using integer micro-USD or decimal-safe arithmetic; round displayed bounds outward to avoid understating. Avoid double-counting bundled auth/storage/database allowances. Estimate services at a compatible topology (e.g., replica/backups for availability), not the cheapest single-node headline price.

```text
component band = fixed monthly band + Σ billable usage band × unit-price band
plan band = sum of non-overlapping component bands
```

Unknown requests, egress, transaction value, SMS counts, or token usage must produce visible assumptions and sensitivity notes. Registered users alone do not determine request rate. Optional `extensions` may supply missing usage. Preserve a reproducible default usage profile with ID/version and disclose every inferred quantity.

## Budget outcomes

- max ≤ budget: affordable under stated assumptions; still disclose free-tier/usage limits.
- min ≤ budget < max: `BUDGET_RANGE_RISK`, warning status.
- budget < min: `BUDGET_EXCEEDED`; offer explicit reduced scope or mark infeasible when no viable plan.
- zero budget: disclose free-tier limits and exclusions for zero-cost designs. If required dynamic features incur costs, return an explicitly over-budget warning design under ADR-004; never claim it fits the zero budget.

Payment transaction fees cannot be accurately modeled without volume/value. State the basis or exclusion; do not hide a potentially material charge. ML usage can dominate costs and requires a stated inference/training workload.

## Evidence and tests

Store source/date in pricing records and source IDs in result extensions. Check nonnegative finite bounds, min ≤ max, no duplicated bundle costs, regional consistency, correct unit conversion, free-tier crossing, zero budget, unknown usage, and budget boundary warnings. Revalidate prices before submission; no exact provider prices are asserted in this planning pack.

## Paid managed variants and traffic assumptions (15 November)

Registered/month-12 population is no longer equated to daily activity. Absent explicit RPS, the authored default daily-active fraction is 0.2, floored at supplied peak concurrency, with 50 requests/active user/day. `daily_active_user_fraction` accepts 0–1; explicit RPS overrides it and leaves the fraction unapplied. These are scenario assumptions, not empirical usage research. MAU/SMS/payment defaults still use the full population.

Vercel Pro uses every team member as a paid deploying seat at USD 20; one USD 20 team usage credit offsets compute/invocations/build/CDN meters once. Current on-demand transfer/request/origin prices have no unverified legacy included Pro allowance. Authored 10–30 ms CPU and 100–300 ms wall time per request at 1 GiB require measurement. Minute-scale bounded Cron drains are charged separately in usage; direct signed uploads avoid function payload limits. Supabase Pro charges one project, hourly compute minus one credit, storage/MAU/realtime/egress overages and separate file backup. Neon Launch uses CU-hour, storage/history and backup-export allowances. Fly uses always-on shared-CPU Machines and an explicit regional price allowance; no India mapping.

The primary ranks known backend language, then upper-bound budget fit within that tier, then weighted fit and stable ties. It does not replace a JVM-only team with an unfamiliar functions runtime solely to fit budget. Optional changed-requirement proposals remain separate. No finite catalog can promise a budget fit: P2/P5/P6 gaps remain visible in the generated outputs.
