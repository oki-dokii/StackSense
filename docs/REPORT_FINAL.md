# StackSense report narrative

Generated alongside the PDF; tables, images and complete source ledger are in the PDF and versioned evaluation data.

SYNERGY 26 / ARCHITECTURE DECISION ENGINE

StackSense

An explained technology stack, grounded in project constraints.

Soham BanerjeeIIIT-BangaloreSoham.Banerjee@iiitb.ac.ingithub.com/oki-dokii/StackSense15 November 2026

Application and recommendation engine/rules/services 0.9.1; Decision Lab analysis 0.2.0; core catalog 0.6.0. Deterministic local execution, with explicit provisional exceptions and itemized cost scope.

1. Abstract

StackSense converts a structured software-project brief into a deterministic, explained architecture. A local TypeScript engine validates inputs, filters compatible core stacks, checks required supporting services and data flows, estimates month-12 cost bands, and ranks complete designs. A CLI, Fastify API and React workspace share the same engine. The release includes 43 core entries, 34 service profiles, source records, actual JSON outputs and browser evidence. All six supplied scenarios receive stacks; five carry critical capacity, integration or external-boundary exceptions rather than unsupported compliance claims. The evaluation includes 405 automated tests, sixty varied project briefs across fifteen concrete types, fourteen edge cases, twelve region/auth/payment combinations, sensitivity experiments and measured local setup/API timings. The system makes no runtime LLM calls and requires no paid key. Costs, performance targets and framework controls are disclosed assumptions and implementation tasks, not provider quotes, benchmarks of suggested stacks, or certification.

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

The core catalog has 43 entries and 75 dated primary-source records; service policies add 34 profiles, 92 source records and two known lifecycle rules. Records describe product family, runtime, client coverage, driver edges, deployment/provider mappings, regions, complexity/operating burden, trade-offs and source scope. Active status is required; maintained product families still need supported versions pinned during a real build.

Evaluate complete plans before ranking

1. Validate, normalize and record defaults.2. Derive bounded, field-linked architecture hints.3. Filter core domains by target, rendering, deployment, provider and reviewed primary regions.4. Enumerate compatible frontend/backend/database/host combinations; prune unsupported driver/runtime/storage edges.5. Add required services; reject incompatible client/database/provider, restricted external flow. Missing external-scope evidence becomes an explicit critical review condition.6. Build controls and estimate only complete compatible designs.7. Rank, attach alternative/driver evidence, then validate the organiser-format result.

Search uses smallest domains and stable IDs, without a top-K core shortlist. An assignment limit raises an internal failure; it never turns interrupted search into infeasibility. Infeasibility means no complete design in this reviewed catalog, not impossibility in the real world.

For GDPR with unspecified residency, reviewed EU compute/database placement takes precedence among complete feasible plans; explicit region/provider constraints remain intact. Next, a complete plan in a supported backend language takes precedence over an unfamiliar runtime when available. Within that language tier, an upper-bound infrastructure budget fit takes precedence over weighted fit. Each 0-5 fit is multiplied by its supplied 1-5 priority. Remaining ties use lower cost upper bound, fewer operated resources, fewer unrequested client targets and stable plan ID. Rubrics are transparent but uncalibrated; rounding and stable ties can select among similarly scored technologies. No scenario ID/name or runtime LLM chooses a stack.


---


5. Evidence, services and costs

Service profiles cover identity, SMS OTP, realtime collaboration, local offline data, full-text search, forced RLS, media, hosted checkout, transactional outbox/workers, CPU inference, telemetry and build/deploy support. Keycloak TOTP is not mislabeled as phone delivery. Dynamic offline writes need application reconciliation/idempotency; public static offline reads use Workbox without inventing a database/queue.

Scope and residency are checked separately

Primary mappings cover reviewed GCP/AWS regions and separate Azure India variants. Central India Basic B1 Linux is priced from the official USD0.018/hour meter retained in evaluation/azure-b1-price.json; its VNet/private SQL design and standard-service metadata geography remain critically unverified. It does not inherit ASE assurance. DigitalOcean dynamic Bangalore and Spaces BLR1 are separately mapped; global CDN/control-plane scope is unverified. Native build/test, paid containers, continuous worker and regional archive are priced within reviewed limits. No cloud resource was purchased or deployed.

