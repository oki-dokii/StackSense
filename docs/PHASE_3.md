# Phase 3 — complete recommendations, services and costs

Implemented 13 November 2026 IST. Phase 2 was run first: 97 tests, build, and the compiled six-scenario core batch passed their documented gates. Phase 3 adds the organiser-format `recommend` mode; the older validation and provisional core modes retain their separate contracts.

## Delivered behavior

Every compatible core combination is completed before ranking. Required auth, offline persistence/sync, realtime collaboration, tenant isolation, search, uploads, payments, CPU inference, telemetry and build capabilities either receive a compatible profile or reject that combination. Service database/client/provider compatibility, external-network restrictions, external residency evidence and required contract/control scope are checked before estimating cost. There is no top-K core shortlist that can accidentally exclude a viable complete plan.

The separate versioned service-policy file has 23 profiles and 43 dated primary-source records. Sources describe supported building blocks; application sync, transactional outbox, tenant isolation, identity SPI and infrastructure configuration remain implementation work for the recommended project. Alternatives are named technologies/designs to investigate; they are not all reviewed deployable variants in this catalog.

Examples: Keycloak uses a supported relational database; SMS OTP requires a custom authentication integration plus delivery provider, not Keycloak TOTP. Offline static content uses Workbox without a server database/queue. Dynamic offline writes and collaborative updates use durable local state, application reconciliation and a PostgreSQL outbox worker. Required tenant isolation selects PostgreSQL forced RLS and negative authorization tests. Search is included only when requested. ONNX inference assumes a CPU-compatible exportable model; training and RAG currently return a visible coverage gap.

## Costs and ranking

Costs describe the month-12 operating footprint, using 730 hours/month. Line items expose quantities, USD rate intervals, outward-rounded cent bounds, source IDs and assumptions. BigInt fixed-point multiplication avoids binary floating-point accumulation in resource charges; totals use integer cents. Hosting/CDN and shared database auth/search/outbox capacity are not billed twice. Worker/identity/inference/telemetry allocations, managed database CPU/RAM/disk, backups, egress, media, hosted CI, OTP and payment fees are accounted for when selected.

Published reference prices and authored allowances are deliberately distinguished in each rate's basis. GCP reference rates and AWS Fargate reference rates are not promises about the selected regional bill. Azure/VM/owned-hardware, storage/network operations, CI, payment and SMS bands include explicit planning assumptions; they are not verified SKU/merchant quotes. User counts are not throughput measurements. Optional RPS, egress, retention, OTP and payment volume/value inputs refine the envelope. Missing values generate disclosed hypotheses. Hardware procurement, salaries/on-call work, domains, taxes and specialized model procurement are excluded. Existing owned hardware is assumed for local deployments.

Cost fit replaces Phase 2's relative burden score: 5 if the upper band fits the budget, 3 if only the lower fits, 1 if the lower is within twice budget, otherwise 0. Configured security control coverage replaces the provisional neutral explanation; no certification score is awarded. Added service operating burden can reduce maintainability. Ties use lower cost upper bound, fewer operated resources and stable plan ID. These are uncalibrated engineering rubrics, not benchmark results.

An over-budget design is `ok_with_warnings`, explicitly marked `BUDGET_EXCEEDED` or `BUDGET_RANGE_RISK`, under ADR-004. Unknown local prices/capacity are not silently promoted into guarantees. `infeasible` cost 0–0 is a required serialization placeholder with `estimate_status: not_estimated`, never a free recommendation.

## Data and control boundaries

The result records proposed locations for primary compute/database, identity, local device data, media, telemetry, build artifacts and external services. Regional configuration, backups, retention/deletion and negative-access/restore tests are mandatory deployment tasks. Build services may receive source/synthetic fixtures only; production data and secret values must not enter logs.

Requested frameworks receive non-exhaustive technical designs and owner actions, with `verification: design_only_not_certified`. Legal applicability, certification, audits, executed BAAs and merchant agreements are never inferred from a vendor name. HIPAA cloud/external services without BAA evidence remain blocked. Explicit RBI localisation derives India scope if residency was unspecified and rejects contradictory region policy. External identity, SMS and payment country scope must be reviewed separately from the application's host. An Indian vendor or API hostname does not establish India-only data handling.

Availability and latency targets produce explicit unverified-target notices; redundant allocations are sizing assumptions, not SLA proof. Existing systems require version/license/network review. Retired/unknown core catalog products remain excluded. The engine performs no runtime network access or LLM calls.

## Actual public outputs

These are genuine engine outputs, committed in [outputs](../outputs/README.md), with original inputs preserved. They are development evidence, not a claim the whole challenge submission is complete.

| Scenario | Result | USD/month band | Main scope/evidence |
|---|---|---:|---|
| P1 | ok | 0–0 | Astro static assets, no backend/database, bundled Cloudflare Pages/CDN, local build |
| P2 | infeasible | Not estimated | India-only external phone OTP data-flow evidence absent |
| P3 | ok_with_warnings | 875.51–7785.95 | Complete collaboration/identity/tenant/media/payment design; price/capacity, budget upper bound, SLA/latency and framework review warnings |
| P4 | infeasible | Not estimated | Reviewed AWS India primary profile absent; this does not establish RBI/payment/identity approval |
| P5 | infeasible | Not estimated | Reviewed Azure India primary profile absent; existing identity tenant scope still needs review |
| P6 | infeasible | Not estimated | External phone identity data-flow residency evidence absent |

P3 selects Angular, Fastify, PostgreSQL and Cloud Run under the current rubric. This is the current deterministic result, not a claim of intrinsic framework superiority. Full-text search is false in the supplied P3 and is correctly omitted; a separate feature test requests and checks native search.

The batch exits **3**, exports all six files and writes `recommendation_manifest.json` with one `ok`, one `ok_with_warnings`, four `infeasible`. Infeasibility is relative to reviewed evidence. No public scenario ID/name selects a rule. Adding actual evidence or explicitly revising requirements can change results; fabricating regional support cannot.

## Verification

- `npm run check`: 145 passing tests across four files, generated type freshness and TypeScript checks.
- `npm run build`: successful source compilation.
- Compiled public recommendation batch: all six outputs pass the organiser output schema. Existing core batch remains one provisional plan/five blocked, exit 3.
- Tests cover all four final statuses, genuine CLI processes, mixed-batch precedence, protected output writes, metadata/order invariance, no input mutation, bounded-search failure, service integration conflicts, offline/static distinction, restricted deployments, external residency, HIPAA contract evidence, RBI conflicts, ONNX/RAG/training scope, cost arithmetic/rounding, unsafe ranges, zero budget, retention, applied/unapplied extensions and unverified target warnings.
- A fresh copy with no dependencies/build artifacts passes offline `npm ci` from the populated package cache and builds. Its compiled CLI, run from an unrelated directory, reproduces all six committed outputs byte-for-byte. This verifies cached installation; a new online download on another OS is not claimed.
- Documentation/schema checks preserve fixture SHA provenance and validate core/service data plus generated output files.

API and UI are Phase 4. Reserved evaluation, measured recommendation quality, actual deployment/load testing, Windows/Linux setup validation, screenshots and the final report/release remain Phase 5. This phase does not resolve all six scenarios into usable plans.
