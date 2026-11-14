# StackSense report narrative

Generated alongside the PDF; tables, images and complete source ledger are in the PDF and versioned evaluation data.

SYNERGY 26 / ARCHITECTURE DECISION ENGINE

StackSense

An explained technology stack, grounded in project constraints.

Soham BanerjeeIIIT-BangaloreSoham.Banerjee@iiitb.ac.ingithub.com/oki-dokii/StackSense15 November 2026

Application and recommendation engine/rules/services 0.8.0; Decision Lab analysis 0.2.0; core catalog 0.4.0. Deterministic local execution, with explicit provisional exceptions and itemized cost scope.

1. Abstract

StackSense converts a structured software-project brief into a deterministic, explained architecture. A local TypeScript engine validates inputs, filters compatible core stacks, checks required supporting services and data flows, estimates month-12 cost bands, and ranks complete designs. A CLI, Fastify API and React workspace share the same engine. The release includes 35 core entries, 26 service profiles, source records, actual JSON outputs and browser evidence. All six supplied scenarios receive stacks; four carry critical external-boundary exceptions rather than unsupported compliance claims. The evaluation includes 326 automated tests, thirty varied project briefs across fifteen concrete types, fourteen edge cases, twelve region/auth/payment combinations, sensitivity experiments and measured local setup/API timings. The system makes no runtime LLM calls and requires no paid key. Costs, performance targets and framework controls are disclosed assumptions and implementation tasks, not provider quotes, benchmarks of suggested stacks, or certification.

2. Problem understanding

The task is one recommendation engine, not six applications. The supplied scenarios are inputs, not labeled expected answers. Recommendations must cover four core layers, required supporting capabilities, input drivers, alternatives, trade-offs and cost assumptions. Known external integrations with missing residency or contract evidence are explicitly provisional with critical warnings. Actual region/provider/deployment conflicts still withhold a stack. Budget and timeline remain explicit preference/risk trade-offs under the documented brief ambiguities.


---


3. System architecture

The CLI calls the shared engine directly; web input uses the local HTTP API. Contracts and the same complete-plan engine are reused by every adapter. The API performs bounded parsing and transport checks, then calls the engine; the browser never selects technologies. Local files provide immutable catalog/rule data. Validation does not coerce types or discard unknown fields.

Local execution

npm cinpm run checknpm run buildnpm start

Open http://127.0.0.1:3000. The server binds loopback only and serves API and assets together; STACKSENSE_PORT optionally changes the port. The development UI at 5173 proxies the same API. The complete checkout must accompany dist because schemas/catalog/fixtures are local data.

The UI supports guided briefs, sample/import/batch input and all four result statuses. Every edit invalidates export until rerun. Driver values use the evaluated snapshot. No-plan 0-0 placeholders render Not estimated. Inputs remain in memory; closing/reloading discards the draft.


---


4. Input design and research

Every standard field is accepted. Required leaves are checked before planning; optional defaults are recorded as assumptions. Schemas, source scopes and rule drivers provide an auditable mapping rather than a claim that a field predicts product quality.

* Mandatory input leaves. Field-path errors are aggregated; malformed/oversized inputs have root errors. Set-like arrays are deduplicated and sorted. Unknown input properties are preserved and warned. Maximum input is 2 MiB, nesting 32, 100,000 values and batch size 100.


---


4. Input design (continued)

Extra usage inputs: actual sensitivity experiments

These are paired experiments, holding other inputs fixed per pair; their baseline is not a public scenario. RPS changes compute, egress changes network charges, retention changes backups, and OTP/payment volume/value change their disclosed usage envelopes. A changed estimate need not change the core stack. Full inputs/method are reproducible in scripts/evaluate.mjs and evaluation/sensitivity.json.

Legacy primary_user_region and vendor_lock_in_tolerance values are accepted from imports but remain explicitly unapplied; they are not actively collected in the guided form. No unsupported latency or portability advantage is inferred from them. New optional parameters are not hidden requirements.


---


5. Knowledge base and decision logic

The core catalog has 35 entries and 49 dated primary-source records; service policies add 26 profiles, 57 source records and two known lifecycle rules. Records describe product family, runtime, client coverage, driver edges, deployment/provider mappings, regions, complexity/operating burden, trade-offs and source scope. Active status is required; maintained product families still need supported versions pinned during a real build.

Evaluate complete plans before ranking

