# StackSense report narrative

Generated alongside the PDF; tables, images and complete source ledger are in the PDF and versioned evaluation data.

SYNERGY 26 / ARCHITECTURE DECISION ENGINE

StackSense

An explained technology stack, grounded in project constraints.

Soham BanerjeeIIIT-BangaloreSoham.Banerjee@iiitb.ac.ingithub.com/oki-dokii/StackSense14 November 2026

Application / engine / rules 0.6.0; core catalog 0.4.0; service policies 0.6.0. This is a local review package, not an assertion of online submission or independent owner review.

1. Abstract

StackSense converts a structured software-project brief into a deterministic, explained architecture. A local TypeScript engine validates inputs, filters compatible core stacks, checks required supporting services and data flows, estimates month-12 cost bands, and ranks complete designs. A CLI, Fastify API and React workspace share the same engine. The release includes 34 core entries, 24 service profiles, source records, actual JSON outputs and browser evidence. Of six supplied scenarios, two receive usable recommendations and four retain explicit evidence-relative blockers. The evaluation includes 220 automated tests, fourteen author-designed unseen-style cases, input-sensitivity experiments and measured local setup/API timings. The system makes no runtime LLM calls and requires no paid key. Costs, performance targets and framework controls are disclosed assumptions and implementation tasks, not provider quotes, benchmarks of suggested stacks, or certification.

2. Problem understanding

The task is one recommendation engine, not six applications. The supplied scenarios are inputs, not labeled expected answers. Recommendations must cover four core layers, required supporting capabilities, input drivers, alternatives, trade-offs and cost assumptions. Residency, explicit provider and deployment are strict; unsupported decisive evidence withholds the stack. Budget and timeline remain explicit preference/risk trade-offs under the documented brief ambiguities.


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

The core catalog has 34 entries and 46 dated primary-source records; service policies add 24 profiles, 53 source records and two known lifecycle rules. Records describe product family, runtime, client coverage, driver edges, deployment/provider mappings, regions, complexity/operating burden, trade-offs and source scope. Active status is required; maintained product families still need supported versions pinned during a real build.

Evaluate complete plans before ranking

1. Validate, normalize and record defaults.2. Derive bounded, field-linked architecture hints.3. Filter core domains by target, rendering, deployment, provider and reviewed primary regions.4. Enumerate compatible frontend/backend/database/host combinations; prune unsupported driver/runtime/storage edges.5. Add required services; reject incompatible client/database/provider, restricted external flow or missing decisive evidence.6. Build controls and estimate only complete compatible designs.7. Rank, attach alternative/driver evidence, then validate the organiser-format result.

Search uses smallest domains and stable IDs, without a top-K core shortlist. An assignment limit raises an internal failure; it never turns interrupted search into infeasibility. Infeasibility means no complete design in this reviewed catalog, not impossibility in the real world.

Each 0-5 fit is multiplied by its supplied 1-5 priority. Ties use lower cost upper bound, fewer operated resources and stable plan ID. Rubrics are transparent but uncalibrated; rounding and stable ties can select among similarly scored technologies. No scenario ID/name or runtime LLM chooses a stack.


---


5. Evidence, services and costs

Service profiles cover identity, SMS OTP, realtime collaboration, local offline data, full-text search, forced RLS, media, hosted checkout, transactional outbox/workers, CPU inference, telemetry and build/deploy support. Keycloak TOTP is not mislabeled as phone delivery. Dynamic offline writes need application reconciliation/idempotency; public static offline reads use Workbox without inventing a database/queue.

Scope and residency are checked separately

GCP reviewed mappings include Mumbai, Belgium and Iowa. The release adds AWS Fargate and RDS PostgreSQL primary mapping in Mumbai using Fargate/region/RDS documentation [core:fargate-regions, core:aws-regions, core:rds-regions]. This does not approve external identity, SMS or payment handling. Central India now has a separate App Service Environment v3 Linux Isolated v2 profile, PostgreSQL Flexible Server with in-region backups, and private Blob LRS. This evidence is not applied to shared App Service or other regions. Entra tenant flows are assessed separately.

Strict residency rejects external providers without reviewed end-to-end country scope. Framework designs require configuration, retention/deletion, access/restore tests and qualified review. HIPAA cloud/external services need eligible scope and executed BAA evidence. Explicit RBI localisation derives India only when the label requests it; contradictory regions reject. Known Python 2 and AngularJS support endings warn on existing systems without mislabeling Python 3 or maintained Angular.

Month-12 planning bands

Resource lines expose quantities, USD rate intervals, source IDs and assumptions. Fixed-point BigInt multiplication rounds line bounds outward to cents; totals use integer cents. Shared hosting/CDN and database auth/search/outbox capacity are not double billed. Separate compute includes workers, identity, telemetry and inference allocations. Database CPU/RAM/storage, backups, media, network, CI, SMS and payment assumptions are included when selected.