Known external integrations with unverified residency are proposed with critical exceptions and explicit reduced-assurance assumptions. Real deployment or region conflicts still reject a plan. Framework designs require configuration, retention/deletion, access/restore tests and qualified review. HIPAA cloud/external services need eligible scope and executed BAA evidence. Explicit RBI localisation derives India only when the label requests it; contradictory regions reject. Known Python 2 and AngularJS support endings warn on existing systems without mislabeling Python 3 or maintained Angular.

Month-12 planning bands

Resource lines expose quantities, USD rate intervals, source IDs and assumptions. Fixed-point arithmetic rounds outward to cents. Cloud Run separates request duty from full-month instance-based support; always-on workers and identity do not receive a request-only discount. Shared hosting/CDN and database auth/search/outbox capacity are not double billed. Separate compute includes workers, identity, telemetry and inference allocations. Database CPU/RAM/storage, backups, media, network and CI form the headline. SMS/payment assumptions are itemized as additional activity scenarios, outside infrastructure budget scoring.

Lightsail adds published full-month Linux IPv4 bundles, SSD/transfer allowances, snapshots and extra disk. Burstable capacity and recovery require tests. Missing RPS, egress and activity remain visible hypotheses; taxes, labor, domains and new hardware are excluded. Reference/proxy rates are not regional quotes or capacity guarantees.

Paid managed variants add Supabase Pro/Neon Launch and Vercel/Fly. Fly/Neon have no reviewed India mapping. Pro is not an eligible HIPAA tier; Vercel Functions cannot host persistent Yjs or resident inference here. Daily activity defaults to an authored 20% of population, floored at supplied peak concurrency; explicit RPS overrides it. These assumptions require validation.

Budget planning exposes a same-brief catalog floor and optional changed-requirement proposals only when cheaper. P5 and P6 now have upper infrastructure estimates within their original budgets. P2 remains USD5.98 above budget at the upper bound. Supplying a hypothetical 9M billed realtime messages yields USD89.09-133.48, but that quantity is not known for the public brief and is never inserted automatically. Existing requirements and critical conditions remain intact.


---


6. Sample recommendations: P1

P1 / DevFolio - actual local release UI, engine 0.9.1. The complete output is outputs/P1_output.json.

Inputs: a solo beginner, JavaScript/HTML/CSS, two weeks, Markdown portfolio/blog, web-only SEO, no dynamic features, 3,000 year-one users and USD 0 infrastructure budget.

Selected: Astro produces static content; None backend and None database avoid services that the stated features do not need. Cloudflare Pages serves the static build; CDN delivery is the same bundle and local Git/build scripts avoid assumed paid CI. The month-12 hosting band is USD 0-0 under static-asset, build/file and add-on limits.

Why this combination: static rendering covers SEO and Markdown authoring. HTML/CSS is a real compatible alternative, scored 82 versus 86 for the selected plan under the manual content-conversion rubric. Other compatible hosting plans remain available for comparison. Dynamic backend/database alternatives do not survive the static requirement profile; their omission is explained rather than represented by empty component fields.

Trade-offs: publishing is a content build, not a dynamic application. Functions, paid domains, external identity, uploads and private/country-restricted global-edge data are outside the selected profile. Free delivery does not establish an SLA. These constraints are visible in assumptions and the informational deployment-limit warning.


---


6. Sample recommendations: P3

P3 / BoardRoom - actual critically qualified result; alternatives are relative whole-plan comparisons, not intrinsic product rankings.

Inputs: collaborative whiteboard, web, 5,000 peak concurrent users, tenant isolation, social login, media, payments, 100 ms p95 target, 99.9% availability and a USD 1,500 month-12 budget. GDPR is required with no country residency specified: the general rule selects EU Frankfurt compute (fra) and database (eu-central-1). A critical note requires processor DPAs and transfer/data-flow review. Full-text search is false and is omitted.