1. Validate, normalize and record defaults.2. Derive bounded, field-linked architecture hints.3. Filter core domains by target, rendering, deployment, provider and reviewed primary regions.4. Enumerate compatible frontend/backend/database/host combinations; prune unsupported driver/runtime/storage edges.5. Add required services; reject incompatible client/database/provider, restricted external flow. Missing external-scope evidence becomes an explicit critical review condition.6. Build controls and estimate only complete compatible designs.7. Rank, attach alternative/driver evidence, then validate the organiser-format result.

Search uses smallest domains and stable IDs, without a top-K core shortlist. An assignment limit raises an internal failure; it never turns interrupted search into infeasibility. Infeasibility means no complete design in this reviewed catalog, not impossibility in the real world.

Each 0-5 fit is multiplied by its supplied 1-5 priority. Ties use lower cost upper bound, fewer operated resources, fewer unrequested client targets and stable plan ID. Rubrics are transparent but uncalibrated; rounding and stable ties can select among similarly scored technologies. No scenario ID/name or runtime LLM chooses a stack.


---


5. Evidence, services and costs

Service profiles cover identity, SMS OTP, realtime collaboration, local offline data, full-text search, forced RLS, media, hosted checkout, transactional outbox/workers, CPU inference, telemetry and build/deploy support. Keycloak TOTP is not mislabeled as phone delivery. Dynamic offline writes need application reconciliation/idempotency; public static offline reads use Workbox without inventing a database/queue.

Scope and residency are checked separately

GCP reviewed mappings include Mumbai, Belgium and Iowa. The release adds AWS Fargate and RDS PostgreSQL primary mapping in Mumbai using Fargate/region/RDS documentation [core:fargate-regions, core:aws-regions, core:rds-regions]. This does not approve external identity, SMS or payment handling. Central India now has a separate App Service Environment v3 Linux Isolated v2 profile, PostgreSQL Flexible Server with in-region backups, and private Blob LRS. This evidence is not applied to shared App Service or other regions. Entra tenant flows are assessed separately.

Known external integrations with unverified residency are proposed with critical exceptions and explicit reduced-assurance assumptions. Real deployment or region conflicts still reject a plan. Framework designs require configuration, retention/deletion, access/restore tests and qualified review. HIPAA cloud/external services need eligible scope and executed BAA evidence. Explicit RBI localisation derives India only when the label requests it; contradictory regions reject. Known Python 2 and AngularJS support endings warn on existing systems without mislabeling Python 3 or maintained Angular.

Month-12 planning bands

Resource lines expose quantities, USD rate intervals, source IDs and assumptions. Fixed-point arithmetic rounds outward to cents. Cloud Run separates request duty from full-month instance-based support; always-on workers and identity do not receive a request-only discount. Shared hosting/CDN and database auth/search/outbox capacity are not double billed. Separate compute includes workers, identity, telemetry and inference allocations. Database CPU/RAM/storage, backups, media, network and CI form the headline. SMS/payment assumptions are itemized as additional activity scenarios, outside infrastructure budget scoring.

Lightsail adds published full-month Linux IPv4 bundles, SSD/transfer allowances, snapshots and extra disk. Burstable capacity and recovery require tests. Missing RPS, egress and activity remain visible hypotheses; taxes, labor, domains and new hardware are excluded. Reference/proxy rates are not regional quotes or capacity guarantees.

Budget planning exposes the lowest same-brief catalog upper estimate and one optional changed-requirement proposal. P2 can propose USD 104-193.50 infrastructure with self-management and a 99% target; only its lower bound fits USD 150. Changes require explicit acceptance. Original stacks, feature flags, region/provider and critical conditions remain intact. No-plan 0-0 values remain non-estimates.


---


6. Sample recommendations: P1

P1 / DevFolio - actual local release UI, engine 0.8.0. The complete output is outputs/P1_output.json.

Inputs: a solo beginner, JavaScript/HTML/CSS, two weeks, Markdown portfolio/blog, web-only SEO, no dynamic features, 3,000 year-one users and USD 0 infrastructure budget.

Selected: Astro produces static content; None backend and None database avoid services that the stated features do not need. Cloudflare Pages serves the static build; CDN delivery is the same bundle and local Git/build scripts avoid assumed paid CI. The month-12 hosting band is USD 0-0 under static-asset, build/file and add-on limits.

