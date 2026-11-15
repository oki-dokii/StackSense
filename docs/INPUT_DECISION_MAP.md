# How inputs drive decisions

One-page review map. Standard names are unchanged from the brief. Every selected component includes `driven_by`; missing optional defaults and authored cost assumptions remain visible. These are implementation rules, not measured performance claims.

| Input | Actual decision or check | Evidence / verification |
|---|---|---|
| `project.type`, `description` | Bounded persistence/static, ledger and collaboration hints; name/ID never select a product | Feature rules, name-change tests; text hints disclosed |
| `project.platforms` | Covers every client target; API-only omits UI; offline client eligibility | Catalog platform/runtime edges |
| `scale.users_at_launch`, `users_12_months` | Growth fit; month-12 population, storage/MAU/activity assumptions | Supplied population is not automatically daily-active |
| `peak_concurrent_users`, `traffic_pattern`, `workload` | Replica/concurrency floors and embedded-write review; duty scenario | Authored capacity hypotheses, never throughput guarantees |
| `data_volume_gb_12_months` | Database/file/backup quantities, tier storage overages | Provider allowances counted once; distribution uncertain |
| `team.languages`, `experience` | Prefer a supported server language; deeper supported ecosystem familiarity improves delivery/maintenance | Java+Kotlin senior Spring test, Go candidate witness |
| `team.size`, `has_devops` | Operational burden, delivery risk and paid deploying seats | No automatic Kubernetes; operating labor excluded |
| `budget.monthly_infra_usd` | Within known-language tier, prefer a complete upper-bound fit; otherwise warn | No clipping, dropped features or automatic scope changes |
| `timeline.mvp_weeks` | Delivery/complexity fit and timeline warning | Not a fabricated effort estimate |
| `cloud_preference`, `deployment_model` | Strict provider/runtime/deployment eligibility; air-gap blocks public SaaS | Explicit preferences cannot be traded for cheap hosting |
| `data_residency`, `compliance` | Reviewed primary mappings; contradictory rules block; unverified external boundaries critical | HIPAA-ineligible cheap tiers excluded; BAA/controls not certified |
| `existing_systems` | SQL Server eligibility/reuse preference; direct Entra federation; lifecycle notices | Existing geography, license, spare capacity and private path unverified |
| `seo_critical`, `auth`, `multi_tenant` | Crawlable web variant, actual identity/delivery and reviewed tenant isolation | Native SMS hook is custom work; no TOTP=SMS assumption |
| `realtime`, `offline_support`, `full_text_search` | Shared transport/state, device persistence + retry/outbox, native search | Vercel does not host persistent Yjs; offline is more than caching |
| `file_media_storage`, `payments`, `ml_features` | Storage/upload/backup, checkout + webhook/outbox, bounded inference; reject unsupported training | Lending/KYC/disbursal and GPU/RAG remain separate scope |
| `availability`, `p95_latency_ms` | Resilience/capacity qualification and explicit load-test tasks | Provider tier is not an SLA or 100-ms benchmark |
| Six `priorities.*` | Weight 0–5 fit rubrics after language/budget tiers | Stable cost/operations/unused-target/ID ties |
| Usage extensions | Explicit RPS, egress, retention, SMS/payment volume change corresponding line items | Activity fees additional to headline infrastructure |
| `daily_active_user_fraction` | If RPS absent: default authored 0.2 × population, floored at supplied peak; 50 requests/active user/day | Range 0–1; explicit RPS overrides; neither default is measured |
| Unsupported/unknown extensions | Preserve and warn without interpreting | No silent influence on stack choice |

Executable witnesses: `tests/architecture-fit.test.ts`, `tests/stress.test.ts`, `evaluation/sensitivity.json`. Sixty authored briefs run twice and through CLI `--no-llm`; this verifies invariants and locality, not organiser hidden accuracy.
