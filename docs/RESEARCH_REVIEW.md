# Research review for StackSense

Research date: 13 November 2026 IST. This is a targeted engineering literature review, not a systematic review or reproduced experimental study. The researcher screened papers and official documentation for fit to the supplied challenge. No paper PDF is redistributed.

## Scope and evidence standard

Questions: How should a requirements-driven recommender represent knowledge, distinguish constraints/preferences, compose compatible options, explain failure, and validate answers without one gold stack? Which existing solutions offer reusable ideas? Which concrete design facts matter for the six public scenarios?

Search families: knowledge/constraint-based recommendation; software technology and architectural-pattern selection; cloud service configuration; multi-criteria decisions; conflict explanations; explainable recommendations; metamorphic testing; local-first and offline architecture. Primary sources are publisher/author/university paper copies and official product documentation. Search result summaries were used only for the explicitly marked abstract-level entries. Vendor marketing performance claims and unverified regional/pricing promises are excluded.

The 30-entry [machine-readable source register](research/sources.json) contains 15 research/method entries and 15 official technical/practitioner references. R05 is a technical-report preprint, R12 a preprint, and R13/R14 method references; the collection is not 30 peer-reviewed papers. Review depth is stated per entry. The synthesis in [plan.md](../plan.md) is a proposed StackSense design, not a result established by the cited studies.

## Research and methods

### R01 — Knowledge-based recommender systems: overview and research directions

