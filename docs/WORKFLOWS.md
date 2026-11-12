# Workflows

## W1: manual recommendation

User opens an empty form, enters required fields, expands optional sections, reviews defaults, and runs. Client validation helps navigation; engine validation remains authoritative. If invalid, preserve input and show all field errors. If valid, show result status, stack when present, costs, warnings, assumptions, and export. Editing transitions to stale until another successful run.

## W2: single scenario import

Read local file as text → size check → parse → require object or route array to batch → validate → review imported values/defaults → run → inspect → download `<safe-id>_output.json`. Scenario IDs affect file naming only. Sanitize names and use an index fallback; never accept path separators in a generated filename.

## W3: public batch / judging

CLI receives `fixtures/public/scenarios.json`; validates container; processes each item with the same engine; writes one result per item plus an optional manifest outside the six required files. Invalid items still produce `invalid_input` results. Duplicate/missing IDs get deterministic index suffixes; no overwrite unless `--force`. Check outputs against schema, then verify semantic invariants. UI “Run all” displays a status per item, not only an aggregate success count.

## W4: conflict/infeasibility

Valid input → detect competing requirements → determine whether any plan satisfies hard constraints → if none, return `infeasible` with critical warnings and no stack. If a reduced feature scope can be offered, require explicit warning and precise assumptions; never silently relax hard constraints. Show input changes as suggestions, not automatic edits. Rerunning changed inputs creates a new result.

## W5: knowledge-base change

Find a coverage gap → research primary sources → add technology/deployment/price facts with source IDs and review date → add compatibility rules and boundary tests → run public and hidden-style regressions → inspect changed decisions → bump catalog/rules version → record rationale. Do not tune a rule just to force one named scenario's output.

## W6: evidence and release

Freeze logic/catalog → generate all six outputs from the real build → capture genuine UI screenshots → record commands, versions, machine and measurements → complete report references/AI disclosure → rehearse clean setup → package Drive folder → verify link in private window → submit before deadline → do not alter submitted files afterward. Repository changes after submission must not mutate the submitted folder.

## State transitions

| From | Event | To | Required behavior |
|---|---|---|---|
| empty/editing | Validate fails | invalid | Preserve edits, focus error summary |
| editing/invalid/stale | Valid run | running | Disable duplicate run/export |
| running | Valid result | success/warned/infeasible | Render status-specific content |
| running | Transport/internal error | failed | Retry action; no fabricated stack |
| success/warned/infeasible | Input changed | stale | Keep old result labeled, block current export |
| any non-running | Reset confirmed | empty | Clear raw/normalized/result state |
| result current | Export | same state | Download exact result, no recomputation |

See [flow diagrams](flows/README.md) for user, engine, and batch flows.
