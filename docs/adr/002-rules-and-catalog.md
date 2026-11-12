# ADR-002: Explicit rules and sourced catalog

Date: 2026-11-13 · Status: proposed baseline

Context: LLM selection is disallowed; hidden scenarios require generalization and inspectable reasoning.

Decision: hard-filter deployment variants, score soft fit, search compatible plans, produce explanations from recorded evidence. Use local cited catalog and pricing models. MVP has no runtime LLM. Accept `--no-llm` as a documented no-op for judge ergonomics.

Alternatives: LLM prompting violates selection policy; trained ML needs a defensible labeled dataset that was not supplied; simple project-type lookup fails nuanced constraints; unconstrained weighted scoring can select prohibited components.

Consequences: reproducible and auditable but requires substantial research and careful compatibility rules. Weights/thresholds must be owner-reviewed and tested against changed inputs. Never use scenario IDs, names, or hard-coded expected outputs.
