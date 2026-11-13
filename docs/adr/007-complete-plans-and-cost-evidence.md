# ADR-007: Complete-plan evaluation and explicit cost/control evidence

Date: 2026-11-13 · Status: implemented in Phase 3

Context: a compatible four-layer stack may fail a required service integration, external data-residency boundary or contractual requirement. Headline free tiers and generic product security claims are insufficient to approve the full design.

Decision: keep `plan:core` as a development mode; add `recommend` for organiser-format results. Evaluate services and control blockers for every compatible core combination, estimate only compatible complete designs, then score and select. Required service gaps reject the design rather than emitting a usable stack with an omitted feature. Search-limit failures remain internal failures, not infeasibility.

Store separate versioned service profiles, primary-source metadata, framework design records and pricing envelopes. Identify published reference rates versus authored allowances. Emit reproducible quantities, rate intervals and cent-rounded line totals. Price CI, identity, workers, network, backups and payment/SMS assumptions where selected, without charging shared bundles twice. Treat budget according to ADR-004.

Output configured control proposals and data-flow locations; do not claim certification, executed agreements, performance or regional provider quotes. Missing residency/contract evidence can yield catalog-relative infeasible results. No-plan cost placeholders must be explicitly marked not estimated. Source and scenario metadata never determine a recommendation.

Consequences: outputs may honestly remain infeasible while the catalog grows. Service alternatives identify real options to investigate but are not claims that all alternatives have reviewed compatible deployment evidence. Public outputs may change with versioned evidence/rules; preserve actual generated artifacts and verification records.
