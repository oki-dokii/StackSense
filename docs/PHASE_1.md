# Phase 1 implementation and verification

Date: 13 November 2026 IST. Scope: contract/CLI foundation only. No technology recommendations or feasibility decisions are implemented.

## Implemented behavior

`packages/contracts` reads the authoritative root JSON schemas, validates with Ajv, exposes generated TS types, and normalizes a deep copy of valid input. Required fields do not receive invented defaults. Optional groups/fields receive documented values with assumptions. Missing concurrency/data-volume values remain unknown; absent p95 becomes explicit null with an assumption. Unknown fields survive and warn. Set-like arrays are sorted; duplicates are recorded. Raw input is not mutated.

The CLI reads regular UTF-8 JSON files up to 2 MiB, accepts one object or explicit batch mode (1–100), processes item failures independently, and exports canonical reports. Dangerous prototype keys, cycles/nonfinite programmatic input and nesting beyond 32 levels are rejected. Report outputs are published atomically per file, refuse accidental overwrite, and never replace input paths or their resolved aliases. A batch is not an all-or-nothing filesystem transaction.

Generated scenario/recommendation types come from `schemas/`; hand-maintained normalized/report types describe the Phase 1 adapter model. `validateOutput` checks the existing recommendation structure plus cost min≤max, but does not certify architectural correctness. Recommendation generation is not implemented.

## Verification performed

Environment: macOS arm64; Node 22.17.1; npm 10.9.2. Windows/Linux not exercised yet.

- `npm run check`: generated type freshness, strict TypeScript checking and **45 passing tests**.
- `npm run build`: compiled contracts and CLI successfully.
- Real compiled CLI launched from `/private/tmp`, outside the checkout, against all six original public objects: 6 valid, 0 invalid; report manifest verified.
- Real compiled CLI exported the synthetic mandatory-only fixture with traceable defaults.
- A separate clean checkout copy installed using `npm ci --offline` against the populated npm cache, built successfully, and executed the compiled public P1 validation. This verifies lockfile/build reproducibility on the tested machine; it is not a claim of cold-network install timing.
- Tests cover mandatory omissions, wrong types/ranges/enums, nullable p95, zero values, no mutation/coercion, defaults/unknowns, ordering determinism, unsafe keys, cycles, deep/oversized/nonfinite/invalid UTF-8 inputs, output status/cost invariants, mixed batches, filename collisions, filesystem errors, existing-file refusal, direct/symlink input protection and cleanup.
- Dependency installation after selecting the patched Vitest version reported zero known advisories; no forced audit update was used.

The first test run found duplicate batch-container error output and a source-loader resolution issue in the test harness; both were fixed and the full suite then passed. Invalid UTF-8/oversized inputs also use the normal requested-report export path.

## Commands

```sh
npm ci
npm run check
npm run build
npm run validate -- --input fixtures/public/P1.json --pretty
npm run validate:batch -- --input fixtures/public/scenarios.json --output-dir validation-reports --pretty
```

A report contains `schema_version`, `status` (valid/invalid_input), `normalized_input`, `assumptions`, `warnings` and `validation_errors`. Use `_validation.json` reports only as development evidence. They are not P1–P6 recommendation answers and are not placed in the final `outputs/` directory.

## Remaining limitations

No catalog/selection/cost/explanation engine, API, UI, benchmark or final report screenshots yet. No proof of cross-platform runtime setup until tested. Optional extras are structurally accepted with an unapplied-extension notice; future phases must implement and justify their influence. Unknown extension content remains data. No `.env` or API key is needed. Node 22.17.1 is the exercised baseline; Node 24 remains supported by the dependency engine ranges but untested here.
