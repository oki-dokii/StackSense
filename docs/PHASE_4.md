# Phase 4 — local API and responsive workspace

Implemented 13 November 2026 IST. Application version 0.4.0 adds adapters and a user interface around the existing engine 0.3.0; recommendation rules, catalog coverage, prices and committed Phase 3 outputs are unchanged.

## Run locally

```sh
npm ci
npm run check
npm run build
npm start
```

Open `http://127.0.0.1:3000`. `STACKSENSE_PORT` optionally selects another loopback port. The server binds 127.0.0.1 only. Keep the full checkout with schemas, data, fixtures and `dist`. No account, API key, paid service, application database or external recommendation call is needed.

Development uses two terminals: `npm run dev:api` and `npm run dev:web`, then open `http://127.0.0.1:5173`. Vite proxies `/api` to the local server without changing Host, preserving same-origin checks. `npm run build:web` builds only the browser assets; `npm test` builds those assets before HTTP integration tests. The main build compiles engine/CLI/API and browser assets.

## Implemented API

Fastify exposes health, bundled public samples, methodology/schema/source metadata, single recommendation and 1–100-item batch recommendation endpoints. See [HTTP contract](API_CLI.md). Exact API/engine parity is tested for all six public scenarios, and mixed batches preserve input order and invalid items.

Domain invalid input and infeasibility are completed evaluations with HTTP 200. Wrong single/batch containers and malformed JSON use 400 with a standard invalid-input report. Bodies above 2 MiB use 413; unsupported media types use 415. Internal failures use a generic 500 transport error, never fabricated infeasibility or private exception details. Unknown routes are 404.

The same-origin app serves `/`, `/results` and `/about` plus built assets. It rejects foreign Origin headers, cross-site browser requests and non-loopback Host names. No permissive CORS, arbitrary input file paths, URL fetching, request-body logging, browser persistence or analytics are enabled. CSP restricts scripts/styles/connections to the local origin and denies framing; responses use no-store and nosniff. This is a local development application, not a hardened multi-user network service.

## Implemented interface

- Guided fields for every standard scenario field and supported extension, generated from the authoritative schema exposed by the local API. Optional unknown capacities remain blank; defaults are labeled and recorded by the engine.
- Project/scale/team/budget/delivery/infrastructure/features/compliance/priorities/usage sections, desktop section navigation and mobile section selector. A brief panel summarizes current inputs.
- Public sample selection, JSON paste/editor, UTF-8 file reading and explicit replacement. Imports preserve unknown fields through guided edits. Invalid items can be evaluated independently in a batch. Unsafe keys, excessive size/depth/value count and nonfinite numbers are rejected before client serialization.
- Results for all four statuses, architecture flow, four core cards and supporting services; driver values from the evaluated input snapshot, alternatives, trade-offs, source links, cost resources/assumptions, warnings, control/data-flow records and decision trace.
- Infeasible/invalid results have no fake technology cards. No-plan cost placeholders render **Not estimated**.
- Scenario picking and single/all-result JSON export. Export downloads the evaluated result rather than rerunning the engine.
- Input edits and unapplied JSON mark previous results stale and disable exports. Pending runs disable duplicate submissions and form edits. Network failures/timeouts preserve drafts. Navigation retains in-memory state; reload/close discards it, with an unsaved-edit warning.
- Native labeled controls, fieldsets, visible focus, skip link, status announcements, error navigation, reduced-motion support and responsive layouts. Accessibility is an implementation target, not a certified conformance claim.

No account or telemetry integration was introduced. Evidence-source links open only if the user chooses them. User data remains in browser memory and the local API process.

## Verification evidence

- 182 tests pass across six files, including the earlier 145 engine/CLI checks and new API/browser-model integration checks. TypeScript and generated-type freshness checks pass.
- Production build succeeds, including real Vite browser assets and compiled Fastify entry point. A fresh copy without dependencies/build artifacts also passes offline `npm ci` using the populated cache, all 182 checks and the production build; this is not a claim of a new online install on another OS.
- HTTP tests cover all six exact shared-engine outputs; mixed-batch counts/order; malformed JSON/UTF-8/container errors; 2 MiB limit; unsafe fields; origin/Host protection; health/schema/samples; generic internal failures; real UI routes/assets and unknown-route handling.
- Input-model checks cover preserved unknown extensions, omission of cleared optional fields, invalid/unsafe/oversized/deep imports, nonfinite numbers, independent batch items, prototype-safe edits and portable export names.
- Actual browser checks: P1 sample → recommendation → JSON download; downloaded P1 data matches the committed engine output exactly. Editing the draft shows the stale banner and disables export. P3 renders its real warned result, services and USD 875.51–7785.95 monthly band. A mixed imported batch renders infeasible and invalid results, including object-typed malformed fields without crashing the form. Direct `/results` navigation in a fresh tab shows an empty state.
- Desktop and 360 px mobile inspection found no horizontal document overflow in the tested results. Keyboard activation, form controls and section navigation were checked during the browser pass. A comma-entry regression was corrected and rechecked with actual typing (`javascript,python` remains two tokens). Screenshots are actual local app captures, not mockups: [desktop workspace](evidence/phase4-workspace-desktop.jpg), [desktop report](evidence/phase4-report-desktop.jpg) and [mobile workspace](evidence/phase4-workspace-mobile.jpg).

Full accessibility auditing, Windows/Linux setup, browser-matrix testing, reserved scenario quality, deployment/load tests and final report packaging remain Phase 5. The existing public evidence gaps are unchanged: two usable recommendations and four explicit infeasible results. Phase 4 does not certify suggested stacks or resolve missing regional/vendor evidence.

## Dependency and design references

Pinned versions: Fastify 5.12.8, @fastify/static 10.1.10, React/react-dom 19.3.1, Vite 8.3.8, @types/react and @types/react-dom 19.3.0. Versions and transitive dependencies are locked. Earlier Node/TypeScript/Ajv versions are unchanged.

Implementation references checked: [Fastify server options](https://fastify.dev/docs/latest/Reference/Server/), [Vite guide](https://vite.dev/guide/) and [React state](https://react.dev/reference/react/useState). These document framework behavior, not performance claims about this app. The local-only repository workflow followed the Sites skill; no hosted Site registration or deployment was requested or performed.
