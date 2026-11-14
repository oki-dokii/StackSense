# Phase 7: Decision Lab

Implemented 14 November 2026 IST. **Application 0.7.0; analysis 0.1.0; recommendation engine/rules/services remain 0.6.0; core catalog 0.4.0.** The ordinary recommendation objects remain byte-for-byte unchanged. Research, rejected ideas and the next measurement work are in [the feature-selection review](PHASE_7_RESEARCH.md).

## Delivered

- **25 actual priority settings:** baseline plus four other values for each of six priorities, one axis at a time. Shows retained winners, switches and displayed equal-score alternatives. This is neither exhaustive interaction analysis nor a confidence probability.
- **All-candidate tradeoff front:** detached scalar metadata from every completed candidate, not a top-three sample. Minimize monthly cost upper bound and operated component units while maximizing the original-priority score. The browser provides a chart and an accessible plan selector. The original recommendation is unchanged by inspection. All scores/costs retain their stated model limitations.
- **Bounded functional experiments:** test eligible single/pair changes to phone login, payments, offline/search or unsupported ML on copies. Infrastructure/residency/provider/deployment, compliance, tenant isolation, availability, budget, team and timeline stay fixed. Original infeasibility is retained. A successful hypothetical is a different project, not an approved solution to the original request. No automatic Apply button or assertion-based evidence bypass.
- **Proposed ADR and evidence passport:** exact JSON and escaped Markdown exports with the original result, alternatives, input SHA-256, versions, scoped references, warnings, limits and owner-review status. The ADR does not claim acceptance or deployment.
- **Separate adapters:** `POST /api/analyze` accepts one brief; `npm run --silent analyze -- --input scenario.json --format json|adr` writes to stdout. Original `recommend` commands/API remain unchanged. Analysis schemas and runtime invariants distinguish this artifact from an ordinary recommendation.
- **Focused safeguards:** existing same-origin/body limits; bounded work; detached candidate projection; strict analysis schema; no unsafe hashing/speculation for invalid input; stale analysis exports hidden after edits; keyboard-scrollable readable mobile chart/table.

## Actual examples

- P3: all **168** completed plans, **12** nondominated plan identifiers under the three declared objectives; original winner retained in **25/25** settings. Equal-score alternatives remain, so this is not evidence of unique superiority.
- P2: six eligible variants; smallest successful found uses two functional edits (phone login and payments). The changed design is warned and over budget. Original P2 stays infeasible.
- P6: a one-edit phone-login experiment exists under unchanged India constraints. It does not satisfy the original phone-login requirement.
- P5: no eligible experiment resolves tenant scope. The tool does not pretend a functional edit authenticates Entra geography.

## Verification

**235 Vitest tests across nine files**, plus three Node capture-provenance checks. Tests include direct reruns, full candidate coverage, an independent dominance predicate, protected fields, original-result immutability, unsafe/cyclic input, deterministic ordering, detached projection mutation, schema/counter failures, API parity/origin restrictions and CLI JSON/ADR exports with original exit status.

Actual browser: P3 full-space exploration and alternative inspection; P2 explicit changed-project/budget warnings; exact P3/P2 JSON and P3 Markdown parity; stale original and analysis exports blocked/removed after editing; 360 px document width with a readable 600 px chart inside a labeled 284 px scroll container; no error logs in final checked flows. This is focused local QA, not full accessibility or cross-browser certification.

[Actual six analysis artifacts and measurements](../evaluation/decision-lab-results.json), [browser evidence](../evaluation/phase7-browser-checks.json). `node scripts/evaluate-lab.mjs` regenerates artifacts and measures 18 loopback requests after warm-up. `npm run verify:release` now rejects stale/missing analysis files and stale feature captures in addition to the ordinary release checks. Setup uses a populated offline npm cache; measured response time does not calibrate suggested stacks.

## Limits and next phases

The research does not establish “must-win” features or a superiority score. The current implementation provides a distinctive, testable decision workflow. The recommendation engine/catalog limitations and four public evidence blockers persist.

Next: a reproducible single-workload calibration recipe with pinned deployment/environment, meaningful load profile, raw results and measured pass/fail criteria; reviewed source/price/version diffs; independent architecture review; broader lifecycle/private integration scope and fuller accessibility/uncached-machine QA. No k6 deployment, legal assurance or independent expert review is claimed delivered here.
