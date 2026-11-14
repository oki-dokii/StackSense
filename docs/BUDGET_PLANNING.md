# Budget planning and billing correction

15 November 2026. This update keeps the original requested stack separate from optional proposals. It does not purchase cloud capacity, claim a production SLA, or establish vendor residency compliance.

## Billing correction

Previously, Cloud Run identity/workers/telemetry inherited request-only duty fractions. Now request-driven replicas/SSR and full-month instance-based support allocations have separate lines. Support allocations round upward; CPU inference is treated as a resident service footprint. This removes an unjustified low-end discount. The published Iowa instance-based reference is USD 0.0792 per vCPU/2-GiB hour; an explicitly authored regional/SKU allowance remains. No free tier, promotion or commitment discount is assumed.

This narrows infrastructure bands while raising some lower bounds. Across the 30 stress briefs, none now exceeds a 5x infrastructure band, but **15 remain over budget at the lower bound**, compared with 12 before the correction. That is an exposed affordability gap, not a scoring improvement claim.

## Three distinct cost views

- `estimated_monthly_cost_usd`: infrastructure and operations, compared with the supplied infrastructure budget.
- `estimated_total_monthly_cost_usd`: adds itemized payment/SMS activity. Unknown volumes/fees are scenarios; this is not an all-inclusive bill. Taxes, labor, merchant-specific extras and new hardware remain excluded.
- `budget_planning`: lowest upper estimate among unchanged-brief complete catalog candidates, then at most one optional lower-cost changed-requirement proposal.

Phone-vs-email login changes the displayed combined total even if infrastructure stays the same. Export validation reconciles every category and rejects fabricated budget-fit labels, duplicate/no-op edits, or missing critical change conditions.

## Optional proposals

Only deployment and availability may change: a managed-cloud request with `any`/AWS preference can be rerun as a self-managed cloud VM, and a higher availability target can be explicitly lowered to 99%. All original feature flags, platforms, scale, provider preference, residency, compliance, team and priorities remain intact. The complete engine evaluates the changed copy; no original input/result is overwritten. Apply the recorded field edits manually only if accepted, then rerun to reproduce the proposal. There is no automatic Apply or deployment action.

Azure requests retain Azure. Air-gap/external-service conflicts and unsupported ML remain genuine coverage failures. P5 stays over budget; this update does not invent a cheap India Azure SKU. A 99% self-managed proposal does not provide the original resilience or eliminate compliance/vendor conditions. Operating labor, patching, TLS, capacity, database recovery and burst-CPU suitability require explicit review.

## Reviewed fixed-price VM model

The Lightsail Linux IPv4 model uses full-month 4-GiB/2-vCPU/80-GB-SSD bundles at USD 24 each. Reference CPU/memory allocations determine a rounded bundle count; a database host reserves 20 GB for its OS and adds disk above 60 GB of application data in 8-GB increments. Logical snapshots are separately charged at USD 0.05/GB-month and extra block disk at USD 0.10/GB-month. This is a sizing hypothesis, not evidence these burstable instances sustain the requested load.

Transfer accounting reserves half one bundle's allowance for inbound/other traffic and never pools every VM's quota. Mumbai's published transfer quota is halved. Actual routing, inbound volume, external object-storage delivery, cross-region traffic and overage rates require review; included transfer is not a claim that all network traffic is free.

Primary sources reviewed: [Cloud Run billing modes](https://docs.cloud.google.com/run/docs/configuring/billing-settings), [Cloud Run pricing](https://cloud.google.com/run/pricing), [Lightsail bundles](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-bundles.html), [regional endpoints](https://docs.aws.amazon.com/general/latest/gr/lightsail.html), [transfer/disk/snapshot pricing](https://aws.amazon.com/lightsail/pricing/), [instance sizing and burst capacity](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-right-size-instance.html). No competitor implementation was used.

## Public cost results

All values below are infrastructure only. Optional proposals change requirements and need explicit acceptance; payment/SMS activity remains additional and visible.

| Case | Original requested deployment | Optional proposal | Proposal infrastructure fit |
|---|---:|---:|---|
| P1 | $0.00–$0.00 | no cheaper proposal | — |
| P2 | $367.76–$1,193.62 | $104.00–$193.50 | range_risk |
| P3 | $639.32–$2,648.75 | $247.40–$390.40 | within_upper |
| P4 | $1,028.89–$3,882.82 | no cheaper proposal | — |
| P5 | $686.87–$858.06 | $346.93–$460.53 | over_budget |
| P6 | $187.90–$552.07 | $87.00–$141.00 | range_risk |

Across 30 stress inputs, 26 received a cheaper optional proposal: 15 with an upper infrastructure bound within budget, 8 with only the lower bound within budget, and 3 still over budget. These are changed-requirement proposals, not original-brief successes.

## Reproduce and limits

```sh
npm run build
node scripts/evaluate-budget.mjs
node scripts/evaluate-budget.mjs --check
npx vitest run tests/budget.test.ts
```

18 new regressions bring the application suite to 326 tests across thirteen files. [Current budget records](../evaluation/budget-results.json) and [before-change public bands](../evaluation/budget-baseline.json) preserve the comparison. The release verifier recomputes the budget and stress reports. Browser evidence includes fresh public/edge overviews, P2 JSON and P3 analysis/ADR export parity, plus scoped desktop/narrow cost checks. The unchanged invalid-result focus snapshot is retained from the earlier pass; it was not freshly reproduced in this browser pass. The checks do not establish full accessibility conformance.