Published reference cloud rates are distinguished from authored allowances/proxies. They are not selected-region quotes or measured capacity. Missing RPS, egress and transaction activity use visible hypotheses. Taxes, development/on-call labor, domains, new owned-hardware procurement and specialized model acquisition are excluded. Higher availability provisions redundancy hypotheses without guaranteeing an SLA.

An over-budget usable plan is explicitly ok_with_warnings. Hard evidence blockers withhold the stack and use estimate_status: not_estimated; the required 0-0 serialization is never a free-price claim. Source/rules versions make every result reproducible.


---


6. Sample recommendations: P1

P1 / DevFolio - actual local release UI, engine 0.6.0. The complete output is outputs/P1_output.json.

Inputs: a solo beginner, JavaScript/HTML/CSS, two weeks, Markdown portfolio/blog, web-only SEO, no dynamic features, 3,000 year-one users and USD 0 infrastructure budget.

Selected: Astro produces static content; None backend and None database avoid services that the stated features do not need. Cloudflare Pages serves the static build; CDN delivery is the same bundle and local Git/build scripts avoid assumed paid CI. The month-12 hosting band is USD 0-0 under static-asset, build/file and add-on limits.

Why this combination: static rendering covers SEO and Markdown authoring. HTML/CSS is a real compatible alternative, scored 82 versus 86 for the selected plan under the manual content-conversion rubric. A complete Cloud Run plan scored 61. Dynamic backend/database alternatives do not survive the static requirement profile; their omission is explained rather than represented by empty component fields.

Trade-offs: publishing is a content build, not a dynamic application. Functions, paid domains, external identity, uploads and private/country-restricted global-edge data are outside the selected profile. Free delivery does not establish an SLA. These constraints are visible in assumptions and the informational deployment-limit warning.


---


6. Sample recommendations: P3

P3 / BoardRoom - actual warned result. Selected plan score 85; alternatives are relative whole-plan comparisons, not intrinsic product rankings.

Inputs: collaborative whiteboard, web, 5,000 peak concurrent users, tenant isolation, social login, media, payments, 100 ms p95 target, 99.9% availability and a USD 1,500 month-12 budget. No country residency is specified; full-text search is false and is omitted.

Selected: Angular, Fastify, PostgreSQL and Cloud Run. Yjs + ws covers shared CRDT state/transport; PostgreSQL outbox workers persist/retry updates, forced RLS supports tenant boundaries, Keycloak brokers identity, regional private object storage handles uploads and Stripe Checkout isolates card credentials. Telemetry and hosted CI are included with stated limits.

Alternatives and limits: React/Vite and a Go-backend plan tied on score; published cost/operation/ID tie-breaks selected this result. AWS hosting scored 81. This is not proof Angular is best. Application auth, document persistence, cross-instance coordination and conflict UX must still be built.

Costs: USD 875.51-7,785.95/month. Application compute contributes USD 600.16-4,321.23; unknown payment activity contributes up to USD 2,500. Remaining database/storage/backup/network/telemetry/CI lines are exposed in JSON. The upper band exceeds budget. SLA, latency, social identity terms and GDPR control implementation require review; none is certified by this recommendation.


---


6. Public scenarios: P2 and P4

P2 / FixIt Now - infeasible relative to reviewed evidence. Marketplace web/Android features are not silently removed to meet USD 150. Both phone delivery and payment data-flow India scope lack reviewed assurance; no monthly estimate is fabricated.

P4 / QuickCredit - AWS Mumbai primary compute/database evidence is now available. The lending/ledger design still cannot approve required India-only external OTP/payment flows. RBI/PCI/DPDP/ISO labels do not substitute for contract, application and configuration evidence. Output stack is null; cost is Not estimated.


---


6. Public scenarios: P5 and P6

P5 / PeopleDesk - A distinct Azure Central India isolated compute/PostgreSQL/storage profile is now reviewed. P5 still cannot approve existing Entra tenant data flows from the supplied input; on-prem SQL Server 2019 reuse, connectivity, licenses and capacity also need project evidence. No silent migration, public region substitution or certified ISO status is asserted.

P6 / KhetSurvey - offline Android durability, retries, resumable media and a server outbox are modeled building blocks. The complete design remains blocked by phone-OTP India data-flow evidence. A device-memory hint requires measurement, not an invented framework benchmark. No-plan cost 0-0 means Not estimated, not a free deployment.


---


7. Edge-case handling

All nine categories below have actual release evaluations and unedited overview screenshots in Appendix A. Full errors/warnings/choices are in evaluation/outputs. These are author-designed unseen-style cases, not organiser hidden tests or independent expert judgments.

