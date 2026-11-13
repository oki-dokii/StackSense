# Prioritized improvements after the repository comparison

Assessment: 13 November 2026 IST. [Comparison evidence and limits](REPOSITORY_COMPARISON.md). This is a proposed work queue, not a statement that the items are implemented. Effort is an engineering planning estimate; evidence availability can dominate it.

| Priority | Work | Acceptance gate | Dependencies / effort |
|---|---|---|---|
| P0 | Complete regional/service evidence | Public P2/P4/P5/P6 blockers are resolved only when exact service/data-flow scope is supported; mismatched regions/providers still reject. Record remaining contracts/configuration explicitly | Primary vendor/tenant scope; medium/high |
| P0 | Per-field blocker-resolution tasks | An infeasible result names each affected requirement, evidence needed and next review action. No hidden input edits or fabricated costs; stack stays null | Diagnostic design; small/medium |
| P0 | Existing-system integration design | Entra and SQL Server cases identify reuse vs migration, network/protocol/region/license assumptions and incremental cost. Unsupported identity scope stays unverified | Azure profiles + scoped integration evidence; medium |
| P1 | Cost categories and sensitivity | UI distinguishes infrastructure vs variable fees; every line exposes units/rates/sources. Changed usage produces explainable deltas; unknown usage is never hidden | Existing cost model + reviewed examples; medium |
| P1 | Feasible complete-plan comparison | Several compatible whole plans, score/cost/operations deltas, ties and retained constraints are visible. No independently selected incompatible layers | Rank/explanation interface; medium |
| P1 | Independent quality review | Recorded reviewer criteria and disagreements; several unseen cases assessed before changing rules. Reviewer conclusions are attributed accurately | Qualified reviewer and time; variable |
| P2 | Version/lifecycle coverage | Supported versions and dated evidence for more products, including extended support vs EOL distinctions. No guessing from a product-family name | Official lifecycle/source research; medium |
| P2 | UI/accessibility evaluation | Keyboard-only import/run/review/export, screen-reader labels/errors, mobile tables and contrast checked; fixes have actual browser evidence | Browser QA; medium |
| P2 | Portable preview path | Fresh setup works on an actual uncached machine; compare value of static/browser-local packaging against current shared local API architecture | Build/dependency design; medium/high |

Suggested sequence: regional/identity evidence and blocker guidance first; then incremental reuse and cost calibration; then complete-plan comparison and wider validation. Broadening catalog names alone will not resolve unsupported data flows.

An evaluation-only proposal mode should be a separate, opt-in design. The original standard input must continue to produce an honestly scoped result without silently relaxing residency, compliance, deployment or provider constraints. User-supplied review references are attestations, not independently authenticated contracts.

Before publishing a changed engine: bump relevant versions, add independent invariant tests, rerun public and author-designed cases, regenerate outputs/screenshot evidence and sensitivity data, repeat relevant measurements, update/render the PDF and rebuild/reverify the package. Approval of an exploratory design must not be inferred from its presentation.
