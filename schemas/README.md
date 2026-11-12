# JSON contracts

- [Scenario input](scenario.schema.json): draft-07; standard fields plus optional `extensions`; scenario_id optional.
- [Recommendation output](recommendation.schema.json): draft-07; four statuses, core stack and explanation objects.

Schemas are implementation-ready contracts, not engine code. Defaults are schema annotations: normalization must apply them explicitly and record assumptions. Ajv should use all-errors reporting, no coercion, no automatic data-changing defaults, and no removal of unknown fields. Preserve unknown fields and emit an application warning.

The output profile is intentionally stronger than the minimum output table: nonempty driven_by, alternatives, and trade-offs for all components. It permits null stack for invalid/infeasible status. It uses the standard supporting-layer enum despite a nonstandard `forms` value in the shortened PDF example.

Semantic invariants requiring application checks: cost min ≤ max; driver paths resolve to supplied or normalized input; valid versions and source references; no silent hard violations; exact export/display parity; cost placeholders on no-plan outcomes displayed as “Not estimated.”

Run `python3 scripts/check_docs.py --schemas` with the optional jsonschema dependency installed. This checks schema validity, all supplied fixtures, synthetic minimal input, negative contract examples and synthetic result statuses. It does not validate recommendation quality because no engine exists yet.
