# Starter verification record

Date: 13 November 2026 IST. Scope: documentation and contract artifacts only. No engine behavior, recommendation quality, UI, performance, installation flow or final submission has been tested because the application is not implemented.

## Checks performed

- Local Markdown targets resolve; fenced code blocks are balanced.
- All 10 JSON files parse: 2 schemas, original public array, six split public objects and synthetic minimal input.
- Original array SHA-256 matches the fixture provenance record; split objects match the array values.
- Both schemas pass JSON Schema draft-07 schema validation.
- All six public scenarios, their individual copies and the minimal input pass the scenario schema.
- Nineteen synthetic invalid input variants are rejected: required-field omissions, range/type/enum/platform/latency/priority errors.
- Synthetic examples for all four result statuses pass the output contract.
- Invalid result cases are rejected: empty core alternative, invalid-input/stack mismatch, infeasible without critical warning, clean-ok with material warning.
- Five Mermaid source files have recognized diagram headers. No automated render or full Mermaid parser validation was performed.

## Reproduce

```sh
python3 scripts/check_docs.py
python3 -m venv .venv
# Activate the virtual environment for your OS, then:
python -m pip install 'jsonschema>=4,<5'
python scripts/check_docs.py --schemas
```

Validation performed with Python 3 and jsonschema 4.26.0 in a temporary dependency directory; dependencies are not included in the repository. No positive test output is an official stack answer. See TEST_PLAN.md for implementation acceptance work still required.

## Research-plan update — 13 November 2026

The expanded checker passes with 11 JSON files, including the 30-record research metadata register. Source IDs are unique, required metadata is present, and root plan citations match registered IDs/URLs. Internal links and earlier schema/fixture checks still pass. Review depth and access limits are recorded in the annotated research review. No research experiment, hosted prototype, engine output or performance benchmark was reproduced by this update.

## Phase 2 implementation update — 13 November 2026

The executable core planner now passes 97 contract/catalog/search/process tests and build checks. The documentation checker parses 14 JSON files, validates all schema definitions plus the core catalog in schema mode, and preserves public-source provenance. Current execution and coverage limits are in PHASE_2.md. Historical starter notes above describe the state before executable code was added.


## Phase 3 implementation update — 13 November 2026

145 automated tests, generated type checks and build pass. The six actual final-format outputs are validated against the organiser schema, and service data against its own schema. The public manifest records one ok, one ok_with_warnings and four evidence-relative infeasible results; exit 3 is expected. Phase 2 regression behavior is preserved. See [Phase 3](PHASE_3.md) for commands and material limitations.


## Phase 4 implementation update — 13 November 2026

182 tests pass; TypeScript/generated type checks and production API/browser builds pass. Exact parity is tested for all six API outputs. Actual local browser checks cover sample recommendations, P1 export parity, stale-export protection, P3 warned report, mixed invalid/infeasible batches and 360 px result overflow. [Phase 4 evidence and limits](PHASE_4.md).
