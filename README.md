# StackSense

StackSense turns a structured software brief into an explained frontend, backend, database, hosting and supporting-service recommendation. A deterministic local engine validates constraints, compares complete compatible plans and exposes cost assumptions, alternatives and critical warnings. It needs no account, paid key or runtime LLM. [Public repository](https://github.com/oki-dokii/StackSense) · [Report](output/pdf/Report_SohamBanerjee.pdf) · [Submission ZIP](deliverables/StackSense26_SohamBanerjee.zip).

## 1. Architecture

```text
Guided form / JSON import       Scenario JSON file
           |                           |
     React workspace                  CLI
           |                           |
     Local Fastify API ----------------+
           |
  Shared validation + recorded defaults
           |
  Compatible plan search <-- sourced catalog / policy / prices
           |
  Required services + controls + itemized cost model
           |
  Known server language -> budget tier -> weighted fit / stable ties
           |
  Explained result / JSON export / Decision Lab experiments
```

`contracts` owns input/output validation and canonical JSON; `catalog` records product, driver, region and source evidence; `engine` searches, completes, prices and ranks plans. API, CLI and UI share that engine. Decision Lab reruns controlled edits without applying them. See [input decisions](docs/INPUT_DECISION_MAP.md), [engine walkthrough](docs/ENGINE_WALKTHROUGH.md) and [architecture rubric](docs/ARCHITECTURAL_ACCEPTABILITY.md).

## 2. Technologies and versions

Application/engine **0.9.0**, core catalog **0.6.0**; TypeScript **5.9.3**, Node **22.17.1** tested locally, Fastify **5.12.8**, React/react-dom **19.3.1**, Vite **8.3.8**, Ajv **8.20.0**, Vitest **5.1.0**. Exact dependencies are pinned in `package-lock.json`. Catalog products are recommendation choices, not installed applications.

## 3. Prerequisites

Use **Node 22.17+ within Node 22, or Node 24**, with npm. macOS, Linux and Windows are supported by the CI matrix; `.nvmrc` records the local runtime. No Docker, database, cloud account or Python is needed for the app. Python/report tools and PostgreSQL are only needed to reproduce optional authoring/reference checks. The server binds to IPv4 loopback.

## 4. Local setup and run

```sh
git clone https://github.com/oki-dokii/StackSense.git
cd StackSense
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:3000**. Load a sample, complete the guided brief or import JSON, then choose **Recommend stack**. Drafts stay in memory. Editing inputs marks results stale and disables export until rerun. Stop with Ctrl+C.

Optional port: macOS/Linux `STACKSENSE_PORT=3001 npm start`; PowerShell `$env:STACKSENSE_PORT=3001; npm start`. Development: run `npm run dev:api` and `npm run dev:web` in separate terminals. Validation: `npm run check`; build: `npm run build`.

## 5. Run a scenario and export JSON

```sh
npm run --silent recommend -- --input fixtures/public/P2.json --output result.json --pretty --no-llm
npm run --silent recommend:batch -- --input fixtures/public/scenarios.json --output-dir reports --pretty --no-llm
```

The first command writes `result.json` in the current directory. Batch writes `reports/P1_output.json` through `P6_output.json`. Existing files are protected; add `--force` deliberately to replace them. Without an output path, JSON goes to stdout. Browser results also provide JSON download. [CLI/API reference](docs/API_CLI.md).

Exit codes: **0** selected stack (warnings allowed), **2** invalid input/usage, **3** infeasible. Batch uses the most severe item status. `ok_with_warnings` can include **critical provisional residency, identity, capacity or contract exceptions**: a stack is not production approval. Real deployment/provider/air-gap conflicts still block. Overruns stay visible; complete known-language plans with upper bounds inside budget are preferred before weighted scores. [Remaining evidence gates](docs/REMAINING_GAPS.md), [costs and limits](docs/COST_MODEL.md), [public results](outputs/README.md), [60 authored stress briefs](evaluation/stress-results.json).

## 6. LLM-off switch

**`--no-llm` disables all LLM features.** It is an accepted no-op: StackSense makes no LLM calls in any mode, including UI/API/Decision Lab. No keys are read for stack selection. The stress evaluator runs every brief twice and compares actual CLI `--no-llm` output with the engine.

```sh
node scripts/evaluate-stress.mjs --check
```

## 7. Project structure

```text
apps/cli, apps/api, apps/web     Local interfaces
packages/contracts             Validation, schemas and stable serialization
packages/catalog               Curated products, services, evidence and prices
packages/engine                Constraints, scoring, costs and Decision Lab
schemas, fixtures, tests       Contracts, public/stress inputs and regressions
outputs, evaluation            Generated recommendations and verification evidence
docs                           PRD/TRD/SRS, flows, research and decision records
scripts, benchmarks            Release tooling and optional reference measurements
output/pdf, deliverables       Report and verified submission archive
```

[Documentation index](docs/README.md) · [development phase history](docs/PHASES.md) · [extended guide](docs/USER_GUIDE.md) · [submission checklist](docs/SUBMISSION.md).

## 8. Credits

Direct application/tool dependencies: **Ajv, Fastify, @fastify/static, React, react-dom, Vite, TypeScript, tsx, Vitest, jsdom, json-schema-to-typescript, @types/node, @types/react and @types/react-dom**. Optional reference tooling uses **pg and PostgreSQL**. PDF authoring uses **ReportLab, pypdf, Pillow, Poppler and Python**. CI uses **GitHub Actions checkout and setup-node**. Lockfiles record transitive dependencies; [source registers](docs/REFERENCES.md) list licenses/references and scoped catalog APIs/documentation. The runtime API is local only; recommended cloud/payment/SMS services are not called or provisioned.

The organiser supplied the problem statement and six public JSON scenarios; these contain no expected-stack labels. All additional stress briefs and architectural acceptability criteria are author-designed with disclosed AI assistance, not independent grading. Research/repository comparisons supplied ideas and citations; no competitor implementation was imported. [AI assistance declaration](docs/AI_ASSISTANCE.md) records Codex assistance in research, design, code, tests and documentation. Participant understanding and responsibility cannot be established by automated checks.
