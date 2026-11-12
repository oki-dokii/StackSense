# Initial rule and decision tables

Proposed general rules for implementation and owner review. These are architectural conditions, not a table of scenario IDs or mandatory brands. Quantitative capacity/price thresholds require source-backed deployment data before use.

## Hard eligibility rules

| Rule | Condition | Action / evidence |
|---|---|---|
| H01 | Catalog entry retired/EOL | Exclude; record source/version; warn if existing system |
| H02 | Deployment is air_gapped | Exclude runtime external SaaS/CDN/API dependencies; retain self-hostable local choices |
| H03 | Deployment is on_premise | Require self-hostable and compatible integration/dependencies |
| H04 | Explicit cloud aws/gcp/azure | Exclude incompatible hosting/region-bound managed variants |
| H05 | Residency specified | Require data-path locations including backups/storage/auth/ML as applicable |
| H06 | Compliance specified | Require documented deployment controls and visible remaining responsibilities |
| H07 | Platforms specified | Complete plan must cover all requested targets |
| H08 | Required capability unsupported | Exclude complete plan or offer explicitly reduced scope with warning; no false coverage |
| H09 | cloud none + managed cloud | Surface interpretation conflict; do not treat none as any |

## Capability and simplicity rules

| Rule | Signals | Required architectural response |
|---|---|---|
| F01 | Content, read-heavy, no dynamic features | Evaluate static generation/CDN and None backend/database |
| F02 | SEO critical | Prefer crawlable public rendering; justify client-only rendering if selected |
| F03 | api_only sole target | Consider None frontend; preserve API documentation needs |
| F04 | Realtime | Check long-lived connections, fan-out, state/sync and load assumptions |
| F05 | Collaborative editing explicitly described or structured | Explain ordering/conflict strategy; websocket transport alone is insufficient |
| F06 | Offline | Local durable writes, synchronization, retry/idempotency and conflict policy |
| F07 | Uploads/media | Object/local storage + access control; account for egress and offline uploads |
| F08 | Full-text search | Evaluate native database search before a separate cluster |
| F09 | Payments | Provider integration + webhook/idempotency design; state fees assumptions |
| F10 | Phone OTP | Supported delivery/region; OTP volume/cost caveat |
| F11 | Enterprise SSO + existing identity | Reuse compatible OIDC/SAML/enterprise identity instead of separate passwords |
| F12 | Multi-tenant | Tenant authorization/isolation, not merely a tenant_id column claim |
| F13 | Financial transactional requirements | Evaluate strong transaction/ledger consistency and audit design |
| F14 | ML inference/RAG/training | Choose suitable capability and usage model; avoid unconditional GPU/vector service |
| F15 | Tiny team/no DevOps/short MVP | Penalize operational burden; justify complex infrastructure explicitly |
| F16 | High traffic on static content | Model delivery/bandwidth; do not infer microservices from user count |

## Conflicts and warnings

| Rule | Trigger | Response |
|---|---|---|
| W01 | Estimated min > budget | BUDGET_EXCEEDED; explicit trade-off/reduced scope or infeasible |
| W02 | Estimated max > budget ≥ min | BUDGET_RANGE_RISK; usage assumptions |
| W03 | Low operational capability + demanding topology | OPERATIONS_SKILL_GAP with affected team/availability fields |
| W04 | Tight timeline + many platforms/features | TIMELINE_RISK; explain delivery burden, no silent feature removal |
| W05 | Latency/traffic/SLA cannot be established from supplied data | CAPACITY_UNCERTAIN; state measurement/topology assumptions |
| W06 | Existing EOL system | EXISTING_TECH_EOL plus integration/migration advice |
| W07 | Unknown field or unsupported extension | UNKNOWN_INPUT; preserve data, do not silently use it |
| W08 | Evidence is stale/unknown for decisive hard constraint | Exclude uncertain variant; explain source gap |

All triggered rules need field-path evidence. A deterministic description parser may derive architectural hints such as ledger consistency, collaboration, device limits or network quality; show the interpreted phrase and assumption in review/output. Structured values override hints; contradictions warn. Never infer hard constraints from prose or trigger rules by project name. For example, a described double-entry ledger can inform transaction consistency through `project.description`, independent of the scenario ID.

## Tie and status decision order

Validate → hard feasibility → mandatory coverage → complete-plan fit score → lower max cost → stable component IDs. Invalid input takes precedence over conflict evaluation. No feasible plan proven means infeasible; interrupted/bounded-out search is internal failure. Warnings and assumptions are part of the result, not hidden logs.
