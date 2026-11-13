# Implementation phase tracker

Updated 13 November 2026 IST. The detailed method is in [plan.md](../plan.md); this tracker records actual completion.

| Phase | Scope | Status | Exit gate |
|---|---|---|---|
| 1 | Workspaces, schema-derived types, validation, normalization, deterministic JSON, single/batch CLI | Implemented and tested | Build/type generation current; 45 tests; six compiled public validations |
| 2 | Reviewed catalog, architecture features, hard constraints, core-plan search and ranking | Implemented and tested | 33 entries/40 sources; 97 tests; provisional core CLI, with explicit blockers |
| 3 | Supporting services, costs, evidence-derived explanations and conflict/edge cases | Next | Required capabilities, costs/warnings/alternatives/trade-offs; no silent hard violations |
| 4 | Local API and responsive web interface | Planned | Shared-engine parity; input/import/results/export; keyboard/mobile and stale-state checks |
| 5 | Reserved evaluation, performance/setup evidence, real outputs/screenshots/report and release | Planned | All challenge deliverables and submission checklist verified |

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

## Phase 3 work queue

1. Implement required supporting capabilities and check their compatibility/data flows.
2. Research current prices/units/usage assumptions and estimate actual monthly bands.
3. Model configured controls and end-to-end residency evidence; resolve current compliance/regional blockers conservatively.
4. Extend explanations/alternatives and conflict handling to complete plans.
5. Produce standard challenge-format recommendation JSON from generic rules and verified evidence.

## Change discipline

Each phase must update README instructions, tests, phase evidence and AI assistance. Preserve the original fixtures. Do not mark later phases complete based on planning artifacts or synthetic outputs. Do not tune selection by public scenario IDs/names.
