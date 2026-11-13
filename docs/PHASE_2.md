# Phase 2 — catalog and deterministic core planner

Implemented 13 November 2026 IST. This phase selects **provisional core layers** and produces development reports. It does not yet produce complete challenge recommendations.

## Delivered

- `packages/catalog`: 33 entries, 40 official-source records, structural JSON Schema and semantic validation. Duplicate IDs, unknown sources, invalid driver edges and invalid managed-database references fail as internal catalog errors. The default catalog is deeply frozen.
- `packages/engine`: generic feature derivation, hard candidate filtering, compatible-combination enumeration, plan-level ranking, evidence/why-not rendering and strict core-report validation.
- Core report contract: `schemas/core-planning.schema.json`, independent of the organiser's final output format.
- `plan:core` and `plan:core:batch`: use the existing bounded/atomic/safe CLI IO. Phase 1 validation mode still works independently.
- Catalog/rule ordering, project names/IDs and irrelevant retired options do not determine selection. No runtime network calls, model inference or paid keys.

## Core report semantics

| Status | Meaning | Exit code |
|---|---|---:|
| core_plan | A provisional core combination passes the modeled primary constraints | 0 |
| blocked | Missing catalog/control evidence or known deployment conflict; selected core stack withheld | 3 |
| invalid_input | Field/parser errors; no planning performed | 2 |

Filesystem/usage/internal errors use exit 1. Mixed-batch precedence is internal failure > invalid input > blocked > core plan. Core files use `_core_plan.json`; the manifest is `core_plan_manifest.json`. These reports are **not** `P1_output.json`–`P6_output.json` and cannot replace final submission outputs.

A report contains the four core selections where unblocked, architecture style, primary compute/database mapping, six weighted rubric contributions, feature provenance, pending requirements, warnings, assumptions and a trace. Trace contains the top five complete plans and at most 200 sorted recorded rejections. Early driver-edge pruning is sound but does not produce an individual rejection row for every pruned Cartesian combination.

## What is actually checked

- Requested client targets; API-only frontend omission; static vs application-server need; supported crawlable frontend profiles for SEO.
- Backend/database family compatibility using reviewed integration documentation.
- Managed database product availability within the selected provider profile; managed application containers are not treated as persistent database volumes.
- Explicit cloud preference, deployment model and **reviewed primary region** mapping.
- Active catalog status; retired/unknown entries excluded.
- Air-gapped public identity/phone/payment contradictions are blocking.
- Required compliance labels are blocking until control evidence is modeled. A vendor name is never treated as certification.

The catalog currently has reviewed primary compute/PostgreSQL mappings for GCP Mumbai, Belgium and Iowa. Other providers' country-specific mappings are intentionally absent; they are not inferred from provider brand. Backups, logs, identity, uploads, payment and ML data flows are not covered by primary-region evidence.

## Ranking method

Search enumerates compatible core combinations, using smallest domain first and stable ID ties. It prunes missing backend/database edges, does not retain only top-K candidates, and ranks complete plans. A deterministic assignment limit throws an internal search error; it never becomes false infeasibility.

Six 0–5 ordinal fits are weighted by supplied priorities. Cost is a **relative resource-burden rubric**, not a USD estimate. Delivery fit considers language familiarity/complexity and a documented short-timeline/beginner penalty. Maintainability includes operational burden, DevOps/team-size signals and a SQL Server reuse hint. Embedded-write/growth triggers are review heuristics, not capacity limits. Security fit remains neutral at 3 because configured controls are not evaluated yet. No framework receives an assumed low-memory performance advantage: a device hint produces a measurement warning instead.

Tie order: score descending, independently operated component count ascending, stable complete-plan ID ascending. The future monetary tie-break cannot be used until Phase 3 costs exist. Scores are not probabilities, measured throughput or an empirical technology ranking. Owner review/calibration is still required.

Descriptions use bounded affirmative hints for Markdown, ledgers, collaborative editing and low-memory devices, with matched phrases recorded. Supported local negations are checked. Structured realtime=false is not overridden by prose. No new legal or location restriction is inferred from descriptions. This is intentionally limited parsing, not general natural-language understanding.

## Verified behavior

Environment: macOS arm64, Node 22.17.1, npm 10.9.2.

- **97 tests pass**, including the 45 Phase 1 checks and new catalog, search, ranking, constraint, hint, report and CLI cases.
- Strict types and build pass; output reports are runtime-schema-checked, including score contribution arithmetic.
- A separate clean checkout copy installed successfully from the lockfile using the populated offline cache, built, and ran the compiled core CLI. The compiled CLI also ran from outside that checkout. This is a reproducibility smoke check, not a cold-network setup benchmark.
- Small-catalog traversal agrees with exhaustive Cartesian enumeration using the shared compatibility predicate; separate targeted tests check that predicate's driver, managed-storage, provider, region and platform decisions.
- Team-language changes select Python, TypeScript, Java, C#, Go and PHP backend families sensibly in the generic fixture; project names/IDs do not select products.
- Original six-case batch: P1 returns Astro / None / None / Cloudflare Pages as a provisional static core plan. P2–P6 are blocked by unmodeled compliance controls; P4/P5 additionally lack reviewed primary India mappings in their required provider profiles. These are honest current coverage limits, not claims that those projects cannot be built.
- A GCP/India test without compliance labels selects separately reviewed Mumbai primary compute/PostgreSQL instances and retains an explicit whole-data-flow review requirement.

## Run

```sh
npm ci
npm run check
npm run build
npm run plan:core -- --input fixtures/public/P1.json --pretty
npm run plan:core:batch -- --input fixtures/public/scenarios.json --output-dir core-plans --pretty
```

The public batch currently exits 3 because five reports are blocked; all six report files and the manifest are still written. For JSON-only stdout use `npm run --silent plan:core -- --input fixtures/minimal.json`. CLI `--no-llm` remains a documented no-op.

## Remaining work for Phase 3

Supporting services/capability completion; current usage-based prices and true affordability checks; configured compliance/security controls and end-to-end residency; complete operational and quality-target feasibility; deeper alternative explanations and conflict analysis. Existing-system matching is a preference hint, not verified legacy connectivity or a license/migration assessment. Exact supported runtime/product/driver versions must be pinned for an actual deployment. No SLA, deployment benchmark, final report screenshot or complete P1–P6 recommendation is claimed by this phase.
