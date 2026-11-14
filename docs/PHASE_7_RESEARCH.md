# Research and feature selection: Decision Lab

14 November 2026 IST. Targeted follow-up to [the remaining backlog](IMPROVEMENT_BACKLOG.md), not a systematic literature review or a promise of a competition result. The feature ranking below is an engineering judgment about demonstrability, decision usefulness and implementation risk. No organiser hidden results, independent architecture-review scores or superiority over every competing tool are available.

## What the remaining evidence actually permits

- **Entra:** Microsoft's [tenant residency documentation](https://learn.microsoft.com/en-us/entra/fundamentals/data-residency) distinguishes identity geography and component exceptions from application hosting and external-tenant options. We still cannot establish the supplied P5 tenant's India-only boundary. A different Azure app region is not a resolution.
- **Phone delivery:** [MSG91's privacy policy](https://msg91.com/privacy-policy) names multiple hosting geographies and delivery partners. It is useful review material, not a tenant- and route-specific India-only guarantee. Current routing, processing, logs, backups and support scope remain needed.
- **Payments:** [Razorpay's trust portal](https://razorpay.com/security/certifications/) provides a localization assessment link, which is stronger evidence than a company address. The linked [publicly hosted excerpt](https://qasecurityexternal.kinsta.cloud/wp-content/uploads/2024/02/2023_Oct_RSPL_RBI_NPCI_DL.pdf) is dated October 2023, concerns assessment-time payment-system storage and refers to detailed sections outside its six-page excerpt. It does not establish a current merchant/product/network configuration or every external flow. The document is linked, not redistributed; no approval rule is added from it.
- **Costs and quality:** exact compute-meter evidence is not a load test or a full regional quote. Independent sizing and architecture review still need actual artifacts and a reviewer. Those cannot be created by renaming an authored estimate a benchmark.

## Methods that fit this product

| Primary research / guidance | Reviewed depth | Design inference and limit |
|---|---|---|
| Gupta, Genç, O'Sullivan, [Finding Counterfactual Explanations through Constraint Relaxations](https://arxiv.org/html/2204.03429v1), 2022 workshop paper | Relevant HTML introduction/method context | Show explicit changed-input experiments. Our small exhaustive single/pair experiment set is not their algorithm, a minimal unsatisfiable subset, or a global minimal repair |
| Li, Chen, Yao, [Pareto-based SBSE evaluation guidance](https://arxiv.org/html/2002.09040v4), accepted TSE paper | Objective/dominance definitions and evaluation-context sections | Declare objective directions, candidate population and preference context. Our finite-catalog front is a model result, not empirically optimal software |
| Saltelli et al., [Sensitivity-analysis practices](https://arxiv.org/abs/1711.11359), 2017 preprint | Abstract/metadata | One-at-a-time sweeps miss interactions. Report tested settings and ties; never turn retained-winner frequency into a probability or global robustness claim |
| [Microsoft ADR guidance](https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record), 2026 | Relevant full page | Export context, alternatives, consequences, evidence and Proposed status. Acceptance must remain a human decision |
| [AWS ADR guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/introduction.html) | Introduction/process summaries | A portable decision record makes the recommendation useful after the demo; no evidence of improved StackSense outcomes is claimed |
| [Thoughtworks fitness functions](https://www.thoughtworks.com/insights/decoder/f/fitness-functions) | Practitioner definition | Future evidence should test measurable architecture properties and regressions; a generic score is not such a measurement |
| [Grafana k6 thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/) | Threshold mechanics | A future workload-calibration harness should fail on explicit measured criteria. No k6 or selected-stack deployment benchmark was executed in this phase |

A machine-readable register with review depth is in [phase7 sources](research/phase7/sources.json). Papers supply design ideas; their experiments were not reproduced and implementation code was not copied.

## Prioritized differentiators

| Feature | Why it is useful in a demonstration | Delivery choice |
|---|---|---|
| Priority stability plus visible equal-score alternatives | Answer “does a small preference change change the answer?” and expose ties honestly | **Built:** 25 actual runs including baseline, one priority at a time; no probabilistic confidence |
| Full finite-catalog tradeoff front | Inspect all completed plans rather than only three nearly identical top results | **Built:** cost upper bound/operated units/original weighted score; accessible chart and plan selector; no world-optimality claim |
| Constraint-preserving functional experiments | Demonstrate independent blockers and why one change is insufficient | **Built:** at most two eligible functional edits on copies; no changes to compliance, infrastructure, isolation, availability, budget/team/timeline; no automatic Apply button |
| Proposed ADR and evidence passport | Give judges/users an auditable artifact they can inspect and reuse | **Built:** Markdown + JSON with original result, input digest, versions, scoped references, alternatives and limits; no stakeholder acceptance |
| Measurement-backed capacity recipes | Address the largest credibility gap in sizing and costs | **Next:** one runnable reference workload, pinned environment, load profile, raw results and threshold failure demonstration; results scoped only to that recipe |
| Evidence change/freshness review | Detect stale or changed tariffs, versions and regional scope without silently trusting scraped text | **Next:** reviewed diffs and explicit human validation, with dated source snapshots; network refresh never changes selection rules automatically |
| Broader version/driver and existing-system reuse model | Make brownfield choices operationally concrete | Later: reviewed licenses/network/capacity and incremental quotes; no invented reuse savings |
| Complete accessibility/uncached-machine rehearsal | Make the demo dependable for reviewers | Next QA work: keyboard/screen-reader/contrast/browser matrix and actual uncached installation |
| Runtime LLM chat, arbitrary generated Terraform, inflated “confidence” badges | Eye-catching but adds unverifiable recommendations or untested deployment artifacts | Deferred; no runtime LLM or deployment scaffold is added in this phase |

## Demonstration plan and acceptance

1. P3: run Decision Lab, inspect all complete candidates, equal-score alternatives and the scoped preference sweep. Change the inspected plan without changing the recommendation.
2. P2: inspect each single functional edit and the smallest successful pair found; retain India/compliance. Explain that disabling features creates a different project.
3. P6: show a one-edit phone-login experiment while keeping the original result infeasible and original input unchanged.
4. P5: show that no eligible functional experiment invents Entra assurance. Evidence tasks remain the route forward.
5. Export the Proposed ADR and exact analysis JSON; compare API and CLI output, inspect versions/hash/references and verify stale exports are blocked after an edit.

Exit gates: unchanged standard recommendation outputs; independent direct-rerun and dominance checks; protected fields unchanged in every experiment; strict analysis schema; bounded calls; exact API/CLI/browser parity; honest status and artifact ownership; measured endpoint timings; updated release documentation and package.
