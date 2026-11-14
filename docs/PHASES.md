# Implementation phase tracker

Updated 14 November 2026 IST. The detailed method is in [plan.md](../plan.md); this tracker records actual completion. Earlier phase counts are historical; the current release is [0.8.0](RELEASE_0_8.md).

| Phase | Scope | Status | Exit gate |
|---|---|---|---|
| 1 | Workspaces, schema-derived types, validation, normalization, deterministic JSON, single/batch CLI | Implemented and tested | Build/type generation current; 45 tests; six compiled public validations |
| 2 | Reviewed catalog, architecture features, hard constraints, core-plan search and ranking | Implemented and tested | 33 entries/40 sources; 97 tests; provisional core CLI, with explicit blockers |
| 3 | Supporting services, costs, evidence-derived explanations and conflict/edge cases | Implemented and tested | 145 tests; final-format CLI; six genuine public outputs with explicit evidence blockers |
| 4 | Local API and responsive web interface | Implemented and tested | 182 tests; exact API/engine parity; actual browser import/run/export, stale and mobile checks |
| 5 | Evaluation, performance/setup evidence, outputs/screenshots/report and release | Technical package prepared | 201 tests; 14 unseen-style cases; 24-page report/ZIP verified; owner review and online submission pending |
| 6 | Evidence-resolution guidance, Azure scoped coverage, integration reviews, cost sensitivity and complete-plan comparison | Implemented and tested | 220 tests plus three provenance tests; actual browser QA; release evidence refreshed |
| 7 | Research-driven Decision Lab, full tradeoff front, bounded experiments and proposed ADRs | Implemented and tested | 235 tests plus three provenance checks; exact browser/API/CLI exports; unchanged recommendation outputs |
| 8 | Local reference workload, raw measurement verification and detailed README diagrams | Implemented and tested | Three measured stages; five workload correctness/failure tests; full application regressions unchanged |
| 9 | Real Fastify/PostgreSQL reference, arrival-rate scheduler and repeated measured stages | Implemented and tested locally | 3,600 issued, zero errors/drops; commit counts verified; eight correctness/integrity cases with live DB enabled separately |
| 10 | Evidence freshness audits, source tracing, candidate diffs and unreviewed URL observations | Implemented and tested | 99 sources; 14 new tests; four bounded live observations; no source/engine date or output changes |
| 11 | Keyboard focus, text contrast, React DOM regressions and desktop/narrow browser QA | Implemented and tested | Six new component tests; seven scoped browser audits; remaining assistive/browser/zoom gates explicit |

| 12 | Provisional vendor integration, direct Entra, India payments, cost scope and submission refresh | Implemented and tested | 262 application tests; 12 region/auth/payment combinations; all six public stacks; current browser/export evidence and 25-page report |

## Phase 1 delivered

- npm workspaces with pinned tooling and lockfile.
- Type generation from the existing standard input/output JSON Schemas; freshness gate.
- Ajv validation without coercion/default mutation; field-level error aggregation.
- Explicit optional defaults, unknown-capacity handling, deterministic set ordering and assumption provenance.
- Preserved unknown fields with warnings; extensions are accepted but not claimed as selection inputs yet.
- Bounded JSON/file processing, per-item batch handling, portable unique filenames and overwrite protection.
- Source/deployed CLI paths and meaningful automated contract/process checks.

Evidence, commands and limitations: [Phase 1 record](PHASE_1.md). `valid` is a structural result; feasibility and stack selection are Phase 2 work. A validation report is never a substitute for an actual challenge output.

## Phase 2 delivered

Catalog, source/deployment/driver references, feature extraction, hard core filters, exhaustive compatible core search, fixed-rubric plan ranking and safe single/batch core CLI. [Evidence and limitations](PHASE_2.md). Only core combinations are planned; full recommendation feasibility and final output commands remain Phase 3.

## Phase 3 delivered

Complete service/control evaluation before cost ranking, 23 service profiles/43 primary-source records, reproducible resource/usage bands, honest framework and data-flow scope, and `recommend`/`recommend:batch` final-format exports. [Evidence and remaining gaps](PHASE_3.md). Two usable public recommendations and four explicit infeasible reports are generated; missing evidence is not replaced with invented feasibility.

## Phase 4 delivered

Same-origin local Fastify API and React/Vite workspace, schema-driven guided fields, samples/imports/batches, explained results and exports, stale-state protection and actual browser evidence. [Phase 4 record](PHASE_4.md). Rules/catalog output versions are unchanged; current infeasibility gaps remain explicit.

## Phase 5 delivered

Author-designed evaluation and mutations, EOL/source coverage fixes, measured cold/warm local API and clean cached setup, genuine public/edge captures, a rendered/verified report and the source/output/report submission ZIP. [Phase 5 evidence](PHASE_5.md). Four public cases remain explicitly infeasible; owner review and Drive/Unstop handoff are not claimed complete.

## Phase 6 delivered

[Phase 6 record](PHASE_6.md): five new structured result extensions, separate Azure India coverage, preserved public evidence blockers and focused desktop/mobile validation. Remaining vendor/tenant evidence and calibration are explicitly open.

## Change discipline

Each phase must update README instructions, tests, phase evidence and AI assistance. Preserve the original fixtures. Do not mark later phases complete based on planning artifacts or synthetic outputs. Do not tune selection by public scenario IDs/names.

## Phase 8 delivered

[Reference workload methodology and results](PHASE_8.md). This is the first local capacity-evidence step; deployed-stack billing/cost calibration remains open. Expanded README includes architecture, request sequence, engine search, Decision Lab, measurement and evidence diagrams.

## Phase 9 delivered

[Database-backed recipe and calibration boundary](PHASE_9.md). Local native PostgreSQL cluster and repeated open-arrival measurements are delivered. External cloud deployment, sustained resource measurement and billing-based cost calibration remain pending.

## Phase 10 delivered

[Evidence maintenance workflow](PHASE_10.md): deterministic offline audit, candidate changes and bounded metadata capture; retrieval, integrity and human approval remain distinct. Complete vendor/tenant revalidation and accessibility/independent review remain open.

## Phase 11 delivered

[Keyboard/contrast changes and browser evidence](PHASE_11.md). Focus destinations, title changes, import/error behavior, scoped contrast and 320-pixel layout are checked. Full WCAG/assistive-technology/browser/zoom QA and actual uncached-machine setup remain open.
