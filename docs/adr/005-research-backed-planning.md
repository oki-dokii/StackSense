# ADR-005: Research-backed complete-plan ranking and evidence

Date: 2026-11-13 · Status: proposed baseline refinement

Context: the literature review found directly relevant technology-selection, cloud-configuration and constraint-explanation methods. Independent component scores cannot establish whole-plan compatibility, and catalog omissions must not be confused with contradictory real-world requirements.

Decision: retain the local rules/catalog engine. Evaluate hard constraints and complete capability/compatibility first; score six criteria at plan level. Use candidate scores only for traversal. Facts distinguish verified/assumed/unknown evidence. Expose catalog-relative infeasibility and search limitations separately. Use rejection traces first; only claim inclusion-minimal conflicts after validating a complete monotone feasibility predicate. Defer formal solver/QuickXplain integration until needed and tested.

Alternatives: independent layer ranking is a useful evaluation baseline but can assemble incompatible components. AHP/TOPSIS remain literature comparisons; no study proves them necessary here. Learned recommendation lacks a supplied labeled dataset. LLM selection violates the challenge policy.

Consequences: more explicit modeling and source work, but clearer rejection and why-not evidence. No schema field rename required; additive trace metadata is permitted. Existing weights, fit anchors, catalog entries and performance still require implementation and validation. See [plan](../../plan.md) and [research review](../RESEARCH_REVIEW.md).
