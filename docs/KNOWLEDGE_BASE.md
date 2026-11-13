# Knowledge base and research specification

Implemented core subset: [catalog and evidence scope](CATALOG.md). Control/pricing/lifecycle detail below remains the target model for later phases; do not infer all attributes are already implemented.

## Data model

Store products separately from deployment variants. One framework may run on multiple hosts; one managed provider may have different regional features and prices. Required entry attributes:

| Field | Purpose |
|---|---|
| `id`, `name`, `category` | Stable machine identity, real product, supported layers |
| `status`, `version_scope` | Maintained/EOL/unknown; applicable release/version |
| `languages`, `platforms`, `capabilities` | Team fit and functional coverage |
| `deployment_variants` | Self-hosted/managed, provider, region, runtime, network dependencies |
| `operational_burden`, `complexity` | Defined ordinal scales with cited rationale |
| `workload_fit`, `limitations` | Architectural suitability and caveats |
| `compatibility` | Required/excluded runtimes, protocols, services |
| `security_controls`, `compliance_evidence` | Supported controls and deployment-dependent evidence |
| `pricing_model_id` | Versioned assumptions, units, tiers, bounds |
| `source_ids`, `reviewed_on`, `review_due` | Auditable facts and freshness |

Facts must cite source IDs at field or rule level. A blanket documentation link is inadequate for a precise region or pricing claim. Mark unknown rather than inventing capabilities.

## Research protocol

1. Identify a decision-driving fact (e.g., service availability in an India region).
2. Prefer official product, region, support/EOL, security, and pricing documentation.
3. Record exact URL, title, access/review date, affected attributes, and short paraphrase.
4. Distinguish facts, assumptions, and derived judgments.
5. Verify deployment-specific feature availability and limits.
6. Add a fit/compatibility rule with an example and counterexample.
7. Record pricing units and workload assumptions; avoid uncited “free forever” claims.
8. Recheck EOL and material pricing/region facts before submission.

## Coverage backlog (candidates to investigate, not approved recommendations)

| Layer | Candidate families |
|---|---|
| Frontend | Static HTML/CSS, Astro, React/Vite, Next.js, Vue/Nuxt, Angular, SvelteKit, React Native, Flutter, native Android |
| Backend | None, Node.js/Fastify, NestJS, Django, FastAPI, Spring Boot, ASP.NET Core, Go HTTP framework, Laravel, serverless functions |
| Database | None, PostgreSQL, MySQL, MariaDB, SQLite, SQL Server, MongoDB, DynamoDB; evaluate specialized stores only with a use case |
| Hosting | Static hosts/CDN, AWS regional services, Azure regional services, GCP regional services, compatible managed app hosts, self-hosted VM, on-premise container/VM |
| Supporting | Redis-compatible cache, queue options, database text search/dedicated search, OIDC/SSO, OTP, object storage, payment providers, realtime protocols/sync libraries, ML serving, CI/CD, local observability |

Aim for the FAQ's 6–8 realistic choices per core layer with meaningful diversity, not entries added only to inflate counts. Confirm maintenance and suitability before promotion. Do not assume all candidates currently meet every region or compliance constraint.

## Required coverage

Static/no backend; typical web/API; web+mobile; realtime collaboration; transactional financial ledger; existing Microsoft integration; offline Android; on-premise/air-gapped; zero budget; no-DevOps small team. Supporting capability coverage matters more than brand count.

## Catalog gates

Unique IDs; valid references; no retired selectable entries; no negative prices; source-backed region claims; deterministic ordering; compatibility tests; all selected records reviewed. EOL existing systems trigger warnings and integration/migration notes. Research is incomplete until the owner reviews evidence and signs off the entries.
