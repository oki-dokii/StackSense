# Technical requirements document

Current implementation: [Phases 1–4](PHASES.md), including the shared engine, CLI, Fastify API and React/Vite workspace. [Phase 4 delivery evidence](PHASE_4.md) records pinned dependencies and actual coverage.

## Implementation decision

Proposed baseline: TypeScript across engine and adapters; React + Vite web UI; Fastify local HTTP API; npm workspaces; JSON Schema draft-07 contracts validated with Ajv; Vitest for meaningful engine/integration checks; Playwright for essential UI journeys. No runtime database. Catalog/rules/pricing are versioned local JSON. Exact dependency versions are installed and locked; see Phase 4 and the root README.

A local modular monolith minimizes setup and allows independent engine tests. The engine is a library with no React/Fastify/filesystem dependency. CLI and API supply data and receive the same result. See [ADRs](DECISIONS.md).

## Boundaries and module interfaces

| Module | Owns | Must not own |
|---|---|---|
| contracts | JSON schemas, generated TS types, structural validation | Selection preferences |
| normalization | Optional defaults and assumption provenance | Silent type coercion |
| catalog | Sourced product/capability/deployment/cost data | Scenario IDs |
| constraints | Feasibility and eligibility reasons | Cosmetic explanations |
| scoring | Integer feature scoring and priority weights | Hard-constraint overrides |
| planner | Compatible full-stack selection and supporting services | Unbounded search |
| costs | Usage assumptions, component/plan bands | Exact billing promises |
| explanations | Deterministic text from decision evidence | Invented post-hoc reasoning |
| api/cli | Transport, JSON/file IO, exit codes | Independent selection logic |
| web | Form, result rendering, accessibility | Authoritative validation or selection |

Engine signature target:

```ts
type EngineContext = {
  engineVersion: string;
  catalogVersion: string;
  rulesVersion: string;
  catalog: Catalog;
};
function recommend(raw: unknown, context: EngineContext): RecommendationResult;
```

No current-time lookup, environment-driven preferences, network calls, mutable global state, or random tie resolution within `recommend`. Source freshness is evaluated against a versioned catalog review date, not a changing clock.

## Processing and state

1. Parse JSON in adapter with bounded payload.
2. Validate raw object against input schema, collect all field errors.
3. Normalize optional fields in a new object; preserve raw input for display.
4. Derive architectural features and conflicts, with evidence paths.
5. Filter candidates and evaluate full-stack compatibility.
6. Score compatible plans using documented weights and tie-break rules.
7. Attach feature-required services and operating controls; recheck plan eligibility and cost.
8. Produce explanations from recorded selected/rejected reasons.
9. Validate result schema and semantic invariants before returning/exporting.

Catalog validation happens at build/start; invalid catalog is an internal error, not user `invalid_input`. A missing catalog source or unexplained eligibility attribute blocks the affected entry from selection.

## Planned repository structure

See root README. `schemas/` remains the single source of truth; generate package types instead of maintaining competing schemas. API and CLI read one packaged catalog. Do not read arbitrary user paths through HTTP. CLI may read explicit input files; output destinations are caller-selected and must not overwrite without `--force`.

## Serving and packaging

Dev: Vite 5173 proxies `/api` to Fastify 3000. Production-local: `npm run build` builds UI/engine/adapters; `npm start` serves built assets and API from loopback 3000. Runtime requests remain same-origin; no permissive CORS. CLI is built with the same engine. Container support is optional and cannot be the sole untested setup route.

## Reliability and performance

Cache compiled schema validators and immutable catalog in process. Integer scores and precomputed compatibility indexes avoid unnecessary recomputation. Candidate counts and bounded planner work are logged only in debug mode. Measure full request-to-render latency; do not claim latency from a unit test alone. If bounded search cannot establish a complete feasible answer, return an explicit internal planning limitation rather than false infeasibility.

## Observability and privacy

Structured local logs include request ID, duration, status, versions, counts; exclude full descriptions, imported payloads, or secrets. Timing/request IDs do not enter canonical output. Normal operation needs no telemetry service. See [security](SECURITY_PRIVACY.md).

## Completion evidence

Build, types, contract validation, engine tests, API/CLI parity, public batch outputs, fresh setup rehearsal, and keyboard/UI checks must pass. Architecture diagrams describe intended modules until implementation evidence is recorded.
