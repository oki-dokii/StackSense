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

Other recorded choices: no persistent application database; no user login; no live pricing dependency; canonical output excludes runtime timestamps; unknown extension fields preserved and warned; month-12 cost horizon; initial implementation targets Node.js 24 LTS after dependency verification.

Revisit only with evidence: a desktop wrapper, hosted backend, vector database, Kubernetes, and microservices add no present MVP requirement. Do not confuse infrastructure StackSense may recommend with infrastructure it needs to run.