Why this combination: static rendering covers SEO and Markdown authoring. HTML/CSS is a real compatible alternative, scored 82 versus 86 for the selected plan under the manual content-conversion rubric. A complete Cloud Run plan scored 61. Dynamic backend/database alternatives do not survive the static requirement profile; their omission is explained rather than represented by empty component fields.

Trade-offs: publishing is a content build, not a dynamic application. Functions, paid domains, external identity, uploads and private/country-restricted global-edge data are outside the selected profile. Free delivery does not establish an SLA. These constraints are visible in assumptions and the informational deployment-limit warning.


---


6. Sample recommendations: P3

P3 / BoardRoom - actual warned result. Selected plan score 85; alternatives are relative whole-plan comparisons, not intrinsic product rankings.

Inputs: collaborative whiteboard, web, 5,000 peak concurrent users, tenant isolation, social login, media, payments, 100 ms p95 target, 99.9% availability and a USD 1,500 month-12 budget. No country residency is specified; full-text search is false and is omitted.

Selected: Angular, Fastify, PostgreSQL and Cloud Run. Yjs + ws covers shared CRDT state/transport; PostgreSQL outbox workers persist/retry updates, forced RLS supports tenant boundaries, Keycloak brokers identity, regional private object storage handles uploads and Stripe Checkout isolates card credentials. Telemetry and hosted CI are included with stated limits.

Alternatives and limits: React/Vite and a Go-backend plan tied on score; published cost/operation/ID tie-breaks selected this result. Other cloud variants remain visible in the full catalog frontier. This is not proof Angular is best. Application auth, document persistence, cross-instance coordination and conflict UX must still be built.

Costs: infrastructure USD 639.32-2,648.75/month. Compute contributes USD 363.97-1,684.03; peak WebSocket capacity is counted once. Additional assumed payment activity is USD 0.00-2,500.00, excluded from the headline. The infrastructure upper bound exceeds USD 1,500. Remaining resource lines and assumptions are exposed in JSON; SLA, latency, identity terms and GDPR controls require review.


---


6. Public scenarios: P2 and P4

P2 / FixIt Now - provisional Next.js + React Native, Django, PostgreSQL and Cloud Run. MSG91 and Razorpay are selected with critical India data-flow review conditions. Infrastructure USD 367.76-1,193.62/month exceeds USD 150 at the lower bound; no feature or residency claim is silently treated as satisfied.

P4 / QuickCredit - ECS/Fargate and PostgreSQL in Mumbai, with Fastify and web/Android clients. MSG91/Razorpay external flows remain critically qualified. Checkout does not itself implement lending authorization, KYC, double-entry ledger, disbursal or mandates; these are explicitly scoped implementation and eligibility conditions.


---


6. Public scenarios: P5 and P6

P5 / PeopleDesk - React, ASP.NET Core, PostgreSQL and Azure ASE Central India, with direct OIDC/SAML integration to the existing Entra tenant. Tenant geography is critically unverified; SQL Server reuse, private connectivity and licenses need a separate review. Infrastructure USD 686.87-858.06/month is explicitly above the USD 300 budget.

P6 / KhetSurvey - React Native, Django, PostgreSQL and Cloud Run, with device-local persistence, an outbox, idempotent retry/conflict handling and resumable media. MSG91 phone delivery has a critical India boundary condition. Infrastructure USD 187.90-552.07/month excludes SMS activity; target-device memory still needs measurement.


---


7. Edge-case handling

All nine categories below have actual release evaluations and unedited overview screenshots in Appendix A. Full errors/warnings/choices are in evaluation/outputs. These are author-designed unseen-style cases, not organiser hidden tests or independent expert judgments.

Additional cases test reviewed AWS India, offline native writes, cloud-none/managed contradiction, unsupported RAG and an unknown extension. Invalid catalog data or exhausted search remains an internal failure. No result claims all conflicts are minimal or all EOL technologies are known.


---


8. Validation and measurements

326 automated tests pass across thirteen files: contract/default/provenance, catalog/driver integrity, compatible search, complete services/costs, metadata/order mutations, CLI subprocess IO, exact API/engine parity, transport/security, browser model and fourteen release cases. Generated TypeScript freshness, compiler and production browser/server builds pass. Twenty recommendation snapshots and six Decision Lab artifacts are checked byte-for-byte against current code; native provenance, workload and evidence checks supplement the application suite. Thirty varied briefs cover fifteen concrete project types; 29 receive stacks and GPU training remains outside catalog scope. Seven language-only probes, provider checks and the twelve region/auth/payment combinations retain real conflict tests.

