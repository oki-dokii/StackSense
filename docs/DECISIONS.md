# Decision log

Status: proposed implementation baseline for owner review; no existing application constrained these choices. Change decisions with a new ADR and update affected contracts/tests.

| ADR | Decision | Rationale |
|---|---|---|
| [001](adr/001-local-modular-engine.md) | Local modular monolith; pure shared engine | Fast judge setup, adapter parity, testable logic |
| [002](adr/002-rules-and-catalog.md) | Sourced rules + constraints + scoring; no runtime LLM | Determinism, explainability, challenge policy |
| [003](adr/003-contracts-and-ui.md) | JSON Schema first; React/Vite + Fastify + TS | Exact import/export and shared implementation language |
| [004](adr/004-status-and-budget.md) | Explicit infeasible/invalid states; always warn on cost risk | Resolve document ambiguities without silent violations |
| [005](adr/005-research-backed-planning.md) | Research-backed complete-plan ranking and evidence | Distinguish compatibility, preferences, catalog gaps and true conflicts |
| [006](adr/006-phase-2-core-scope.md) | Distinct provisional core reports until services/costs/controls are implemented | Avoid fake final prices and unsupported feasibility claims |
| [007](adr/007-complete-plans-and-cost-evidence.md) | Evaluate complete services/control scope before cost ranking; distinguish reference rates and assumptions | Prevent omitted features, false residency/certification claims and hidden service charges |
| [008](adr/008-local-api-and-workspace.md) | Same-origin local API and schema-driven in-memory workspace | Preserve engine parity, unknown imports and stale-result integrity |

Other recorded choices: no persistent application database; no user login; no live pricing dependency; canonical output excludes runtime timestamps; unknown extension fields preserved and warned; month-12 cost horizon; initial implementation targets Node.js 24 LTS after dependency verification.

Revisit only with evidence: a desktop wrapper, hosted backend, vector database, Kubernetes, and microservices add no present MVP requirement. Do not confuse infrastructure StackSense may recommend with infrastructure it needs to run.

## 0.6.0 follow-up decisions

- Keep strict missing-evidence results while adding actionable resolution tasks; no evaluation-only relaxed-input mode or free-text approval bypass.
- Model ASE Central India as a separate fixed-region product/profile. Exact compute meter evidence does not certify other prices, tenant scope or deployment performance.
- Present completed alternatives after service/control/cost evaluation; disclose deterministic tie-breaks and heuristic operating scores.
- Run cost sensitivity on the selected architecture without reranking; distinguish assumed upper envelopes from explicitly supplied usage.
- Give existing systems concrete integration tasks without silently selecting migration, reusing unverified resources or claiming license savings.

[Phase 6 evidence](PHASE_6.md).

## Decision Lab

[ADR 008](adr/008-decision-lab.md) records the separate analysis contract, bounded reruns/experiments, detached candidate projection and Proposed artifact ownership. [Research and rejected ideas](PHASE_7_RESEARCH.md).
