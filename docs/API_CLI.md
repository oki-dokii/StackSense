# API and CLI contracts

Recommendation/API interfaces below remain planned. The implemented Phase 1 validation CLI is documented in [README](../README.md) and [Phase 1](PHASE_1.md); its reports are separate from recommendation outputs. Structural contracts live in [schemas](../schemas/README.md).

## Local API

Bind `127.0.0.1:3000` by default. JSON request bodies ≤2 MiB. Application errors are distinct from evaluation statuses.

| Route | Request | Response |
|---|---|---|
| `GET /api/health` | none | `{status:"ok", engine_version, catalog_version, rules_version}`; no secrets |
| `POST /api/recommend` | One scenario object | Recommendation result; 200 for all completed evaluations, including invalid_input/infeasible |
| `POST /api/recommend/batch` | Array, 1–100 scenarios | `{results:[...], counts:{...}}`, input order preserved |
| `GET /api/samples` | none | Public scenarios bundled locally |
| `GET /api/methodology` | none | Version identifiers, supported fields, source metadata |

Malformed JSON: HTTP 400 with a standard `invalid_input` result and root `$` error. Non-object/array misuse: HTTP 400. Oversize body: 413 with transport error envelope `{error:{code,message}}`. Unexpected internal error: 500 same transport envelope, no stack trace or fake domain result. `infeasible` is a completed evaluation, not a server failure. No user-supplied remote URL fetches or arbitrary server file paths.

Example planned use:

```sh
curl -H 'Content-Type: application/json' --data-binary @fixtures/public/P1.json http://127.0.0.1:3000/api/recommend
```

## CLI

```sh
npm run recommend -- --input fixtures/public/P1.json --output outputs/P1_output.json
npm run recommend:batch -- --input fixtures/public/scenarios.json --output-dir outputs
```

Flags: `--input` required; `--output` for single; `--output-dir` for batch; `--force` to overwrite; `--no-llm` accepted as documented no-op in MVP; `--pretty` for formatting; `--trace` optional extension. Default stdout is one JSON result when output path absent. Diagnostic logs go to stderr. Resolve paths cross-platform with standard path APIs. Atomic write via temporary sibling file then rename; refuse unintended overwrite.

Exit codes: 0 completed `ok`/`ok_with_warnings`; 2 invalid input or malformed JSON; 3 infeasible; 1 IO/internal/usage failure. Batch writes every evaluable item; use precedence 1 > 2 > 3 > 0 for final exit. Return invalid-input JSON even with exit 2 where possible. Standard output schema remains identical across adapters.

Metadata scenario IDs never enter engine preference logic. Sanitize filenames; duplicate IDs receive a deterministic index suffix, recorded in batch manifest. An ID absent from input uses `scenario_<index>` for file naming only. Do not invent a required scenario_id field.

## Versioning and serialization

Keep organiser field names unchanged. Additive fields allowed. Record engine/catalog/rules versions. Canonical key/order rules in engine spec; formatted JSON changes whitespace only. APIs must not include runtime request IDs/timestamps inside deterministic result. The browser exports the exact evaluated result object, with no hidden rerun.