Fourteen author-designed case expectations cover statuses, field errors, required services, local deployment, region retention and simplicity. Metamorphic checks rename metadata/reorder set-like inputs and ensure hard constraints remain filters. Six paired usage experiments show real cost effects. No external expert review, organiser hidden-case results or calibrated recommendation-quality accuracy is claimed.

Observed local API timings

Measured on Apple M2, 8 GB RAM, macOS arm64, Node v22.17.1, npm 10.9.2. Cold Node/API startup to health: 239.348 ms. Each case had one warm-up and twenty real loopback HTTP POSTs through consumed JSON. Browser rendering, recommended workload performance and cloud provisioning are excluded.

Clean setup rehearsal

A source ZIP was extracted to a fresh directory. Cached offline npm ci, all checks, build, evaluation and output verification completed in 23.294 seconds. Runtime/test source digest is recorded and checked during final packaging. The populated dependency cache avoids a new network download; online installation speed and Windows/Linux execution are not claimed. The CI matrix covers macOS, Ubuntu and Windows on Node 22/24; remote run results are separate from this local measurement.

Browser evidence covers batch outputs, export parity and desktop/narrow budget layouts. The unchanged validation focus snapshot is retained from the prior pass and backed by React DOM tests; it was not freshly reproduced. This is not a full accessibility or browser conformance audit. Official product/source alignment is reviewed; no paper experiment was reproduced.


---


Decision Lab: application 0.8.0

Actual P3 Decision Lab view. All 168 completed catalog plans are plotted; 12 identifiers are nondominated under the three declared model objectives. Inspecting an alternative never changes the original recommendation.

The separate analysis endpoint runs the original recommendation plus 24 one-priority-at-a-time changes. P3 retains its winner in 25/25 settings while equal-score alternatives remain. This count is not a confidence probability, unique superiority or global sensitivity analysis; interactions are not exhaustively explored.

The tradeoff front minimizes monthly cost upper bound and operated component units while maximizing the ORIGINAL-priority weighted score. It uses every completed candidate, not just the top three. All metrics retain their heuristic/planning scope. A lower upper cost can still have a higher lower cost, so inspect both bounds and assumptions.

All public briefs support priority/tradeoff analysis. Decision Lab functional trials preserve protected infrastructure/compliance fields; separately labeled budget proposals may explicitly lower availability or move to self-managed VMs. Nothing is automatically applied. P5 remains over budget, and tenant evidence is not invented. Evaluation counts refer to top-level scenario trials, excluding the baseline budget rerun.

Proposed ADR Markdown and exact JSON exports include the original result, input digest, versions, alternatives, scoped references and implementation review tasks. Browser exports match API/engine artifacts; stale exports are blocked after edits. The exported baseline exactly matches the current 0.8.0 recommendation; critical warnings are preserved. Counterfactual, Pareto evaluation, sensitivity and ADR sources are N01-N04 in Appendix B; their experiments were not reproduced.


---


9. Limitations and future work

Four public scenarios contain provisional external-boundary exceptions. The engine does not equate a regional app host, an Indian vendor or a compliance badge with complete identity/payment data-flow assurance. Broader Azure variants and existing-tenant boundaries need deeper review; Central India isolated compute/database/storage is now separately scoped. Provisional proposals increase architecture coverage while leaving these unresolved conditions explicit.

The catalog is finite and product-family based. Framework/API/driver versions, regional quotas, contract eligibility, data retention and all application controls need deployment review. Training/RAG, broader search/storage options, comprehensive lifecycle coverage, private network integration and general prose understanding remain limited.

Costs use capacity hypotheses and authored allowances as well as reference prices. SLA/latency are targets, not guarantees. Ordinal fits are not statistically calibrated; close plans may tie and stable IDs can determine the winner. Independent architecture review, tariff validation, target-device/load tests and calibrated capacity examples and tenant/vendor evidence remain high-value improvements. Local HTTP/PostgreSQL reference measurements, source-review tooling and scoped keyboard/contrast checks are included in the repository. They do not establish production sizing, cloud billing, full accessibility or independent architecture validation.

10. References and third-party tools