Selected: Angular, Express, Supabase Pro PostgreSQL and Fly Machines. Yjs + ws covers shared CRDT state/transport; PostgreSQL outbox workers persist/retry updates, forced RLS supports tenant boundaries, Supabase Auth brokers identity, Supabase regional Storage handles direct signed uploads and Stripe Checkout isolates card credentials. Telemetry and hosted CI are included with stated limits.

Alternatives and limits: React/Vite and Go HTTP are reviewed alternatives. Go remains a complete viable candidate for this TypeScript/Go team; no framework receives a measured latency bonus. Other cloud variants remain visible in the full catalog frontier. This is not proof Angular is best. Application auth, document persistence, cross-instance coordination and conflict UX must still be built.

Costs: infrastructure USD 291.90-583.02/month. Compute contributes USD 162.90-244.38; peak WebSocket capacity is counted once. Additional assumed payment activity is USD 0.00-2,500.00, excluded from the headline. The infrastructure upper bound is inside USD 1,500 under the stated hypotheses; managed tier capacity and availability remain critically unverified. Remaining resource lines and assumptions are exposed in JSON; SLA, latency, identity terms and GDPR controls require review.


---


6. Public scenarios: P2 and P4

P2 / FixIt Now - provisional Next.js + React Native, Django, Supabase Pro PostgreSQL and App Platform Bangalore containers. MSG91 and Razorpay are selected with critical India data-flow review conditions. Infrastructure USD 89.09-155.98/month straddles USD 150 with a USD 5.98 upper-bound gap; no feature or residency claim is silently treated as satisfied.

P4 / QuickCredit - ECS/Fargate and PostgreSQL in Mumbai, with Spring Boot and web/Android clients; senior Java/Kotlin ecosystem familiarity affects delivery/maintenance. MSG91/Razorpay external flows remain critically qualified. Checkout does not itself implement lending authorization, KYC, double-entry ledger, disbursal or mandates; these are explicitly scoped implementation and eligibility conditions.


---


6. Public scenarios: P5 and P6

P5 / PeopleDesk - React, ASP.NET Core, existing SQL Server and Azure Basic B1 Linux Central India, with direct OIDC/SAML integration to the existing Entra tenant. Tenant geography is critically unverified; existing SQL Server geography, private connectivity, capacity and licenses remain critically unverified; no migration or free entitlement is inferred. Infrastructure USD 66.42-202.42/month is within the USD 300 planning budget; standard-service metadata and private connectivity remain critical conditions.

P6 / KhetSurvey - React Native, Django, Supabase Pro PostgreSQL and App Platform Bangalore containers, with device-local persistence, an outbox, idempotent retry/conflict handling and resumable media. MSG91 phone delivery has a critical India boundary condition. Infrastructure USD 55.25-62.02/month excludes SMS activity; target-device memory still needs measurement.


---


7. Edge-case handling

All nine categories below have actual release evaluations and unedited overview screenshots in Appendix A. Full errors/warnings/choices are in evaluation/outputs. These are author-designed unseen-style cases, not organiser hidden tests or independent expert judgments.

Additional cases test reviewed AWS India, offline native writes, cloud-none/managed contradiction, unsupported RAG and an unknown extension. Invalid catalog data or exhausted search remains an internal failure. No result claims all conflicts are minimal or all EOL technologies are known.


---


8. Validation and measurements

405 application tests pass across sixteen files, plus 22 native tooling tests. Types, production builds and twenty recommendation/six Decision Lab artifacts are checked against current code. Sixty authored briefs cover fifteen types: 57 stacks, three expected blockers (training, air-gap/SaaS, RBI/US). Every case is repeated and compared with actual CLI --no-llm output. Lower-bound budget overruns on the unchanged original thirty fall from 15 to 4; the expanded sixty retain 9 overruns and two bands wider than 5x. Metamorphic checks cover identifiers, input order, known languages, provider/region constraints and local OTP/payment-cost effects. These are functional invariants, not organiser hidden tests, independent architecture grading or production benchmarks.

Observed local API timings

Measured on Apple M2, 8 GB RAM, macOS arm64, Node v22.17.1, npm 10.9.2. Cold Node/API startup to health: 304.148 ms. Each case had one warm-up and twenty real loopback HTTP POSTs through consumed JSON. Browser rendering, recommended workload performance and cloud provisioning are excluded.

