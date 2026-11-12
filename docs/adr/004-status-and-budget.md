# ADR-004: Honest statuses and budget treatment

Date: 2026-11-13 · Status: proposed baseline

Context: the brief inconsistently labels budget soft/hard; abbreviated output examples omit otherwise required alternatives. It permits infeasibility and explicitly relaxed recommendations.

Decision: keep residency/compliance/deployment/provider filters strict. Budget is a scored fit criterion, with warnings whenever the cost band threatens/exceeds it. Never show an over-budget plan as unqualified `ok`. Invalid input has null stack and field errors. Infeasible has null stack and critical warnings. A reduced-scope usable plan names relaxed soft/feature requirements in assumptions and warnings.

For no-plan outcomes retain required output fields; cost 0–0 has an explicit no-estimate assumption and UI text “Not estimated.” Require alternatives and trade-offs despite shortened example omissions.

Consequences: callers can distinguish bad input, impossible requirements, and risky plans. The result schema profile is stricter than minimum requirements in explanation quality and must be documented as such. If organisers clarify, update this ADR and regression cases.
