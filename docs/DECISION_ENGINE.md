# Decision engine specification

## Principle

Selection must be deterministic, input-sensitive, explainable, and compatible across the whole plan. An independent score per layer is insufficient if the selected components cannot be deployed together.

## Ordered stages

### 1. Validate and normalize

Use the input schema with type coercion disabled. Collect all errors. Apply only documented optional defaults to a copy; retain raw values. Produce an assumption for every applied default. Sort unordered set-like lists for canonical processing; preserve free-text content. Project names/IDs do not influence choices. Description may supply deterministic, bounded architectural hints (for example a ledger, collaborative editing, constrained device memory, or unreliable connectivity). Record each interpreted hint and its originating phrase in assumptions and use `project.description` as a driver; expose it in review. Structured values take precedence. Do not infer or override hard compliance/residency/provider restrictions from prose. Treat prose as data, never executable instructions. The parser uses general patterns, not scenario IDs/names or entire public-description lookup strings.

### 2. Derive features

Examples: static-content suitability, interactive-client need, transactional consistency, long-lived realtime connections, offline local storage/sync, operating burden tolerance, platform coverage, enterprise integration, security controls. Every feature stores originating field paths and a deterministic rule ID. No vague “fintech implies microservices” shortcut.

### 3. Hard-filter deployment variants

Evaluate technology plus deployment variant, not product name alone. Exclude retired entries, unsupported platforms/features, prohibited SaaS dependencies, disallowed providers/regions, and unsupported compliance control configurations. Unknown critical eligibility evidence cannot count as satisfied. Return rejection evidence for explanations. A cloud preference applies to hosting and region-bound managed services; third-party payments/auth need explicit compatibility reasoning.

Compliance labels require supported controls and documented responsibilities. A vendor certification is evidence for a subset of controls, not proof the application is compliant. Missing decisive evidence is surfaced and can prevent recommending that deployment.

### 4. Score remaining candidates

Proposed integer feature scale per criterion: 0 incompatible/very poor, 1 poor, 2 limited, 3 adequate, 4 good, 5 strong. Values must come from rules grounded in catalog data, not arbitrary brand preference.

```text
weighted_score(candidate) = Σ priority[k] × fit(candidate, k)
k ∈ {cost, time_to_market, scalability, performance, maintainability, security}
```

Document fit rules for each layer: e.g., maintainability includes team-language familiarity and operational burden; time-to-market includes ecosystem feature readiness and timeline; performance considers workload, latency target, and deployment characteristics. Do not double-count the same fact without explaining it. Scores are ordinal ranking aids, not measured throughput or probabilities.

### 5. Select a feasible plan

Use deterministic bounded backtracking over compatible candidates. Order by score descending then stable catalog ID ascending. Check frontend targets/backend protocols, database connectivity, hosting runtimes/regions, long-lived connection support, auth/storage/search availability, and operating constraints. Attach supporting services from capability rules, then re-evaluate cost/compatibility and rank complete plans. Shared managed products may satisfy several capabilities but must not be charged twice.

Catalog sets should remain small enough to enumerate with pruning. A search bound is a safeguard, not evidence of infeasibility: if exhausted before proof, surface internal planning failure and its limit, not `infeasible`. Record catalog sizes and explored plan counts in debug evidence.

Plan rank: mandatory-capability coverage first; among complete hard-compatible plans, weighted score plus documented compatibility/operational adjustments; then lower estimated max cost; then lexicographic tuple of component/deployment IDs. Avoid random selection, unstable object iteration, or runtime provider calls.

### 6. Costs and conflicts

Estimate complete plan including relevant service costs. If min exceeds budget, warn `BUDGET_EXCEEDED`; if only max exceeds, warn `BUDGET_RANGE_RISK`. Zero budget is not automatic infeasibility: a genuinely static/free-tier plan may fit with limits. Large unknown costs are explicit assumptions and risks. High availability, low latency, and huge user counts are targets needing topology and usage assumptions, not guaranteed by product choice.

### 7. Explanations from evidence

Each component contains selected choice; scenario-specific justification; valid `driven_by` paths; at least one realistic rejected alternative and reason; honest trade-offs. Pick alternatives from comparable candidates, including excluded ones when exclusion is informative. Never fabricate an alternative score. `None` must explain which requirement is absent and compare to an unnecessary real component.

Supporting-service rules include: realtime → connection/sync design; offline → local persistence + retry/conflict policy; search → text-search capability; uploads → object/local storage; payments → provider integration; auth → matching method; ML → inference/RAG/training requirements. CI/CD, backups, observability and controls follow deployment/availability needs. Basic database full-text may cover search without a separate search cluster.

## Determinism boundary

Guarantee identical canonical result for identical input (including the same default provenance) and fixed engine/catalog/rules versions. Explicitly supplied defaults and omitted fields can share a stack while having different assumption records. Sort warnings by severity/code/fields; assumptions by generation order defined in rules; ties by IDs. Exclude run timestamps, request IDs, and measured durations from canonical JSON. UI display timestamps are transient. Metadata ID changes may alter output ID, never stack. LLM-off parity is inherent in MVP because no LLM exists.

## Validation examples

- Increase static-site traffic: consider CDN/bandwidth, not automatic microservices.
- Change team language: backend rank may change; residency must not.
- Switch managed cloud to air-gapped: remove external dependencies or explain infeasibility.
- Add offline support: require local persistence and sync, not merely a cache.
- Tighten budget: surface trade-offs; never relocate prohibited data to get a cheaper price.

Exact thresholds and fit tables remain research/implementation tasks. Do not present these proposed weights as empirically validated.
