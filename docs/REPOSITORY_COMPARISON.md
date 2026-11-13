# Repository comparison and improvement audit

Reviewed 13 November 2026 IST, after our independent 0.5.0 release (`1b9b36a`). Four public same-challenge repositories and one broader dependency-resolution reference were inspected at pinned commits. This is a source/artifact comparison, not a leaderboard, expert review or runtime benchmark of their systems. Their programs were not executed. No external source code was imported.

Machine-readable [repository snapshots](research/comparison/repositories.json), [our controlled probes](research/comparison/our-probes.json) and [dependency audit](research/comparison/dependency-audit.json) accompany this review. Our release remains reproducible; the engine, recommendation outputs and PDF are unchanged by this audit.

## Comparison

| Repository / inspected snapshot | Useful capability observed | Limits relevant to comparison | Implication for StackSense |
|---|---|---|---|
| [shinjan-2006/StackSense](https://github.com/shinjan-2006/StackSense/tree/5f6850bfe379b4cb8c6a8a1516c0888454ef6c6a) | Browser-local, dependency-free setup; explicit production verification, existing-system action plans and budget-fit pilot presentation | Its six usable committed outputs include conditional evaluation designs. Cost assumptions exclude separately metered SMS and payment transaction fees | Add evidence-resolution checklists and separately labeled exploratory designs. Keep estimates and exclusions visible |
| [amantebriwal4321/stacksense-engine](https://github.com/amantebriwal4321/stacksense-engine/tree/2430f4329803e93878034c37f0c44e6b716b33de) | Python standard-library setup, optional Docker, explicit existing-database reuse and lifecycle interpretation; behavioral assertions | Six usable committed outputs use their own provider/price/contract assumptions. Our review did not validate their deployment or price facts | Make existing Entra/SQL Server integration concrete and distinguish incremental reuse cost from a new managed database |
| [NITISH-027/StackSense26](https://github.com/NITISH-027/StackSense26/tree/b1f9e1e145208f53d2cee5991ad8f8ddca377887) | Curated layer catalogs, supporting-service rules, CLI/UI and edge-case examples | The edge runner explicitly prints results without asserting failure. Committed P2 is `ok` with a USD 102–624 band against USD 150; coverage counts alone do not establish warning/contract correctness | Preserve executable invariants and upper-budget risk reporting; review capabilities and output semantics separately |
| [akshaykp123/StackSense](https://github.com/akshaykp123/StackSense/tree/66c1da36b0ca5349e118c1be985a7451765748e1) | Modular TypeScript engine, Zod contracts and generated architecture diagrams | At this snapshot, an empty filtered pool can fall back to the unfiltered layer. Cost upper bounds depend on budget; core layers are selected separately. No public output snapshots or npm test script were found | Preserve hard-filter failures and complete-plan compatibility; compute costs from usage first, then compare with budget |
| [thoth-station/adviser](https://github.com/thoth-station/adviser/tree/de8cf66e01ab4aacec8c69f505388ea14be7df01) | Composable resolution pipelines, dependency/runtime context and CVE filtering | It solves Python dependency/version resolution, not this architecture challenge. Inspected source is a historical reference; current service operation was not verified | Add richer version/lifecycle evidence over time. A larger resolver is not needed to replace our bounded architecture search |

Key source anchors: [verification and evaluation/production policy](https://github.com/shinjan-2006/StackSense/blob/5f6850bfe379b4cb8c6a8a1516c0888454ef6c6a/engine.js#L350), [pilot UI](https://github.com/shinjan-2006/StackSense/blob/5f6850bfe379b4cb8c6a8a1516c0888454ef6c6a/app.js#L210), [database reuse](https://github.com/amantebriwal4321/stacksense-engine/blob/2430f4329803e93878034c37f0c44e6b716b33de/stacksense/decide.py#L1377), [assertion-based tests](https://github.com/amantebriwal4321/stacksense-engine/blob/2430f4329803e93878034c37f0c44e6b716b33de/tests/test_engine.py#L105), [inspection-only edge runner](https://github.com/NITISH-027/StackSense26/blob/b1f9e1e145208f53d2cee5991ad8f8ddca377887/source/tests/run_edge_cases.py#L1), [filter fallback](https://github.com/akshaykp123/StackSense/blob/66c1da36b0ca5349e118c1be985a7451765748e1/lib/engine/filters.ts#L135), [cost model](https://github.com/akshaykp123/StackSense/blob/66c1da36b0ca5349e118c1be985a7451765748e1/lib/engine/decisionEngine.ts#L39), [Thoth pipeline](https://github.com/thoth-station/adviser/blob/de8cf66e01ab4aacec8c69f505388ea14be7df01/docs/source/pipeline.rst#L1) and [CVE filter](https://github.com/thoth-station/adviser/blob/de8cf66e01ab4aacec8c69f505388ea14be7df01/thoth/adviser/sieves/cve.py#L46).

## Public coverage: what the numbers mean

The three repositories with committed public outputs have the same six input objects as our supplied fixture array, verified structurally. Each commits six non-null stacks. Ours returns two usable stacks and four evidence-relative infeasible results. These are published artifacts, not independently reproduced successes of their current code.

Our four blockers are a material recommendation-quality gap. The alternatives illustrate different approval policies, including evaluation-only designs with production checks pending. Returning a stack under that policy does not establish that an equivalent strict residency requirement has been proved. Our current policy should be made more useful without silently converting missing evidence into approval.

Our strengths have direct evidence: exhaustive compatible core completion before ranking, schema/output invariants, source scopes, explicit price line assumptions, null no-plan stacks, integer-cent arithmetic, exact CLI/API parity and cross-platform CI. They do not prove that our technology choices or cost calibration are superior.

## Costs require aligned scope

| P3 committed estimate | Monthly USD band | Important scope |
|---|---:|---|
| Our release | 875.51–7785.95 | Includes unknown payment volume/value envelopes and explicit reference-allocation assumptions |
| shinjan snapshot | 111–586 | Published assumptions exclude payment transaction fees and separately metered SMS |
| amantebriwal snapshot | 260–958 | Published assumptions exclude payment gateway percentage fees; uses different capacity/provider bands |
| NITISH snapshot | 92–404 | Different candidate/cost-tier assumptions; estimate not independently validated here |

These are not equivalent quotes. In our own controlled P3 experiment, supplying zero monthly payment transactions changes the band to **875.51–5285.95**. USD 2,500 of our original upper bound is the assumed unknown payment volume. The remaining difference still needs real capacity and tariff validation; removing fees does not calibrate the model.

## Controlled probes on our engine

These input edits locate blockers; they are **not** recommendations that satisfy the original public scenarios.

- P2: changing only phone authentication leaves the payment-residency blocker; disabling only payments leaves phone delivery blocked. Both are real independent evidence gaps.
- P6: changing phone OTP to email/password while retaining India residency produces a warned native/offline design at USD 81.42–508.55. This shows where coverage work should focus; it does not fulfill the original phone-login requirement.
- P5: allowing any cloud while retaining India residency and existing Entra still leaves the identity-scope blocker. Adding Azure alone will not resolve the complete case.
- P3: explicit usage inputs materially change the cost estimate, supporting a sensitivity view instead of an unexplained single cost range.

Reproduce with `npm run build` followed by `node scripts/review-probes.mjs`. The original inputs/outputs remain unchanged.

## Work with the highest expected value

1. **Resolve service and existing-system evidence.** Review the exact Azure compute/database/storage products, tenant identity scope, regional SMS delivery and payment data flows. Add a selectable profile only with scoped primary evidence; preserve unsupported variants as gaps. This directly targets P2/P4/P5/P6.
2. **Explain how blocked designs can progress.** Export per-field evidence requests, affected components and verification tasks. Optionally show an explicitly unverified exploratory design outside the approved `stack`, retaining null stack and original infeasible status. Evidence gaps, real contradictions and internal search failures must remain distinct.
3. **Calibrate costs and expose sensitivity.** Separate infrastructure, payment/SMS activity and capacity assumptions in the UI. Show quantities, rate basis, provider/region and exact source links; obtain independently reviewed sizing examples. Never clip prices to a requested budget.
4. **Model existing integration explicitly.** Capture the system of record, protocol/network path, tenant location, version/support status, ownership and license assumptions. Distinguish reuse from migration and price incremental resources only when justified.
5. **Compare complete alternatives.** Present several feasible whole plans with differences in score, cost, operations and constraints. Show equal-score ties and preference sensitivity; do not present heuristic scores as confidence probabilities.
6. **Broaden external validation.** Keep independent expected invariants and obtain a documented architecture review. Add a fuller browser/accessibility pass and current lifecycle/version evidence. Our own authored tests are necessary but not independent calibration.

Acceptance criteria and dependencies are in [the improvement backlog](IMPROVEMENT_BACKLOG.md). These are future implementation tasks, not claimed delivered features.

## Improvement implemented during this audit

The release verifier previously hashed each screenshot but did not compare the saved capture-input hash with `evaluation/ui-scenarios.json`. A changed batch could therefore retain apparently valid screenshot evidence. The new binding check rejects missing, malformed or mismatched capture provenance, with three isolated Node regression tests and a CI step.

`node --test scripts/tests/evidence-bindings.test.mjs` and `npm run verify:release` pass. The ordinary engine/integration suite remains 201 tests. The current registry dependency audit reports **zero known advisories** for the checked lockfile; this is not a complete security assessment.

The recommendation engine, standard output schema, original six scenarios, generated recommendation snapshots and verified PDF retain their 0.5.0 contents. The refreshed source ZIP includes this post-release audit/tooling; its runtime/test-source digest is checked against the original setup rehearsal. Third-party implementation code was not added to our release.