Appendix B enumerates the complete core, service/control/lifecycle and research source registers with clickable links and their versioned IDs. Source scope/review dates are recorded in packages/catalog/data and docs/research/sources.json. Relevant IDs appear in outputs; referenced availability evidence does not establish legal or pricing approval.


---


11. AI assistance declaration

OpenAI Codex was used for requirement interpretation, research/source lookup, planning documents, catalog/rule/rubric drafts, TypeScript implementation, tests, browser checks, measurement scripts, report authoring and packaging. The Sites skill guided the local repository UI workflow; the PDF skill guided report generation and visual QA. No other person or team was delegated implementation work in this release.

There are no runtime LLM calls, model-selected stacks or paid-key requirements. The accepted --no-llm CLI flag is a no-op because selection is entirely local rules/search/scoring. Research papers were used as design guidance with recorded review depth; their experiments were not replicated. AI-assisted drafts are not independent expert verification.

AI assistance is disclosed as development assistance, not independent expert validation or proof of unaided authorship. The complete implementation, evidence records and design walkthrough make the reasoning inspectable. The title-page identity was provided by Soham Banerjee for publication with this project.

Reproducible submission package

The local StackSense26_SohamBanerjee package contains source/source.zip with README at its root, the six actual public output JSON files, this PDF, submission notes and a SHA-256 manifest. Dependencies, build output, caches, credentials and Git internals are excluded. A runtime/test source digest connects the package to its setup rehearsal; ZIP integrity and size are checked.

The archive follows the required source/output/report layout. The organiser requires the named folder and accessible Drive link through Unstop; the submitted folder must remain unchanged after the deadline. A GitHub URL supplements rather than replaces that submission format.

The release evidence is a reproducible engineering record with disclosed limitations. It is not a compliance certificate, production deployment validation, independent review or promise that all project requirements are covered.


---


Appendix A. Edge evidence 1-2

E01 / Missing fields - invalid_input. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/E01_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.

E02 / Invalid values - invalid_input. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/E02_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.


---


Appendix A. Edge evidence 3-4

E03 / Contradictions - ok_with_warnings. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/E03_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.

E04 / Over-engineering traps - ok. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/E04_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.


---


Appendix A. Edge evidence 5-6

E05 / Regulatory constraints - ok_with_warnings. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/E05_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.

E06 / Existing systems - ok_with_warnings. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/E06_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.


---


Appendix A. Edge evidence 7-8

E07 / Restricted deployment - ok_with_warnings. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/E07_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.

E08 / Skill mismatch - ok_with_warnings. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/E08_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.


---


Appendix A. Edge evidence 9

E09 / Deprecated technology - ok_with_warnings. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/E09_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.

E09 structured diagnostics

AngularJS upstream support ended 2022-01; found in AngularJS admin portal. Do not retain it as the recommended production runtime. Plan migration/isolation and review compatibility. Evidence: https://docs.angularjs.org/misc/version-support-status

Python 2 upstream support ended 2020-01-01; found in Python 2.7 report service. Do not retain it as the recommended production runtime. Plan migration/isolation and review compatibility. Evidence: https://www.python.org/doc/sunset-python-2/


---


Appendix B. Source ledger 1

Links preserve the original source register. A record describes only its stated scope. Catalog review is not certification or empirical calibration.

core:html - HTML content. developer.mozilla.org (2026-11-13).

core:astro - Astro deployment. docs.astro.build (2026-11-13).

core:next - Next.js self-hosting. nextjs.org (2026-11-13).

core:react - React from scratch. react.dev (2026-11-13).

core:vue - Vue introduction. vuejs.org (2026-11-13).

core:svelte - SvelteKit Node adapter. svelte.dev (2026-11-13).

core:angular - Angular deployment. angular.dev (2026-11-13).

core:rn - React Native introduction. reactnative.dev (2026-11-13).

core:flutter - Flutter supported platforms. docs.flutter.dev (2026-11-13).

core:flutter-seo - Flutter web FAQ. docs.flutter.dev (2026-11-13).

core:compose - Jetpack Compose. developer.android.com (2026-11-13).

core:fastify - Fastify database guide. fastify.dev (2026-11-13).

core:django - Django databases. docs.djangoproject.com (2026-11-13).

core:fastapi - FastAPI SQL databases. fastapi.tiangolo.com (2026-11-13).

core:spring - Spring Boot SQL. docs.spring.io (2026-11-13).

core:aspnet - EF Core providers. learn.microsoft.com (2026-11-13).