Additional cases test reviewed AWS India, offline native writes, cloud-none/managed contradiction, unsupported RAG and an unknown extension. Invalid catalog data or exhausted search remains an internal failure. No result claims all conflicts are minimal or all EOL technologies are known.


---


8. Validation and measurements

220 automated tests pass across eight files: contract/default/provenance, catalog/driver integrity, compatible search, complete services/costs, metadata/order mutations, CLI subprocess IO, exact API/engine parity, transport/security, browser model and fourteen release cases. Generated TypeScript freshness, compiler and production browser/server builds pass. Twenty actual public/evaluation output files are checked byte-for-byte against the current engine.

Fourteen author-designed case expectations cover statuses, field errors, required services, local deployment, region retention and simplicity. Metamorphic checks rename metadata/reorder set-like inputs and ensure hard constraints remain filters. Six paired usage experiments show real cost effects. No external expert review, organiser hidden-case results or calibrated recommendation-quality accuracy is claimed.

Observed local API timings

Measured on Apple M2, 8 GB RAM, macOS arm64, Node v22.17.1, npm 10.9.2. Cold Node/API startup to health: 288.056 ms. Each case had one warm-up and twenty real loopback HTTP POSTs through consumed JSON. Browser rendering, recommended workload performance and cloud provisioning are excluded.

Clean setup rehearsal

A source ZIP was extracted to a fresh directory. Cached offline npm ci, all checks, build, evaluation and output verification completed in 20.392 seconds. Runtime/test source digest is recorded and checked during final packaging. The populated dependency cache avoids a new network download; online installation speed and Windows/Linux execution are not claimed. The CI matrix covers macOS, Ubuntu and Windows on Node 22/24; remote run results are separate from this local measurement.

Browser evidence covers sample/import/batch, all statuses, export parity, stale-export blocking, keyboard controls and 360 px overflow checks. This is not a full accessibility or browser conformance audit. Official product/source alignment is reviewed; no paper experiment was reproduced.


---


Decision guidance in release 0.6.0

Actual expanded P3 cost sensitivity view. Infrastructure/operations and payment/message activity are separated. Trial values keep the selected architecture fixed; they do not edit the brief or rerank plans.

Blocked results now export review_actions: affected requirements/components, missing evidence, concrete next actions and primary references. Checklists distinguish evidence gaps, constraint conflicts and pricing-model limits. A free-text vendor assertion cannot clear a blocker. P2 has independent OTP and payment tasks; resolving one does not resolve the other.

Existing systems receive integration_reviews for federation, SQL reuse or inventory. Tenant scope, private connectivity, ownership, licenses, recovery and incremental costs remain pending project evidence; no migration or reuse savings are invented. SQL Server 2019 extended support is distinguished from EOL.

Usable results expose up to three fully evaluated plan_comparison entries, including service sets, regions, scores/ties, cost, operating burden and retained constraints. Cost groups reconcile in cents. One-at-a-time usage trials disclose supplied versus assumed values, headroom and the absence of reranking. Price-line units, rates and source links are visible in the UI.

Azure Central India Linux I1 v2 compute uses a captured public consumption meter at USD 0.395 per instance-hour. Whole two-vCPU instances and replica floors are retained. Other capacity and database/storage/network rates remain disclosed planning proxies; one verified meter does not calibrate an entire deployment.


---


9. Limitations and future work

Four of six public scenarios remain unusable under the current evidence policy. The engine deliberately does not equate a regional app host, an Indian vendor or a compliance badge with complete identity/payment data-flow assurance. Broader Azure variants and existing-tenant boundaries need deeper review; Central India isolated compute/database/storage is now separately scoped. This conservative coverage has a real recommendation-quality cost; it is not presented as complete scenario support.

The catalog is finite and product-family based. Framework/API/driver versions, regional quotas, contract eligibility, data retention and all application controls need deployment review. Training/RAG, broader search/storage options, comprehensive lifecycle coverage, private network integration and general prose understanding remain limited.

Costs use capacity hypotheses and authored allowances as well as reference prices. SLA/latency are targets, not guarantees. Ordinal fits are not statistically calibrated; close plans may tie and stable IDs can determine the winner. Independent architecture review, tariff validation, target-device/load tests and calibrated capacity examples and tenant/vendor evidence remain high-value improvements. Actionable blocker tasks, complete-plan comparisons and fixed-plan usage sensitivity are implemented in 0.6.0.

10. References and third-party tools

Appendix B enumerates the complete core, service/control/lifecycle and research source registers with clickable links and their versioned IDs. Source scope/review dates are recorded in packages/catalog/data and docs/research/sources.json. Relevant IDs appear in outputs; referenced availability evidence does not establish legal or pricing approval.


---


11. AI assistance declaration

