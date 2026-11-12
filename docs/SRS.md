# Software requirements specification

Version 0.1 · proposed normative project contract

`SHALL` denotes required behavior in this project. `CH-*` maps to the challenge; `SS-*` adds implementation conventions. Schemas describe structure; semantic invariants below remain required even if JSON Schema cannot express them.

## Functional requirements

| ID | Requirement | Acceptance |
|---|---|---|
| CH-FR1 | Collect every mandatory field and support all standard optional fields | Form and CLI/import fixtures cover schema paths |
| CH-FR2 | Import one standard scenario object | Hidden-style object parses without custom conversion |
| CH-FR3 | Return frontend/backend/database/hosting component objects | All four present on a usable stack; `None` explained |
| CH-FR4 | Include supporting layers justified by input needs | Feature-based cases have required capabilities or visible gap warnings |
| CH-FR5 | Explain choices with drivers, alternatives, trade-offs | Core alternatives ≥1; driver paths resolve; explanations vary by inputs |
| CH-FR6 | Estimate monthly USD min/max with assumptions | Nonnegative finite amounts; min ≤ max; scope documented |
| CH-FR7 | Validate fields and detect conflicts with severity | All discoverable field errors returned; no crash on malformed input |
| CH-FR8 | Export standard result JSON | Export passes output schema and matches displayed run |
| CH-FR9 | Same input produces same stack | Repeated run, key-order, adapter parity checks |
| SS-01 | Accept batch array as a convenience | Per-item results; one invalid item does not stop others |
| SS-02 | Use same pure engine for web/API/CLI | Canonical result parity for a fixture |
| SS-03 | Record every applied default or interpretation | Defaults list actual paths/values in `assumptions` strings |
| SS-04 | Detect stale UI results | Editing after run blocks current-result export until rerun |
| SS-05 | Produce versioned decision evidence | Engine/catalog/rules versions and selected/rejected reasons available |
| SS-06 | Remain fully functional offline after dependency installation | Zero engine outbound requests; no key configuration needed |

## Input contract

Authoritative structure: [input schema](../schemas/scenario.schema.json). Enums are exact lowercase values; availability is a string enum. Do not silently coerce numbers/booleans/strings. `null` is accepted only for nullable fields, including p95 latency and project-specific extension definitions. Numeric values must be finite.

Required groups/fields: project.type/platforms; scale.users_at_launch/users_12_months; team.size/experience/languages; budget.monthly_infra_usd; timeline.mvp_weeks. Required languages list may be empty. Unrecognized standard enum values are errors. Unknown extension properties are preserved but excluded from selection unless documented; warn once per unknown path. Unknown keys are not silently treated as known constraints.

Explicit optional defaults from the brief: traffic `steady`, workload `balanced`, has_devops `false`, cloud `any`, deployment `managed_cloud`, residency `none`, all feature booleans `false`, auth/ml `none`, availability `99.9`, compliance `[]`, each priority `3`. Project conventions: absent name/description `''`; existing_systems `[]`; peak concurrency/data volume/p95 absent = unknown, not zero. Missing optional groups expand into these defaults; missing required groups produce field errors. No guessing concurrency from registered users without a recorded cost/capacity assumption.

Extra optional inputs live under `extensions`: expected requests/second, primary user region, retention months, monthly egress GB, monthly OTP count, lock-in tolerance. Schema availability does not imply engine support; unsupported extension keys warn. Extra inputs cannot be required for standard-file execution.

## Status semantics and invariants

- `invalid_input`: parsing/structural/value error; `stack = null`; at least one field error; no selection performed. Root parse errors use field `$`.
- `infeasible`: valid input, no supported plan in the fixed reviewed catalog under the required constraints; explain whether constraints conflict or catalog/evidence coverage is insufficient, without claiming real-world impossibility; critical warning with affected fields; `stack = null` in this profile.
- `ok_with_warnings`: usable stack plus at least one warning; any reduced scope names every relaxed requirement in assumptions. Never silently relax residency/compliance/deployment/cloud constraints.
- `ok`: usable stack; no material warning/critical item. Informational notices may exist.
- `validation_errors = []` for valid scenarios. Core component alternatives are nonempty even when choice is `None`.
- All statuses include summary, architecture_style, estimated cost object, warnings, assumptions, and validation_errors. Without a plan use architecture `other`, cost 0–0, and cost assumption `No feasible estimate: no stack selected`; UI displays “Not estimated,” never “Free.”
- A result may contain additive trace fields. A `scenario_id` is metadata, never a decision input.
- Selected combination shall satisfy platform and capability coverage and deployment compatibility.

## Nonfunctional requirements

NFR-01: install/run using copyable commands in under approximately 15 minutes, measured on a fresh environment. NFR-02: full recommendation within approximately 10 seconds on a documented normal laptop. NFR-03: no paid credentials or runtime external service required. NFR-04: Windows/macOS/Linux paths and commands documented and tested where available. NFR-05: keyboard operation, visible focus, labeled errors, responsive layout at 360 px and desktop. NFR-06: JSON import capped at 2 MiB and batch at 100 items as project limits, with clear error; normal judge scenarios fit these limits. NFR-07: deterministic ordering/tie-breaks; no timestamps/randomness in canonical result. NFR-08: source/pricing freshness and evidence provenance are visible.

## Error and warning model

Errors: `{field, message}` with dotted paths, array indices, or `$`. Sort by field then code/message; deduplicate. Warnings: `{code, severity, message, fields}`. Severity enum: `info`, `warning`, `critical`. Codes include `BUDGET_EXCEEDED`, `BUDGET_RANGE_RISK`, `TIMELINE_RISK`, `OPERATIONS_SKILL_GAP`, `HARD_CONSTRAINT_CONFLICT`, `UNKNOWN_INPUT`, `CAPACITY_UNCERTAIN`, `SOURCE_STALE`, `EXISTING_TECH_EOL`, `COMPLIANCE_REVIEW_REQUIRED`.

## Explicit exclusions

No claim that a selected stack itself establishes regulatory compliance, availability SLA, or measured performance. Those depend on deployment/configuration and must be expressed as assumptions and controls. No public-scenario ID lookup table. No LLM selection. No fabricated evaluation evidence.
