# Field-level input design

This matrix connects collected inputs to architectural decisions. Validation is authoritative in the input schema and SRS. Listed uses are implementation requirements, not implemented rules. All standard inputs must be accepted even if their value does not change a particular scenario's winner.

| Field | Validation/default | Architectural use |
|---|---|---|
| project.name | Optional string, empty if absent | Display/export metadata only; never selection |
| project.type | Required standard enum | Workload archetype and feature interpretation; never a complete stack lookup |
| project.description | Optional string, empty if absent | Context and transparent deterministic hints; structured values take precedence; no inferred hard restrictions |
| project.platforms | Required nonempty enum array | Frontend target coverage; api_only may justify no frontend |
| scale.users_at_launch | Required integer ≥0 | Launch footprint; distinguish users from requests |
| scale.users_12_months | Required integer ≥0 | Growth horizon and capacity/cost assumptions |
| scale.peak_concurrent_users | Optional integer ≥0; unknown if absent | Connections, runtime concurrency, realtime topology |
| scale.traffic_pattern | steady/spiky/seasonal; steady | Elasticity, headroom, free-tier/burst risks |
| scale.workload | read_heavy/balanced/write_heavy; balanced | Static caching vs transactional/write paths |
| scale.data_volume_gb_12_months | Optional number ≥0; unknown if absent | Database/object storage, backup costs |
| team.size | Required integer ≥1 | Architecture complexity and operational capacity |
| team.experience | Required enum | Learning/maintenance risk, realistic implementation complexity |
| team.languages | Required lowercase string list; may be empty | Framework familiarity; unknown skills explicitly flagged |
| team.has_devops | Boolean; false | Managed vs self-operated burden and deployment risk |
| budget.monthly_infra_usd | Required number ≥0 | Affordability fit, cost-boundary warnings |
| timeline.mvp_weeks | Required integer ≥1 | Delivery feasibility and feature/service reuse |
| infrastructure.cloud_preference | any/aws/gcp/azure/none; any | Hard provider filtering; none interpretation in brief |
| infrastructure.deployment_model | Standard enum; managed_cloud | Managed/self-hosted/on-prem/air-gap eligibility |
| infrastructure.data_residency | Standard enum; none | Region/data-flow restrictions across services and backups |
| infrastructure.existing_systems | String array; [] | Reuse/integration, identity protocols, licenses, EOL warnings |
| requirements.realtime | Boolean; false | Live connection strategy, collaboration state consistency |
| requirements.offline_support | Boolean; false | Local persistence, durable queue, sync/conflict resolution |
| requirements.full_text_search | Boolean; false | Database search vs dedicated index based on need |
| requirements.file_media_storage | Boolean; false | Storage, upload policy, egress, local/offline media handling |
| requirements.payments | Boolean; false | Provider integration, webhooks/idempotency, usage costs |
| requirements.auth | Standard enum; none | Auth capability/method, SSO integration, OTP costs |
| requirements.multi_tenant | Boolean; false | Tenant boundary/isolation and authorization architecture |
| requirements.ml_features | none/inference_api/llm_rag/training; none | Serving/training needs; vector retrieval only where justified |
| requirements.seo_critical | Boolean; false | Prerendering/SSR/static public content strategy |
| requirements.availability | String enum; "99.9" | Availability topology/operating assumptions; not a vendor-name guarantee |
| requirements.p95_latency_ms | Integer >0 or null; unknown if absent | Geographic/network/runtime considerations; uncertainty warnings |
| compliance | Standard enum array; [] | Control and regional evidence, supported deployment configurations |
| priorities.cost | Integer 1–5; 3 | Relative weight of affordability |
| priorities.time_to_market | Integer 1–5; 3 | Relative weight of delivery speed |
| priorities.scalability | Integer 1–5; 3 | Relative weight of growth capacity |
| priorities.performance | Integer 1–5; 3 | Relative weight of workload/latency suitability |
| priorities.maintainability | Integer 1–5; 3 | Relative weight of team fit and operations simplicity |
| priorities.security | Integer 1–5; 3 | Relative weight among compliant options; cannot override hard controls |

## Extra fields, optional and research-gated

| Extension | Why useful | Required demonstration before inclusion in final UI |
|---|---|---|
| expected_requests_per_second | Users do not define compute demand | Same user count/different RPS changes cost or topology |
| primary_user_region | Residency and user proximity are different | Different user region affects latency reasoning without violating residency |
| monthly_egress_gb | Media/network fees can dominate | Bandwidth threshold changes estimate/warning |
| monthly_otp_count | Authentication usage has per-message costs | OTP quantity changes auth cost band |
| retention_months | History/backups affect storage | Retention changes capacity/cost assumptions |
| vendor_lock_in_tolerance | Managed speed vs portability trade-off | Low tolerance changes fit among eligible deployments |

Do not make extras mandatory, invent their values silently, or collect them without implementing/justifying their effect. The final report's input research section should cite actual sources and examples for these connections.