OpenAI Codex was used for requirement interpretation, research/source lookup, planning documents, catalog/rule/rubric drafts, TypeScript implementation, tests, browser checks, measurement scripts, report authoring and packaging. The Sites skill guided the local repository UI workflow; the PDF skill guided report generation and visual QA. No other person or team was delegated implementation work in this release.

There are no runtime LLM calls, model-selected stacks or paid-key requirements. The accepted --no-llm CLI flag is a no-op because selection is entirely local rules/search/scoring. Research papers were used as design guidance with recorded review depth; their experiments were not replicated. AI-generated choices are not independent expert verification.

The participant must understand, review, revise where appropriate and own the AI-assisted design, research and reasoning before submitting. This report does not assert that independent owner review or unaided authorship has already happened. The name, college and email on the title page were explicitly supplied by Soham Banerjee, with permission to include the report in the public repository.

Release package and owner handoff

The local StackSense26_SohamBanerjee package contains source/source.zip with README at its root, the six actual public output JSON files, this PDF, submission notes and a SHA-256 manifest. Dependencies, build output, caches, credentials and Git internals are excluded. A runtime/test source digest connects the package to its setup rehearsal; ZIP integrity and size are checked.

Owner actions remain: review the complete implementation/research and AI disclosure; create the correctly named Drive folder; set and verify link-view access in a private browser; submit the folder link on Unstop before the stated deadline; and stop changing the submitted folder after that deadline. This package has not been uploaded, shared or submitted by the coding agent.

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

E05 / Regulatory constraints - infeasible. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/E05_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.

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


---


Appendix B. Source ledger 2

Links preserve the original source register. A record describes only its stated scope. Catalog review is not certification or empirical calibration.

core:cloudsql-pg - Cloud SQL PostgreSQL locations. cloud.google.com (2026-11-13).

core:cloudsql-my - Cloud SQL MySQL overview. cloud.google.com (2026-11-13).

core:rds-pg - RDS PostgreSQL. docs.aws.amazon.com (2026-11-13).

core:rds-maria - RDS MariaDB. docs.aws.amazon.com (2026-11-13).

core:rds-sql - RDS SQL Server. docs.aws.amazon.com (2026-11-13).

core:azure-pg - Azure PostgreSQL. learn.microsoft.com (2026-11-13).

core:azure-sql - Azure SQL Managed Instance. learn.microsoft.com (2026-11-13).

core:ec2 - Amazon EC2. docs.aws.amazon.com (2026-11-13).

core:nginx - NGINX static serving. docs.nginx.com (2026-11-13).

core:astro-markdown - Astro Markdown. docs.astro.build (2026-11-13).

core:fargate-regions - ECS Fargate supported regions. docs.aws.amazon.com (2026-11-13).

core:aws-regions - AWS region country mapping. docs.aws.amazon.com (2026-11-13).

core:rds-regions - Amazon RDS regional endpoints. docs.aws.amazon.com (2026-11-13).

core:azure-ase - App Service Environment v3 region and data boundary. learn.microsoft.com (2026-11-13).

core:azure-pg-regions - Azure PostgreSQL Flexible Server overview. learn.microsoft.com (2026-11-13).

core:azure-pg-backup - Azure PostgreSQL backup and restore. learn.microsoft.com (2026-11-13).

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


---


Appendix B. Source ledger 3

Links preserve the original source register. A record describes only its stated scope. Catalog review is not certification or empirical calibration.

svc:mysql-fts - MySQL full-text. dev.mysql.com (2026-11-13).

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

svc:run-price - Cloud Run pricing. cloud.google.com (2026-11-13).

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


---


Appendix B. Source ledger 4

Links preserve the original source register. A record describes only its stated scope. Catalog review is not certification or empirical calibration.

svc:angularjs-eol - AngularJS support status. docs.angularjs.org (2026-11-13).

svc:razorpay-privacy - Razorpay privacy policy. razorpay.com (2026-11-13).

svc:entra-residency - Microsoft Entra data residency. learn.microsoft.com (2026-11-13).

svc:entra-oidc - Microsoft identity platform OIDC. learn.microsoft.com (2026-11-13).

svc:sql2019-lifecycle - SQL Server 2019 lifecycle. learn.microsoft.com (2026-11-13).

svc:azure-vnet-integration - App Service virtual network integration. learn.microsoft.com (2026-11-13).

svc:azure-storage-boundary - Azure Storage redundancy. learn.microsoft.com (2026-11-13).

svc:azure-storage-region - Azure Storage regional routing. learn.microsoft.com (2026-11-13).

svc:azure-ase-retail - Azure App Service Central India retail pricing API. prices.azure.com (2026-11-13).

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


---


Appendix B. Source ledger 5

Links preserve the original source register. A record describes only its stated scope. Catalog review is not certification or empirical calibration.

P07 - Microservices architecture style. learn.microsoft.com (2026-11-13).

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
