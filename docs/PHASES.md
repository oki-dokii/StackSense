# Implementation phase tracker

Updated 13 November 2026 IST. The detailed method is in [plan.md](../plan.md); this tracker records actual completion.

| Phase | Scope | Status | Exit gate |
|---|---|---|---|
| 1 | Workspaces, schema-derived types, validation, normalization, deterministic JSON, single/batch CLI | Implemented and tested | Build/type generation current; 45 tests; six compiled public validations |
| 2 | Reviewed catalog, architecture features, hard constraints, complete-plan search and ranking | Next | Compatible recommendations from generic rules; search/reference checks and source-backed facts |
| 3 | Supporting services, costs, evidence-derived explanations and conflict/edge cases | Planned | Required capabilities, costs/warnings/alternatives/trade-offs; no silent hard violations |
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

## Phase 2 work queue

1. Add catalog/rule/evidence contracts and validated source records, starting with diverse static, relational web, mobile and restricted-deployment variants.
2. Implement architecture features with driver paths, structured precedence and explicit description assumptions.
3. Enforce region/provider/deployment/capability restrictions before scoring; distinguish evidence gaps.
4. Enumerate compatible complete plans; compare small cases against a brute-force reference.
5. Rank complete plans using documented fixed rubrics and stable tie-breaks; test name/ID invariance and hard-constraint strengthening.
6. Add actual recommendation CLI commands only once they produce conforming evidence-backed results.

## Change discipline

Each phase must update README instructions, tests, phase evidence and AI assistance. Preserve the original fixtures. Do not mark later phases complete based on planning artifacts or synthetic outputs. Do not tune selection by public scenario IDs/names.
