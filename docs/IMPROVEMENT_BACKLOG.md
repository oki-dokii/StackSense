# Current gap ledger

See [release 0.9.0 gap closure](REMAINING_GAPS.md) for current implementation and evidence status. The assessment below is historical; its old four-infeasible outcome is superseded by current generated outputs.

# Prioritized improvements after the repository comparison

Assessment: 13 November 2026 IST. [Comparison evidence and limits](REPOSITORY_COMPARISON.md). This queue now includes partial/delivered Phase 6 work; the status column distinguishes implementation from missing project evidence. Effort is an engineering planning estimate; evidence availability can dominate it.

| Priority | Work | Acceptance gate | Dependencies / effort | Phase 6 status |
|---|---|---|---|---|
| P0 | Complete regional/service evidence | Public P2/P4/P5/P6 blockers are resolved only when exact service/data-flow scope is supported; mismatched regions/providers still reject. Record remaining contracts/configuration explicitly | Primary vendor/tenant scope; medium/high | Partial: separate Azure India profile; OTP/payment/tenant evidence remains open |
| P0 | Per-field blocker-resolution tasks | An infeasible result names each affected requirement, evidence needed and next review action. No hidden input edits or fabricated costs; stack stays null | Diagnostic design; small/medium | Delivered structured resolution tasks and UI |
| P0 | Existing-system integration design | Entra and SQL Server cases identify reuse vs migration, network/protocol/region/license assumptions and incremental cost. Unsupported identity scope stays unverified | Azure profiles + scoped integration evidence; medium | Delivered scoped review tasks; approved reuse/adapters and project quotes remain open |
| P1 | Cost categories and sensitivity | UI distinguishes infrastructure vs variable fees; every line exposes units/rates/sources. Changed usage produces explainable deltas; unknown usage is never hidden | Existing cost model + reviewed examples; medium | Delivered categories/sensitivity/rate links; independent sizing and full quote calibration open |
| P1 | Feasible complete-plan comparison | Several compatible whole plans, score/cost/operations deltas, ties and retained constraints are visible. No independently selected incompatible layers | Rank/explanation interface; medium | Delivered top-three complete plans/ties; automatic preference sensitivity open |
| P1 | Independent quality review | Recorded reviewer criteria and disagreements; several unseen cases assessed before changing rules. Reviewer conclusions are attributed accurately | Qualified reviewer and time; variable | Open: no independent reviewer claimed |
| P2 | Version/lifecycle coverage | Supported versions and dated evidence for more products, including extended support vs EOL distinctions. No guessing from a product-family name | Official lifecycle/source research; medium | Partial: targeted SQL 2019 context; broader version pinning open |
| P2 | UI/accessibility evaluation | Keyboard-only import/run/review/export, screen-reader labels/errors, mobile tables and contrast checked; fixes have actual browser evidence | Browser QA; medium | Partial: focused keyboard/mobile QA; comprehensive audit open |
| P2 | Portable preview path | Fresh setup works on an actual uncached machine; compare value of static/browser-local packaging against current shared local API architecture | Build/dependency design; medium/high | Open: refreshed cached setup; uncached machine still needed |

Suggested sequence: regional/identity evidence and blocker guidance first; then incremental reuse and cost calibration; then complete-plan comparison and wider validation. Broadening catalog names alone will not resolve unsupported data flows.

An evaluation-only proposal mode should be a separate, opt-in design. The original standard input must continue to produce an honestly scoped result without silently relaxing residency, compliance, deployment or provider constraints. User-supplied review references are attestations, not independently authenticated contracts.

Before publishing a changed engine: bump relevant versions, add independent invariant tests, rerun public and author-designed cases, regenerate outputs/screenshot evidence and sensitivity data, repeat relevant measurements, update/render the PDF and rebuild/reverify the package. Approval of an exploratory design must not be inferred from its presentation.

Implementation evidence: [Phase 6](PHASE_6.md). Original public requirements remain unchanged; four evidence-relative infeasible results persist.

## Phase 7 follow-up

[Decision Lab](PHASE_7.md) now provides full completed-candidate tradeoff exploration, one-at-a-time priority trials, bounded functional experiments and proposed ADR/evidence exports. These narrow the plan-comparison/preference-explanation backlog but do not provide global sensitivity, current vendor/tenant contracts, measured capacity or independent quality calibration. [Prioritized research plan](PHASE_7_RESEARCH.md).

## Phase 8 follow-up

[Local reference measurement](PHASE_8.md) is implemented with raw evidence, explicit acceptance, tamper detection and failure tests. Deployed-stack cost calibration remains open: add actual database/resources/region, externally generated open-arrival-rate load, repeated measurements and billing. The local in-memory recipe provides no capacity or price update for existing recommendations.

## Phase 9 follow-up

[Fastify/PostgreSQL measurements](PHASE_9.md) add a real database, scheduled arrivals and repeated stages. This narrows the workload-evidence gap. Paid deployment, external generator, sustained resource/maintenance behavior, independent reruns and observed billing remain required before any sizing or cost-model calibration.

## Phase 10 follow-up

[Evidence maintenance](PHASE_10.md) delivers reminder audits, direct reference tracing, structural candidate proposals and bounded unreviewed HTTP metadata/digests. Actual semantic re-review of all sources, authenticated reviewer decisions, transitive impact analysis and current vendor/tenant contracts remain open. No source review date or recommendation changed in this phase.

## Phase 11 follow-up

[Scoped keyboard/contrast QA](PHASE_11.md) adds concrete focus fixes and component/browser evidence, including narrow layouts. It narrows accessibility work without claiming full conformance. Assistive technology, broader browser/zoom/control testing and actual uncached-machine installation remain open.
