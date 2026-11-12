# Product requirements document

Version 0.1 · proposed baseline · 13 November 2026

## Problem and outcome

Developers need architecture advice that accounts for their actual skills, timeline, scale, budget, deployment restrictions, and features. Popularity-only answers and generic stack lists hide operational and financial risks. StackSense should produce an inspectable architectural recommendation and explain what would change if requirements change.

Success means a judge can run the engine locally, import an unfamiliar scenario, understand its decisions, and export a conforming result without network calls or paid keys.

## Users and jobs

| User | Job | Product response |
|---|---|---|
| Developer/student | Choose a stack they can realistically ship | Clear inputs, manageable architecture, skill-aware explanations |
| Technical reviewer | Challenge why a component was chosen | Drivers, alternatives, trade-offs, sources, decision trace |
| Judge | Run public/hidden scenarios reproducibly | Standard JSON import/export, CLI batch path, documented setup |

## Scope

P0: all standard input fields; field validation; four core layers; conditional supporting services; deterministic logic; hard-constraint checks; documented defaults; conflict statuses; cost bands; JSON import/export; six public results after implementation; CLI; functional responsive web UI; README/report evidence.

P1 after P0: additional optional architectural inputs, compare two runs, score detail explorer, optional local draft saving, Docker setup if time permits.

Deferred: accounts, cloud synchronization, live pricing API dependency, production hosting, collaborative editing, LLM integration, generated application code, enterprise compliance certification.

## User journey

Start with a public sample, import JSON, or fill a guided form. Review defaults and validation. Run the recommendation. Review status and risks before individual technology cards. Inspect explanations and cost assumptions. Edit inputs and rerun. Export the exact displayed result.

## Product behavior

- Input choices use standard schema values, with friendly labels; hidden defaults are prohibited.
- Results distinguish invalid input, infeasibility, warnings, and clean success.
- Recommendation changes invalidate the previous result until rerun; a stale result cannot be exported as current.
- Each core layer offers a selected choice, driver fields with values, an alternative, and a trade-off.
- A multi-platform project may use one core frontend component object whose `choice` describes a combination; structured `targets` may be included as an extension.
- Compliance restrictions inform eligibility and controls. The interface must not imply that selecting a vendor certifies the application.
- A zero-budget project receives a realistic discussion of free-tier limits and optional domain/usage costs.

## Acceptance measures

| Measure | Target / evidence |
|---|---|
| Setup | Fresh documented install on supported OS under 15 minutes |
| Latency | Complete typical and stress catalog runs within 10 seconds on documented laptop |
| Contract coverage | Every standard field accepted and validated; all six fixtures validate |
| Determinism | Repeated runs and object-key reordering yield identical canonical output |
| Constraint safety | Zero silent hard-constraint violations in planned regression suite |
| Explainability | Every selected component has specific drivers, alternative, trade-off |
| Portability | CLI/API share engine; no runtime network or paid keys |
| Evidence | Genuine six outputs and screenshots; all nine edge categories documented |

These are targets; measurements must be recorded after implementation. UI quality supports the evaluated logic rather than replacing it.

## Delivery gate

Do not declare MVP complete until P0 acceptance, schema validation, public outputs, hidden-style cases, README rehearsal, source citation audit, and genuine report evidence are complete. See [roadmap](ROADMAP.md) and [traceability](TRACEABILITY.md).
