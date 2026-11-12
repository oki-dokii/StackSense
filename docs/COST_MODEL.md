# Cost estimation specification

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
- zero budget: recommend only genuinely viable zero-cost configurations; disclose overage limits, paid domain exclusion, and missing guarantees.

Payment transaction fees cannot be accurately modeled without volume/value. State the basis or exclusion; do not hide a potentially material charge. ML usage can dominate costs and requires a stated inference/training workload.

## Evidence and tests

Store source/date in pricing records and source IDs in result extensions. Check nonnegative finite bounds, min ≤ max, no duplicated bundle costs, regional consistency, correct unit conversion, free-tier crossing, zero budget, unknown usage, and budget boundary warnings. Revalidate prices before submission; no exact provider prices are asserted in this planning pack.
