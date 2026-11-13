# Executable core catalog

Data: [catalog.json](../packages/catalog/data/catalog.json). Structure: [catalog schema](../schemas/catalog.schema.json). Validation/loading: [catalog module](../packages/catalog/src/index.ts). Phase evidence: [Phase 2](PHASE_2.md).

## Review scope

The catalog records 33 product/profile entries and 40 official documentation sources checked on 13 November 2026. Sources establish product-family, deployment or integration facts within their `scope`; they do not establish workload prices, performance guarantees or legal compliance. The separate literature register remains in `docs/research/sources.json`.

Entry status `active` means the reviewed product family is selectable within this dated catalog. It is not a guarantee that all historical releases remain supported. The final deployment still needs exact supported versions, driver compatibility, licenses and EOL review. `None` entries encode intentional layer omission rather than a maintained product.

## Coverage

- Frontend: API-only None; HTML/CSS, Astro, Next.js, React/Vite, Vue, SvelteKit, Angular, React Native, Next.js+React Native, Flutter, Jetpack Compose. Static/client/server variants are deliberately limited to the configurations modeled.
- Backend: None, Fastify, Django, FastAPI, Spring Boot, ASP.NET Core, Go HTTP, Laravel.
- Database: None, PostgreSQL, MySQL, MariaDB, SQLite, SQL Server, MongoDB Community.
- Hosting: Cloudflare Pages; ECS/Fargate; Azure App Service; Cloud Run; EC2 VM; local VM/NGINX.

These counts do not claim the final FAQ breadth target is complete. DB driver compatibility is an explicit whitelist, not “all frameworks support every database.” Managed database products are separate references: e.g. Cloud SQL, RDS, Azure PostgreSQL or SQL Managed Instance. Self-hosted variants require an appropriate persistent volume. Primary-region mappings exist only where individually reviewed; absent evidence does not pass a residency predicate.

## Facts vs judgment

`source_ids`, supported platform/runtime/deployment fields, managed products and region records are factual catalog claims with source scope. `complexity`, `operations` and `cost_class` are **authored ordinal heuristics** for comparing engineering burden. They are not provider prices or cited benchmark scores. Scale 0 means no independently operated resource for that entry where relevant; it does not promise zero billing. Exact rubrics/formulas live in [scoring.ts](../packages/engine/src/scoring.ts) and must be reviewed by the participant.

Sources are linked, not scraped into runtime requests. All catalog loading is local. Additions must have unique IDs, source references and compatible database edges; semantic checks run before planning. Corrupt catalog data is an internal error, not invalid user input. Test retired/unknown status and boundary/counterexample behavior for any new entry.

## Updating evidence

1. Locate the specific official product/deployment/region/driver source.
2. Record a source ID, HTTPS URL, checked date and narrow scope.
3. Add/revise a product or deployment profile with matching references.
4. Mark unknown facts as absent; do not promote assumptions into hard eligibility.
5. Add positive, negative and changed-input tests.
6. Bump catalog/rules versions when selections can change and rerun the documented corpus.

Compliance controls, backing services, detailed prices and full data-flow locations remain Phase 3 work. Do not repurpose the primary-region fields as whole-application residency certification.
