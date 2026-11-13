# ADR-006: Publish provisional core reports before full recommendations

Date: 2026-11-13 · Status: implemented Phase 2 boundary

Context: Phase 2 can select core product/deployment combinations, but costs, supporting services and configured compliance controls are Phase 3 work. The organiser output requires a cost band and full reasoning. Returning fake 0–0 pricing or unverified compliance would misrepresent partial implementation.

Decision: expose `plan:core` through a separate versioned development contract and `_core_plan.json` files. A core plan checks modeled primary constraints and lists every pending area; it is not approval of full project feasibility. Withhold selected core layers when required compliance evidence or core regional/deployment coverage is absent. Use `blocked`, not an assertion of real-world impossibility. Preserve the final organiser schema and Phase 1 validation mode unchanged.

Alternatives: emitting final-format results with dummy prices and silent missing services is misleading; refusing to provide any runnable planner until every capability exists hides useful incremental verification. A distinct scope/status provides testable progress without either claim.

Consequences: consumers must distinguish validation, provisional planning and later final recommendation artifacts. Current public batch has one provisional core plan and five blocked reports. Phase 3 must complete services/costs/control evidence and implement the final recommendation interface rather than simply rename these files. See [phase evidence](../PHASE_2.md).