Clean setup rehearsal

A source ZIP was extracted to a fresh directory. Cached offline npm ci, all checks, build, evaluation and output verification completed in 33.277 seconds. Runtime/test source digest is recorded and checked during final packaging. The populated dependency cache avoids a new network download; online installation speed and Windows/Linux execution are not claimed. The CI matrix covers macOS, Ubuntu and Windows on Node 22/24; remote run results are separate from this local measurement.

Browser evidence covers batch outputs, export parity and desktop/narrow budget layouts. All nine custom DOM snapshots were refreshed, including automatic validation-summary focus and budget-link recovery on a fresh invalid scenario. This is not a full accessibility or browser conformance audit. Official product/source alignment is reviewed; no paper experiment was reproduced.


---


Decision Lab: application 0.9.1

Actual P3 Decision Lab view. All 324 completed catalog plans are plotted; 12 identifiers are nondominated under the three declared model objectives. Inspecting an alternative never changes the original recommendation.

The separate analysis endpoint runs the original recommendation plus 24 one-priority-at-a-time changes. P3 retains its winner in 25/25 settings while equal-score alternatives remain. This count is not a confidence probability, unique superiority or global sensitivity analysis; interactions are not exhaustively explored.

The tradeoff front minimizes monthly cost upper bound and operated component units while maximizing the ORIGINAL-priority weighted score. It uses every completed candidate, not just the top three. All metrics retain their heuristic/planning scope. A lower upper cost can still have a higher lower cost, so inspect both bounds and assumptions.

All public briefs support priority/tradeoff analysis. Decision Lab functional trials preserve protected infrastructure/compliance fields; separately labeled budget proposals may explicitly lower availability or move to self-managed VMs. Nothing is automatically applied. P5 fits its planning budget while private SQL/metadata/tenant evidence remains unverified. Evaluation counts refer to top-level scenario trials, excluding the baseline budget rerun.

Proposed ADR Markdown and exact JSON exports include the original result, input digest, versions, alternatives, scoped references and implementation review tasks. Browser exports match API/engine artifacts; stale exports are blocked after edits. The exported baseline exactly matches the current 0.9.1 recommendation; critical warnings are preserved. Counterfactual, Pareto evaluation, sensitivity and ADR sources are N01-N04 in Appendix B; their experiments were not reproduced.


---


9. Limitations and future work

Five public scenarios contain critical capacity or external-boundary exceptions. The engine does not equate a regional app host, an Indian vendor or a compliance badge with complete identity/payment data-flow assurance. Basic and isolated Azure profiles are separately scoped; existing-tenant/network and metadata boundaries still require project-specific evidence. Provisional proposals increase architecture coverage while leaving these unresolved conditions explicit.

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


Appendix A. Edge evidence 1-3

E01 / Missing fields - invalid_input. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/E01_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.

E02 / Invalid values - invalid_input. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/E02_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.

E03 / Contradictions - ok_with_warnings. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/E03_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.


---


Appendix A. Edge evidence 4-6

E04 / Over-engineering traps - ok. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/E04_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.

E05 / Regulatory constraints - ok_with_warnings. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/E05_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.

E06 / Existing systems - ok_with_warnings. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/E06_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.


---


Appendix A. Edge evidence 7-9

E07 / Restricted deployment - ok_with_warnings. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/E07_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.

E08 / Skill mismatch - ok_with_warnings. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/E08_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.

E09 / Deprecated technology - ok_with_warnings. Actual overview from the 15-item UI batch; complete diagnostics: evaluation/outputs/E09_output.json. Invalid items appear as Scenario 7 / Scenario 8 because invalid reports do not claim normalized metadata.


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

core:rds-pg - RDS PostgreSQL. docs.aws.amazon.com (2026-11-13).


---


Appendix B. Source ledger 2

Links preserve the original source register. A record describes only its stated scope. Catalog review is not certification or empirical calibration.

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

core:nest-db - NestJS TypeORM integration. docs.nestjs.com (2026-11-15).

core:express-db - Express database integration. expressjs.com (2026-11-15).

core:supabase-regions - Supabase specific project regions. supabase.com (2026-11-15).

