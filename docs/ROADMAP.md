# Implementation roadmap

Baseline date: 13 November 2026 IST. Deadline: 15 November 2026, 23:59 IST. This is a proposed execution order, not completed work. One owner implements and reviews decisions; no team work is assumed.

## Phase 0 — contracts and design

Present in this documentation starter: PRD/SRS/TRD, schemas, public fixtures, UI/flows, decision specification, test/evidence/submission plans. Owner review remains necessary, particularly research assumptions and rule design.

Exit: document/fixture checker passes and contract ambiguities are recorded.

## Phase 1 — executable vertical slice (13 November)

- Scaffold npm workspaces and exact verified dependencies; pin lockfile/runtime.
- Implement schema validation/defaults, CLI, result serializer and minimal in-memory catalog.
- Make one scenario run end to end; then extend generic rules rather than special-casing P1.
- Add meaningful invalid-input, deterministic tie, and compatibility checks.

Exit: real CLI JSON produced from inputs with trace; README command verified.

## Phase 2 — researched engine coverage (13–14 November)

- Research diverse core candidates and deployment variants with primary sources.
- Add hard filters, plan compatibility, conditional supporting services and honest cost bands.
- Cover all six public scenarios plus on-premise/air-gapped/conflicts/EOL.
- Validate changed-input behavior and review explanations/alternatives.

Exit: public and hidden-style cases yield defensible outcomes, no silent hard violations.

## Phase 3 — UI and adapter parity (14 November)

- Build accessible sections/import/review/results/export, API, batch status and stale-state handling.
- Confirm CLI/API same result; responsive/keyboard journeys; errors/statuses.
- Add source/methodology view and no-network operation.

Exit: actual running UI suitable for genuine report screenshots; <10 second target measured.

## Phase 4 — evidence and submission (15 November)

- Freeze versions; run all six; save genuine outputs.
- Capture actual screenshots for six cases and nine edge categories.
- Finish report within limits, README, references, AI disclosure.
- Rehearse fresh clone/setup; package under 1 GB; verify Drive viewer access; submit on Unstop.

Aim to submit ahead of 23:59 IST with time for access/setup corrections. No change to submitted Drive contents afterward.

## Prioritization if time is tight

Protect correct logic, all input fields, standard JSON, determinism, warnings/costs, real outputs and report. Remove optional LLM, accounts, hosted demo, elaborate animation, live pricing, comparison mode, and Docker polish first. A functional CLI is allowed, but screenshots must reflect actual delivered interface. Do not replace missing engineering with fabricated evidence.

## Definition of ready / done

Ready: inputs, rule, evidence sources, expected invariant, affected contract known. Done: implemented; targeted checks pass; traces explain selection; documentation current; no regressions in public/constraint cases. Release done additionally requires report/submission evidence and verified local instructions.