core:go - Go SQL drivers. go.dev (2026-11-13).

core:laravel - Laravel database. laravel.com (2026-11-13).

core:pg - PostgreSQL introduction. postgresql.org (2026-11-13).

core:mysql - MySQL overview. dev.mysql.com (2026-11-13).

core:maria - MariaDB deployment. mariadb.com (2026-11-13).

core:sqlite - SQLite appropriate uses. sqlite.org (2026-11-13).

core:sqlserver - SQL Server Linux. learn.microsoft.com (2026-11-13).

core:mongo - MongoDB Community installation. mongodb.com (2026-11-13).

core:pages - Cloudflare Pages. developers.cloudflare.com (2026-11-13).

core:ecs - Amazon ECS. docs.aws.amazon.com (2026-11-13).

core:appservice - Azure App Service. learn.microsoft.com (2026-11-13).

core:run - Cloud Run overview. cloud.google.com (2026-11-13).

core:run-regions - Cloud Run locations. cloud.google.com (2026-11-13).

core:run-ws - Cloud Run WebSockets. cloud.google.com (2026-11-13).

core:cloudsql-pg - Cloud SQL PostgreSQL locations. cloud.google.com (2026-11-13).

core:cloudsql-my - Cloud SQL MySQL overview. cloud.google.com (2026-11-13).


---


Appendix B. Source ledger 2

Links preserve the original source register. A record describes only its stated scope. Catalog review is not certification or empirical calibration.

core:rds-pg - RDS PostgreSQL. docs.aws.amazon.com (2026-11-13).

core:rds-maria - RDS MariaDB. docs.aws.amazon.com (2026-11-13).

core:rds-sql - RDS SQL Server. docs.aws.amazon.com (2026-11-13).

core:azure-pg - Azure PostgreSQL. learn.microsoft.com (2026-11-13).

core:azure-sql - Azure SQL Managed Instance. learn.microsoft.com (2026-11-13).

core:ec2 - Amazon EC2. docs.aws.amazon.com (2026-11-13).

core:nginx - NGINX static serving. docs.nginx.com (2026-11-13).

core:astro-markdown - Astro Markdown. docs.astro.build (2026-11-13).

core:fargate-regions - ECS Fargate supported regions. docs.aws.amazon.com (2026-11-14).

core:aws-regions - AWS region country mapping. docs.aws.amazon.com (2026-11-14).

core:rds-regions - Amazon RDS regional endpoints. docs.aws.amazon.com (2026-11-14).

core:azure-ase - App Service Environment v3 region and data boundary. learn.microsoft.com (2026-11-13).

core:azure-pg-regions - Azure PostgreSQL Flexible Server overview. learn.microsoft.com (2026-11-13).

core:azure-pg-backup - Azure PostgreSQL backup and restore. learn.microsoft.com (2026-11-13).

core:lightsail-bundles - Lightsail Linux IPv4 instance bundles. docs.aws.amazon.com (2026-11-15).

core:lightsail-regions - Lightsail regional endpoints. docs.aws.amazon.com (2026-11-15).

core:lightsail-pricing - Lightsail transfer, disk and snapshots. aws.amazon.com (2026-11-15).

svc:keycloak-db - Keycloak database support. keycloak.org (2026-11-13).

svc:keycloak-admin - Keycloak administration. keycloak.org (2026-11-13).

svc:stripe - Stripe Checkout. docs.stripe.com (2026-11-13).

svc:stripe-dpa - Stripe DPA. stripe.com (2026-11-13).

svc:stripe-pricing - Stripe pricing. stripe.com (2026-11-13).

svc:msg91 - MSG91 OTP. docs.msg91.com (2026-11-13).

svc:msg91-privacy - MSG91 privacy. msg91.com (2026-11-13).

svc:yjs - Yjs. docs.yjs.dev (2026-11-13).

svc:ws - ws. github.com (2026-11-13).

svc:expo-sqlite - Expo SQLite. docs.expo.dev (2026-11-13).

svc:android-offline - Android offline architecture. developer.android.com (2026-11-13).

svc:dexie - Dexie IndexedDB. dexie.org (2026-11-13).

svc:drift - Drift. drift.simonbinder.eu (2026-11-13).

svc:pg-fts - PostgreSQL full-text. postgresql.org (2026-11-13).

svc:mysql-fts - MySQL full-text. dev.mysql.com (2026-11-13).