Mathias Uta et al. · 2024 · paper review. [Primary source](https://www.frontiersin.org/journals/big-data/articles/10.3389/fdata.2024.1304439/full).

- Reviewed: Full-text relevant sections reviewed.
- Finding: Knowledge-based recommenders use explicit item, preference and domain knowledge; constraint-based approaches support complex requirements but require substantial knowledge acquisition.
- StackSense inference: Use a sourced catalog and explicit constraints; budget time for curation.
- Limit: The review does not provide a ready-made software-stack dataset or calibrated StackSense weights.

### R02 — A decision support system for software technology selection

Siamak Farshidi, Slinger Jansen, Rolf de Jong, Sjaak Brinkkemper · 2018 · paper. [Primary source](https://slingerjansen.nl/wp-content/uploads/2018/05/a-decision-support-system-for-software-technology-selection.pdf).

- Reviewed: Author-hosted full-text model/inference sections reviewed.
- Finding: The DBMS-selection DSS models alternatives/features/quality relationships and distinguishes MoSCoW hard and soft requirements.
- StackSense inference: Separate catalog facts, constraints, preferences and UI; maintain an evolving model.
- Limit: Database selection is narrower than full-stack compatibility; old product facts/prices must not be imported.

### R03 — A Decision Support System for Pattern-Driven Software Architecture

Siamak Farshidi, Slinger Jansen · 2020 · paper. [Primary source](https://link.springer.com/chapter/10.1007/978-3-030-59155-7_6).

- Reviewed: Publisher abstract and metadata reviewed.
- Finding: The tool supports architectural-pattern selection using functional and quality requirements.
- StackSense inference: Model architecture style explicitly before finalizing compatible components.
- Limit: Abstract-level review only; no reproduction of its algorithm or validation results is claimed.

### R04 — A Declarative Recommender System for Cloud Infrastructure Services Selection

Miranda Zhang, Rajiv Ranjan, Surya Nepal, Michael Menzel, Armin Haller · 2012 · paper preprint. [Primary source](https://arxiv.org/abs/1210.2047).

- Reviewed: Full-text domain/configuration model sections reviewed.
- Finding: CloudRecommender normalizes heterogeneous compute/storage/network offerings and queries configurations declaratively.
- StackSense inference: Represent deployment variants and pricing units independently of product names.
- Limit: Historical IaaS prototype; not current provider availability or an end-to-end application architect.

### R05 — CloudGenius: Automated Decision Support for Migrating Multi-Component Enterprise Applications to Clouds

Michael Menzel, Rajiv Ranjan · 2012 · technical report preprint. [Primary source](https://arxiv.org/abs/1112.3880).

- Reviewed: Full-text formal model and compatibility sections reviewed.
- Finding: CloudGenius combines multi-criteria evaluation with compatibility relationships for component/service combinations.
- StackSense inference: Search coherent complete plans and record compatibility edges.
- Limit: VM-image/cloud-migration scope and AHP input differ from this challenge; not a current service catalog.

### R06 — QUICKXPLAIN: Preferred Explanations and Relaxations for Over-Constrained Problems

Ulrich Junker · 2004 · paper. [Primary source](https://aaai.org/Papers/AAAI/2004/AAAI04-027.pdf).

- Reviewed: Publisher abstract/index reviewed; proof context cross-checked with R07.
- Finding: QuickXplain uses divide-and-conquer to explain over-constrained problems and support preference-aware relaxations.
- StackSense inference: Use a conflict-explanation layer; start with deletion-based shrinking, then consider QuickXplain.
- Limit: An inclusion-minimal conflict need not be the smallest-cardinality conflict; hard requirements are never silently relaxed.

### R07 — A formal proof and simple explanation of the QuickXplain algorithm

Patrick Rodler · 2022 · paper preprint. [Primary source](https://arxiv.org/html/2001.01835v3).

- Reviewed: Full-text monotone predicate/background assumptions reviewed.
- Finding: Explains and proves QuickXplain for finding irreducible subsets with a monotone property.
- StackSense inference: Require a sound, complete feasibility predicate before claiming minimal conflict explanations.
- Limit: Preprint title differs from journal title; timeouts and catalog gaps are not proof of real-world impossibility.

### R08 — Development of recommendation systems for software engineering: the CROSSMINER experience

Juri Di Rocco, Davide Di Ruscio, Claudio Di Sipio, Phuong T. Nguyen, Riccardo Rubei · 2021 · paper. [Primary source](https://link.springer.com/article/10.1007/s10664-021-09963-7).

- Reviewed: Full-text requirements/development/evaluation sections reviewed.
- Finding: Reports practical difficulties with baselines, available data, measures and evaluation when developing software-engineering recommenders.
- StackSense inference: Compare explicit baselines and evaluate task-specific usefulness, not just a generic recommendation score.
- Limit: Library/API recommendation is adjacent; reported success does not validate StackSense.

### R09 — Explainable Recommendation: A Survey and New Perspectives

Yongfeng Zhang, Xu Chen · 2020 · paper review. [Primary source](https://arxiv.org/abs/1804.11192).

- Reviewed: Abstract and publication metadata reviewed.
- Finding: Distinguishes explanations derived from interpretable models from post-hoc explanations.
- StackSense inference: Render recorded decision evidence and why-not alternatives.
- Limit: Broad survey, not a stack-selection algorithm; no claim of reading all 101 pages.

### R10 — A Survey on Metamorphic Testing

Sergio Segura, Gordon Fraser, Ana B. Sánchez, Antonio Ruiz-Cortés · 2016 · paper review. [Primary source](https://eprints.whiterose.ac.uk/id/eprint/110335/1/segura16-tse.pdf).

- Reviewed: Accepted-version abstract and testing-method discussion reviewed.
- Finding: Metamorphic testing checks relations between transformed inputs/outputs when exact test oracles are impractical.
- StackSense inference: Test metadata invariance, hard-constraint strengthening, ordering, and adapter parity.
- Limit: Relations need justified preconditions; a budget change need not monotonically change every component.

### R11 — Local-first software: you own your data, in spite of the cloud

Martin Kleppmann, Adam Wiggins, Peter van Hardenberg, Mark McGranaghan · 2019 · paper. [Primary source](https://www.repository.cam.ac.uk/items/525725e6-1a1d-46ce-a5a3-d0d9b1beeee1/full).

- Reviewed: University repository abstract and metadata reviewed.
- Finding: Discusses local-first principles, offline use/collaboration and CRDT-based design possibilities.
- StackSense inference: Differentiate offline persistence, sync and merge semantics in recommended architectures.
- Limit: Principles do not prove suitability for low-end Android or require CRDTs for every survey app.

### R12 — Empirical Evaluation of AI-Assisted Software Package Selection: A Knowledge Graph Approach

Siamak Farshidi et al. · 2025 · paper preprint. [Primary source](https://arxiv.org/html/2508.05693v1).

- Reviewed: Full-text PySelect architecture/data pipelines and threats reviewed.
- Finding: PySelect combines package/quality evidence in a decision model and uses AI-assisted intent/data processing.
- StackSense inference: Borrow provenance and feature/quality separation; future offline data-enrichment work may be useful.
- Limit: Preprint, Python-package scope, and AI-assisted parts differ from allowed StackSense runtime uses. Do not copy its AI selection/data pipeline as compliant engine logic.

### R13 — ATAM: Method for Architecture Evaluation

Rick Kazman, Mark H. Klein, Paul C. Clements · 2000 · method report. [Primary source](https://www.sei.cmu.edu/library/atam-method-for-architecture-evaluation/).

- Reviewed: Official report overview reviewed.
- Finding: ATAM analyzes architectural choices against quality attributes and trade-offs.
- StackSense inference: Convert abstract quality goals into scenario-specific stimuli, environment, response and risks.
- Limit: StackSense uses a lightweight adaptation, not a completed formal ATAM assessment.

### R14 — Cost Benefit Analysis Method (CBAM)

Carnegie Mellon Software Engineering Institute · 2018 · method reference. [Primary source](https://www.sei.cmu.edu/library/cost-benefit-analysis-method-cbam/).

- Reviewed: Official method overview reviewed.
- Finding: CBAM connects architectural options to economic benefits, resource limits, schedule and uncertainty.
- StackSense inference: Keep cost assumptions and sensitivity separate from quality scores; discuss lifecycle burden.
- Limit: Not a cloud pricing model; use current provider facts for actual estimates.

### R15 — SDMF: Systematic Decision-making Framework for Evaluation of Software Architecture

Nitin Upadhyay · 2016 · paper. [Primary source](https://www.sciencedirect.com/science/article/pii/S1877050916313448).

- Reviewed: Publisher abstract indexed; direct full-text access blocked.
- Finding: Proposes architecture evaluation incorporating organisational/design factors with TOPSIS.
- StackSense inference: Consider TOPSIS as a comparison method; choose simpler fixed-rubric weighted scoring for MVP.
- Limit: Abstract-only review; no full-text replication or superiority claim.

## Official implementation and architecture sources

| ID | Source | Verified scope and intended use | Limit |
|---|---|---|---|
| P01 | [Build an offline-first app](https://developer.android.com/topic/architecture/data-layer/offline-first) | Describes local/network sources and offline data-layer responsibilities. Require local persistence, write queues/retry and conflict policy for offline survey recommendations. | Native examples do not establish equivalent third-party mobile-library behavior. |
| P02 | [Yjs introduction](https://docs.yjs.dev/) | Yjs supplies shared CRDT data structures with network providers decoupled. Separate collaboration consistency from WebSocket transport, auth and persistence. | Do not adopt marketing scalability claims or infer a 100 ms SLA. |
| P03 | [Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) | RLS can restrict rows, with important owner/superuser/BYPASSRLS behavior. Treat tenant isolation as a configured control with bypass tests. | A tenant_id column or RLS capability flag alone is not tenant-security evidence. |
| P04 | [Full Text Search](https://www.postgresql.org/docs/current/textsearch.html) | PostgreSQL documents built-in full-text search facilities. Evaluate database-native search before adding dedicated search infrastructure. | Search UX, language/ranking needs and load still determine suitability. |
| P05 | [Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html) | Transactions group changes into atomic operations with committed durability behavior. Evaluate transactional ledger capability before performance/popularity preference. | A database cannot supply correct double-entry business invariants by product choice alone. |
| P06 | [Choose an Azure compute service](https://learn.microsoft.com/en-us/azure/architecture/guide/technology-choices/compute-decision-tree) | Provides a structured decision aid for Azure compute selection. Use decision-tree-style elicitation and deployment filters inside a provider domain. | Provider-specific; not a cross-cloud optimizer or legal compliance guarantee. |
| P07 | [Microservices architecture style](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices) | Documents distributed-system complexity, testing and consistency trade-offs. Penalize unjustified operational complexity for small teams. | Microservices are not universally wrong; independent deployment/ownership needs may justify them. |
| P08 | [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html) | Provides guidance for examining architecture decisions and operating trade-offs. Use as a review checklist for security/reliability/operations/cost concerns. | Review framework, not automatic stack-selection logic or measured workload proof. |
| P09 | [AWS Services by Region](https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services/) | Service availability is represented by region rather than provider name alone. Require dated per-service/per-region checks before promoting deployment variants. | No individual Mumbai/Hyderabad service or backup/data-flow claim has been established by this index alone. |
| P10 | [Shared Responsibility Model](https://aws.amazon.com/compliance/shared-responsibility-model/) | Cloud security responsibilities are divided between provider and customer. Represent controls, customer responsibilities and unknown gaps separately. | Does not establish satisfaction of any particular supplied legal obligation. |
| P11 | [CP-SAT Solver](https://developers.google.com/optimization/cp/cp_solver) | CP-SAT works with integer constraints and distinguishes feasible/optimal/infeasible/unknown states. Keep solver outcome separate from catalog infeasibility; consider a solver only after search profiling. | An optimization tool does not provide domain facts or explanations automatically. |
| P12 | [Z3 parameters and unsat-core setting](https://microsoft.github.io/z3guide/programming/Parameters/) | Z3 exposes unsat-core generation with solver-dependent support. Potential later backend for logical compatibility and conflict extraction. | Bindings/packaging and explanations require work; not needed for initial TypeScript finite search. |
| P13 | [Why Astro?](https://docs.astro.build/en/concepts/why-astro/) | Astro targets content-oriented sites and supports selective interactivity. Research as one static/content option for portfolio-style requirements. | No unverified speed percentages, free-tier price or compulsory P1 answer inferred. |
| P14 | [OpenID Connect on the Microsoft identity platform](https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc) | Documents OIDC authentication and single-sign-on integration. Research reuse of existing Entra identity through supported protocols. | Region, licensing and hybrid integration must be checked separately. |
| P15 | [Technology Radar](https://www.thoughtworks.com/radar) | Organises practitioner technology assessments. Use as a discovery/maturity signal and source lead. | Assessment rings do not encode a given project budget, residency or compatible full stack. |

## Existing solution comparison

| Solution | Demonstrated scope | Reuse the idea | Do not assume |
|---|---|---|---|
| Farshidi DBMS-selection DSS (R02) | Technology feature/quality model and hard/soft preferences | Separate evidence, features and preference evaluation | It selects frontend, mobile and hosting together |
| Pattern-driven DSS (R03) | Architectural-pattern decision support | Evaluate architecture style as a decision | A pattern automatically determines product choices |
| CloudRecommender (R04) | Declarative cloud infrastructure configurations | Normalize offerings/units and query eligible variants | Its old provider catalog is current |
| CloudGenius / CumulusGenius (R05) | Multi-component cloud migration and dependencies | Whole-plan compatibility | AHP is required for this challenge |
| CROSSMINER (R08) | Developer/library/API recommendation experience | Context capture, baseline selection, practical evaluation | Repository popularity implies architectural fit |
| PySelect (R12) | Python package decision model/knowledge graph | Provenance and feature/quality separation | Its generative pipelines fit the challenge's runtime LLM policy |
| Azure compute decision tree (P06) | Provider-specific guided service choice | Branch questions on deployment and operating needs | It is a cross-provider recommender |
| Technology Radar (P15) | Practitioner assessments | Discover research candidates and risks | An assessment ring satisfies a project constraint |

No hosted prototype was executed and no published metric is reproduced. StackShare was screened as an adjacent discovery resource, but its page could not be retrieved; it is not used as evidence for capability or selection claims.

## Research gaps still open

- No supplied labels justify training or validating a learned “best stack” predictor.
- Current provider plans, region-specific services, prices, auth/SMS/payment data flows, support/EOL details and licenses still need entry-level verification before a selectable catalog exists.
- No study validates the proposed StackSense fit weights, thresholds, time estimates or scenario winners.
- No claim of regulatory compliance follows from this literature review. Actual legal obligations need authoritative jurisdiction-specific research; here compliance labels are supplied requirements that need technical evidence and visible gaps.
- Papers inform design; actual quality must come from implemented rules, meaningful scenario variations, review, and measured execution.
