# Thirty-scenario stress evaluation

14 November 2026. These are author-designed functional cases, not organiser hidden tests or an independent quality score. Two distinct briefs cover each of the fifteen concrete project types; the `other` extension type has separate regression probes. Inputs were written before fixing the observed failures. The baseline is commit `c275cfb`.

## Findings and changes

- **Two false refusals fixed:** search-only analytics/API briefs did not infer a database, so every full-text implementation was rejected. `full_text_search` now drives persistence and its input trace.
- **One region coverage gap fixed:** AWS/US checkout could not select a core region. ECS/Fargate and RDS PostgreSQL primary mappings now cover `us-east-1` and `eu-west-1`, with existing official source IDs and dated review. External checkout residency is still critically qualified.
- **Extra client bundle avoided:** a web-only shop received Next.js + React Native on a tie. After score, cost and operating burden tie, selection prefers fewer unrequested client targets before the stable identifier. Multi-platform clients remain eligible.
- **GPU training remains infeasible:** the catalog has no reviewed GPU-training deployment/sizing profile. Returning an arbitrary CPU inference stack would conceal a missing requirement.

Official region evidence reviewed: [Fargate support](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate-Regions.html), [AWS region codes](https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html), [RDS endpoints](https://docs.aws.amazon.com/general/latest/gr/rds-service.html). These establish primary product-region availability, not complete regional contractual assurance, backup topology or SKU/version eligibility. Those remain deployment review tasks. No competitor code or content was used.

## Results

**Before:** 26 usable stacks and four refusals. **After:** 29 usable stacks and the one explicitly unsupported training case. All machine-checked invariants pass; this is functional coverage, not 96.7% recommendation accuracy.

The 46 new tests check all thirty briefs, seven language-only APIs, three provider controls, two AWS region cases, the extra-client regression, metadata/set-order invariance, and two `other`-type probes. The complete application suite passes **308 tests across twelve files**.

Selected hosting: **AWS 7, Azure 4, GCP 14, local/on-premise 4**, with one no-plan case. Holding a stateless API brief constant and changing only AWS/Azure/GCP preference changes the selected provider accordingly. No small-team case selects Kubernetes or microservices; those architectures are not selectable in the current catalog, so this does not demonstrate a sophisticated Kubernetes-vs-monolith decision.

**Remaining budget issue:** twelve briefs exceed their infrastructure budget at the lower bound. All carry budget warnings. One CPU-inference case has a band wider than 5x; the median band and individual bands remain planning assumptions rather than measured capacity. This evaluation does not solve budget feasibility, justify narrower arbitrary intervals, or include payment/SMS fees in the infrastructure headline. A future cost-model revision should compare genuine minimum-deployment alternatives, service duty cycles and explicit reduced-scope options with quoted/reference units.

| ID | Brief | Selected provider | Status | Monthly infrastructure USD | Budget USD |
|---|---|---|---|---:|---:|
| S01 | Markdown journal | none | ok_with_warnings | 34.5–169 | 25 |
| S02 | AWS documentation portal | aws | ok_with_warnings | 103.18–271.17 | 100 |
| S03 | Solo appointment tool | gcp | ok_with_warnings | 146.42–624.04 | 60 |
| S04 | Java enterprise portal | aws | ok_with_warnings | 251.4–601.63 | 500 |
| S05 | Small tenant billing dashboard | gcp | ok_with_warnings | 146.42–624.04 | 100 |
| S06 | Azure tenant workspace | azure | ok_with_warnings | 287.2–979.11 | 800 |
| S07 | India small shop | gcp | ok_with_warnings | 160.71–761.22 | 150 |
| S08 | US checkout API | aws | ok_with_warnings | 224.37–547.57 | 500 |
| S09 | EU local services | gcp | ok_with_warnings | 160.71–761.22 | 180 |
| S10 | Flutter services directory | gcp | ok_with_warnings | 146.42–624.04 | 400 |
| S11 | Small community feed | gcp | ok_with_warnings | 146.52–624.54 | 80 |
| S12 | Mobile messaging | aws | ok_with_warnings | 287.54–674.21 | 900 |
| S13 | Small shared editor | gcp | ok_with_warnings | 195–884.68 | 200 |
| S14 | Azure board | azure | ok_with_warnings | 974.32–1132.41 | 1200 |
| S15 | India collections | aws | ok_with_warnings | 260.41–619.65 | 800 |
| S16 | Internal ledger API | none | ok_with_warnings | 60.05–296.75 | 100 |
| S17 | Clinic appointments | gcp | ok_with_warnings | 146.52–624.54 | 600 |
| S18 | Offline field care | gcp | ok_with_warnings | 149.28–651.47 | 250 |
| S19 | Search-only analytics API | gcp | ok_with_warnings | 134.99–514.29 | 100 |
| S20 | Azure analytics dashboard | azure | ok_with_warnings | 287.2–979.11 | 700 |
| S21 | Device telemetry gateway | aws | ok_with_warnings | 215.36–529.55 | 300 |
| S22 | Local factory dashboard | none | ok_with_warnings | 74.65–369.75 | 100 |
| S23 | Python inference endpoint | gcp | ok_with_warnings | 43.25–413.68 | 250 |
| S24 | GPU training platform | — | infeasible | not estimated | 2000 |
| S25 | Air-gapped inventory | none | ok_with_warnings | 74.65–369.75 | 50 |
| S26 | Small PHP back office | gcp | ok_with_warnings | 146.42–624.04 | 50 |
| S27 | Turn-based game | gcp | ok_with_warnings | 190.24–850.39 | 300 |
| S28 | Small game leaderboard | aws | ok_with_warnings | 215.36–529.55 | 150 |
| S29 | Search service | gcp | ok_with_warnings | 134.99–514.29 | 120 |
| S30 | Stateless transform API | azure | ok_with_warnings | 129.28–549.75 | 100 |

## Reproduce

```sh
npm run build
node scripts/evaluate-stress.mjs
node scripts/evaluate-stress.mjs --check
npx vitest run tests/stress.test.ts
```

[Inputs and expectations](../fixtures/stress-cases.json), [before-fix observations](../evaluation/stress-baseline.json), [current records](../evaluation/stress-results.json). The release verifier recomputes the stress results, including case/catalog digests, so CI rejects stale results. Inputs are fixed and explicit; no network, randomness, LLM or paid API is required.

All six public recommendation JSON files remain byte-identical. Selected stacks, prices and overview screenshots therefore still match. Decision Lab export ordering changes because the generic tie-break also orders tied alternatives; the six analysis artifacts and current browser export are refreshed.

The runtime/test source digest binds the updated code and regression fixtures to a fresh archive setup rehearsal. Historical version numbers describe this pre-submission 0.8 release line; the Git commit and content digests distinguish its updates.