---


Appendix B. Source ledger 3

Links preserve the original source register. A record describes only its stated scope. Catalog review is not certification or empirical calibration.

svc:pg-rls - PostgreSQL row security. postgresql.org (2026-11-13).

svc:gcs - Cloud Storage locations. cloud.google.com (2026-11-13).

svc:s3 - Amazon S3. docs.aws.amazon.com (2026-11-13).

svc:telemetry - OpenTelemetry Collector. opentelemetry.io (2026-11-13).

svc:gcp-logs - Regional Cloud Logging. cloud.google.com (2026-11-13).

svc:aws-logs - CloudWatch Logs. docs.aws.amazon.com (2026-11-13).

svc:onnx - ONNX Runtime. onnxruntime.ai (2026-11-13).

svc:ci - GitHub Actions. docs.github.com (2026-11-13).

svc:jenkins - Jenkins installation. jenkins.io (2026-11-13).

svc:pages-price - Cloudflare Pages pricing. developers.cloudflare.com (2026-11-13).

svc:run-price - Cloud Run pricing. cloud.google.com (2026-11-15).

svc:sql-price - Cloud SQL pricing. cloud.google.com (2026-11-13).

svc:fargate-price - Fargate pricing. aws.amazon.com (2026-11-13).

svc:azure-price - App Service pricing. azure.microsoft.com (2026-11-13).

svc:ec2-price - EC2 pricing. aws.amazon.com (2026-11-13).

svc:storage-price - Cloud Storage pricing. cloud.google.com (2026-11-13).

svc:s3-price - S3 pricing. aws.amazon.com (2026-11-13).

svc:gdpr - EU data protection obligations. commission.europa.eu (2026-11-13).

svc:dpdp - MeitY DPDP Rules 2025. meity.gov.in (2026-11-13).

svc:hipaa - HHS cloud/ePHI guidance. hhs.gov (2026-11-13).

svc:pci - PCI DSS. pcisecuritystandards.org (2026-11-13).

svc:rbi - RBI payment-data storage FAQ. rbi.org.in (2026-11-13).

svc:iso - ISO/IEC 27001. iso.org (2026-11-13).

svc:soc - AICPA SOC 2 criteria. aicpa-cima.com (2026-11-13).

svc:pg-tx - PostgreSQL transactions. postgresql.org (2026-11-13).

svc:local-fs - Node filesystem API. nodejs.org (2026-11-13).

svc:workbox - Workbox precaching. developer.chrome.com (2026-11-13).

svc:git - Git documentation. git-scm.com (2026-11-13).

svc:python2-eol - Python 2 sunset. python.org (2026-11-13).

svc:angularjs-eol - AngularJS support status. docs.angularjs.org (2026-11-13).

svc:razorpay-privacy - Razorpay privacy policy. razorpay.com (2026-11-13).

svc:entra-residency - Microsoft Entra data residency. learn.microsoft.com (2026-11-13).


---


Appendix B. Source ledger 4

Links preserve the original source register. A record describes only its stated scope. Catalog review is not certification or empirical calibration.

svc:entra-oidc - Microsoft identity platform OIDC. learn.microsoft.com (2026-11-13).

svc:sql2019-lifecycle - SQL Server 2019 lifecycle. learn.microsoft.com (2026-11-13).

svc:azure-vnet-integration - App Service virtual network integration. learn.microsoft.com (2026-11-13).

svc:azure-storage-boundary - Azure Storage redundancy. learn.microsoft.com (2026-11-13).

svc:azure-storage-region - Azure Storage regional routing. learn.microsoft.com (2026-11-13).

svc:azure-ase-retail - Azure App Service Central India retail pricing API. prices.azure.com (2026-11-13).

svc:razorpay-checkout - Razorpay Standard Checkout integration. razorpay.com (2026-11-14).

svc:razorpay-pricing - Razorpay pricing. razorpay.com (2026-11-14).

svc:lightsail-bundles - Lightsail Linux IPv4 instance bundles. docs.aws.amazon.com (2026-11-15).

svc:lightsail-pricing - Lightsail transfer, disk and snapshots. aws.amazon.com (2026-11-15).

R01 - Knowledge-based recommender systems: overview and research directions. frontiersin.org (2024).

R02 - A decision support system for software technology selection. slingerjansen.nl (2018).