core:supabase-price - Supabase Pro pricing. supabase.com (2026-11-15).

core:neon-regions - Neon regions. neon.com (2026-11-15).

core:neon-price - Neon Launch pricing. neon.com (2026-11-15).

core:fly-regions - Fly.io regions. docs.fly.io (2026-11-15).

core:fly-docker - Fly Dockerfile deployment. docs.fly.io (2026-11-15).

core:fly-price - Fly resource pricing. docs.fly.io (2026-11-15).

core:vercel-regions - Vercel regions. vercel.com (2026-11-15).

core:vercel-pro - Vercel Pro plan. vercel.com (2026-11-15).

core:vercel-django - Vercel Django deployment. vercel.com (2026-11-15).

core:vercel-go - Vercel Go runtime. vercel.com (2026-11-15).

core:vercel-ws - Vercel WebSocket limitation. vercel.com (2026-11-15).

core:azure-b1-india-price - Azure Retail Prices API: Central India B1 Linux. prices.azure.com (2026-11-15).

core:azure-app-network - App Service VNet integration. learn.microsoft.com (2026-11-15).

core:azure-app-scope - App Service security and deployment scope. learn.microsoft.com (2026-11-15).


---


Appendix B. Source ledger 3

Links preserve the original source register. A record describes only its stated scope. Catalog review is not certification or empirical calibration.

core:do-app-regions - App Platform regional availability. docs.digitalocean.com (2026-11-15).

core:do-app-price - App Platform container pricing. docs.digitalocean.com (2026-11-15).

core:do-app-runtime - App Platform containers. docs.digitalocean.com (2026-11-15).

core:do-app-build - App Platform build commands and limits. docs.digitalocean.com (2026-11-15).

core:do-app-sla - App Platform component SLA. digitalocean.com (2026-11-15).

core:do-spaces-price - Spaces storage pricing. docs.digitalocean.com (2026-11-15).

core:do-spaces-regions - Spaces regional availability. docs.digitalocean.com (2026-11-15).

core:otel-s3-export - OpenTelemetry S3 exporter. github.com (2026-11-15).

core:do-region-country - DigitalOcean datacenter geography. docs.digitalocean.com (2026-11-15).

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

svc:pg-rls - PostgreSQL row security. postgresql.org (2026-11-13).

svc:gcs - Cloud Storage locations. cloud.google.com (2026-11-13).

svc:s3 - Amazon S3. docs.aws.amazon.com (2026-11-13).

svc:telemetry - OpenTelemetry Collector. opentelemetry.io (2026-11-13).

svc:gcp-logs - Regional Cloud Logging. cloud.google.com (2026-11-13).

svc:aws-logs - CloudWatch Logs. docs.aws.amazon.com (2026-11-13).

svc:onnx - ONNX Runtime. onnxruntime.ai (2026-11-13).

svc:ci - GitHub Actions. docs.github.com (2026-11-13).

svc:jenkins - Jenkins installation. jenkins.io (2026-11-13).


---


Appendix B. Source ledger 4

Links preserve the original source register. A record describes only its stated scope. Catalog review is not certification or empirical calibration.

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


---


Appendix B. Source ledger 5

Links preserve the original source register. A record describes only its stated scope. Catalog review is not certification or empirical calibration.

svc:supabase-regions - Supabase specific project regions. supabase.com (2026-11-15).

svc:supabase-price - Supabase Pro pricing. supabase.com (2026-11-15).

svc:neon-regions - Neon regions. neon.com (2026-11-15).

svc:neon-price - Neon Launch pricing. neon.com (2026-11-15).

svc:fly-regions - Fly.io regions. docs.fly.io (2026-11-15).

svc:fly-docker - Fly Dockerfile deployment. docs.fly.io (2026-11-15).

svc:fly-price - Fly resource pricing. docs.fly.io (2026-11-15).

svc:vercel-regions - Vercel regions. vercel.com (2026-11-15).

svc:vercel-pro - Vercel Pro plan. vercel.com (2026-11-15).

svc:vercel-django - Vercel Django deployment. vercel.com (2026-11-15).

svc:vercel-go - Vercel Go runtime. vercel.com (2026-11-15).

