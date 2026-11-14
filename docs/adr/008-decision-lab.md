# ADR 008: separate bounded analysis from the original recommendation

Status: Proposed; implemented for evaluation in application 0.7.0. Owner acceptance remains pending.

The standard recommendation must continue to represent the original brief. Decision exploration needs access to all fully completed candidates, explicit changed inputs and portable evidence, without turning a hypothetical or stable identifier into deployment approval.

Keep recommendation engine/rules 0.6.0 results unchanged. Add a detached scalar projection of completed plans and a separate analysis 0.1.0 artifact/endpoint/CLI. Rerun the engine for 24 priority changes plus baseline. Compute a finite-catalog nondominated set under declared objectives. Explore only eligible single/pair functional edits and preserve protected constraints. Export Proposed ADR Markdown and evidence JSON; edits invalidate exports.

Alternatives considered: extend every standard recommendation with large analysis payloads; invoke an LLM for explanations; automatically relax residency/compliance; or generate untested deployment templates. The chosen approach adds optional local work, preserves baseline parity, is bounded/testable and discloses model limits. It does not establish global sensitivity, empirical optimality, current vendor assurance or human acceptance.

Evidence: [research](../PHASE_7_RESEARCH.md), [implementation and validation](../PHASE_7.md), [analysis tests](../../tests/decision-lab.test.ts). Next work is scoped capacity measurement, reviewed evidence changes and independent evaluation.