R03 - A Decision Support System for Pattern-Driven Software Architecture. link.springer.com (2020).

R04 - A Declarative Recommender System for Cloud Infrastructure Services Selection. arxiv.org (2012).

R05 - CloudGenius: Automated Decision Support for Migrating Multi-Component Enterprise Applications to Clouds. arxiv.org (2012).

R06 - QUICKXPLAIN: Preferred Explanations and Relaxations for Over-Constrained Problems. aaai.org (2004).

R07 - A formal proof and simple explanation of the QuickXplain algorithm. arxiv.org (2022).

R08 - Development of recommendation systems for software engineering: the CROSSMINER experience. link.springer.com (2021).

R09 - Explainable Recommendation: A Survey and New Perspectives. arxiv.org (2020).

R10 - A Survey on Metamorphic Testing. eprints.whiterose.ac.uk (2016).

R11 - Local-first software: you own your data, in spite of the cloud. repository.cam.ac.uk (2019).

R12 - Empirical Evaluation of AI-Assisted Software Package Selection: A Knowledge Graph Approach. arxiv.org (2025).

R13 - ATAM: Method for Architecture Evaluation. sei.cmu.edu (2000).

R14 - Cost Benefit Analysis Method (CBAM). sei.cmu.edu (2018).

R15 - SDMF: Systematic Decision-making Framework for Evaluation of Software Architecture. sciencedirect.com (2016).

P01 - Build an offline-first app. developer.android.com (2026-11-13).

P02 - Yjs introduction. docs.yjs.dev (2026-11-13).

P03 - Row Security Policies. postgresql.org (2026-11-13).

P04 - Full Text Search. postgresql.org (2026-11-13).

P05 - Transactions. postgresql.org (2026-11-13).

P06 - Choose an Azure compute service. learn.microsoft.com (2026-11-13).

P07 - Microservices architecture style. learn.microsoft.com (2026-11-13).


---


Appendix B. Source ledger 5

Links preserve the original source register. A record describes only its stated scope. Catalog review is not certification or empirical calibration.

P08 - AWS Well-Architected Framework. docs.aws.amazon.com (2026-11-13).

P09 - AWS Services by Region. aws.amazon.com (2026-11-13).

P10 - Shared Responsibility Model. aws.amazon.com (2026-11-13).

P11 - CP-SAT Solver. developers.google.com (2026-11-13).

P12 - Z3 parameters and unsat-core setting. microsoft.github.io (2026-11-13).

P13 - Why Astro?. docs.astro.build (2026-11-13).

P14 - OpenID Connect on the Microsoft identity platform. learn.microsoft.com (2026-11-13).

P15 - Technology Radar. thoughtworks.com (2026-11-13).

tool:node - Node.js release information. nodejs.org (2026-11-13).

tool:npm - npm CLI documentation. docs.npmjs.com (2026-11-13).

tool:types - DefinitelyTyped type definitions. github.com (2026-11-13).

tool:fastify - Fastify server reference. fastify.dev (2026-11-13).

tool:react - React state reference. react.dev (2026-11-13).

tool:vite - Vite guide. vite.dev (2026-11-13).

tool:ajv - Ajv documentation. ajv.js.org (2026-11-13).

tool:vitest - Vitest guide. vitest.dev (2026-11-13).

tool:typescript - TypeScript documentation. typescriptlang.org (2026-11-13).

tool:tsx - tsx documentation. tsx.is (2026-11-13).

tool:jstt - json-schema-to-typescript. github.com (2026-11-13).

tool:static - Fastify static assets plugin. github.com (2026-11-13).

tool:reportlab - ReportLab PDF toolkit. reportlab.com (2026-11-13).

tool:pypdf - pypdf documentation. pypdf.readthedocs.io (2026-11-13).

tool:poppler - Poppler utilities. poppler.freedesktop.org (2026-11-13).

tool:checkout - GitHub Actions checkout. github.com (2026-11-13).

tool:setup-node - GitHub Actions setup-node. github.com (2026-11-13).

N01 - Finding Counterfactual Explanations through Constraint Relaxations. arxiv.org (2026-11-14).

N02 - How to Evaluate Solutions in Pareto-based Search-Based Software Engineering?. arxiv.org (2026-11-14).

N03 - Why So Many Published Sensitivity Analyses Are False. arxiv.org (2026-11-14).

N04 - Maintain an architecture decision record. learn.microsoft.com (2026-11-14).