svc:vercel-ws - Vercel WebSocket limitation. vercel.com (2026-11-15).

svc:supabase-compute - Supabase compute pricing. supabase.com (2026-11-15).

svc:supabase-sms-hook - Supabase Send SMS hook. supabase.com (2026-11-15).

svc:supabase-realtime - Supabase Broadcast. supabase.com (2026-11-15).

svc:supabase-storage - Supabase uploads. supabase.com (2026-11-15).

svc:vercel-fluid - Vercel Fluid compute pricing. vercel.com (2026-11-15).

svc:vercel-bom-price - Vercel Mumbai on-demand pricing. vercel.com (2026-11-15).

svc:vercel-cron - Vercel Cron pricing and limits. vercel.com (2026-11-15).

svc:vercel-build - Vercel build pricing. vercel.com (2026-11-15).

svc:vercel-logs - Vercel runtime logs. vercel.com (2026-11-15).

svc:vercel-network - Vercel CDN pricing. vercel.com (2026-11-15).

svc:azure-b1-india-price - Azure Retail Prices API: Central India B1 Linux. prices.azure.com (2026-11-15).

svc:azure-app-network - App Service VNet integration. learn.microsoft.com (2026-11-15).

svc:azure-app-scope - App Service security and deployment scope. learn.microsoft.com (2026-11-15).

svc:do-app-regions - App Platform regional availability. docs.digitalocean.com (2026-11-15).

svc:do-app-price - App Platform container pricing. docs.digitalocean.com (2026-11-15).

svc:do-app-runtime - App Platform containers. docs.digitalocean.com (2026-11-15).

svc:do-app-build - App Platform build commands and limits. docs.digitalocean.com (2026-11-15).

svc:do-app-sla - App Platform component SLA. digitalocean.com (2026-11-15).

svc:do-spaces-price - Spaces storage pricing. docs.digitalocean.com (2026-11-15).

svc:do-spaces-regions - Spaces regional availability. docs.digitalocean.com (2026-11-15).

svc:otel-s3-export - OpenTelemetry S3 exporter. github.com (2026-11-15).


---


Appendix B. Source ledger 6

Links preserve the original source register. A record describes only its stated scope. Catalog review is not certification or empirical calibration.

svc:do-region-country - DigitalOcean datacenter geography. docs.digitalocean.com (2026-11-15).

svc:gdpr-transfers - European Commission: rules on international data transfers. commission.europa.eu (2026-11-15).

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

P08 - AWS Well-Architected Framework. docs.aws.amazon.com (2026-11-13).

P09 - AWS Services by Region. aws.amazon.com (2026-11-13).

P10 - Shared Responsibility Model. aws.amazon.com (2026-11-13).

P11 - CP-SAT Solver. developers.google.com (2026-11-13).

P12 - Z3 parameters and unsat-core setting. microsoft.github.io (2026-11-13).

P13 - Why Astro?. docs.astro.build (2026-11-13).

P14 - OpenID Connect on the Microsoft identity platform. learn.microsoft.com (2026-11-13).

P15 - Technology Radar. thoughtworks.com (2026-11-13).

tool:node - Node.js release information. nodejs.org (2026-11-13).


---


Appendix B. Source ledger 7

Links preserve the original source register. A record describes only its stated scope. Catalog review is not certification or empirical calibration.

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

tool:pillow - Pillow image conversion. pillow.readthedocs.io (2026-11-15).

tool:pypdf - pypdf documentation. pypdf.readthedocs.io (2026-11-13).

tool:poppler - Poppler utilities. poppler.freedesktop.org (2026-11-13).

tool:checkout - GitHub Actions checkout. github.com (2026-11-13).

tool:setup-node - GitHub Actions setup-node. github.com (2026-11-13).

N01 - Finding Counterfactual Explanations through Constraint Relaxations. arxiv.org (2026-11-14).

N02 - How to Evaluate Solutions in Pareto-based Search-Based Software Engineering?. arxiv.org (2026-11-14).

N03 - Why So Many Published Sensitivity Analyses Are False. arxiv.org (2026-11-14).

N04 - Maintain an architecture decision record. learn.microsoft.com (2026-11-14).
