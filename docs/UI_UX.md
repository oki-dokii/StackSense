# UI and UX specification

Status: implemented in Phase 4 with actual browser evidence; [delivery and limits](PHASE_4.md). This specification retains design targets for later accessibility evaluation. Build an architecture decision workspace that makes constraints, risks, and explanations easy to inspect.

## Information architecture

One primary workspace with three routes: `/` input/review; `/results` current in-memory result; `/about` methodology and references. Direct navigation to results without a run presents an empty-state action. No account or onboarding gate. Main actions: “New project,” “Import JSON,” “Load sample,” “Recommend stack,” “Export JSON.”

## Screen A: input workspace

Desktop: top header, input-method actions, left section navigation, main form, compact right review/constraint panel. At tablet widths collapse review below form; at mobile use a single column and section selector. Avoid wide horizontally scrolling forms.

Sections, in order:

1. Project: name, type, description, nonempty platform checkboxes.
2. Scale: launch/year users; advanced concurrency, traffic, workload, data volume.
3. Team and delivery: size, experience, languages, DevOps, budget, MVP weeks.
4. Infrastructure: provider, deployment, residency, existing systems.
5. Features: realtime/offline/search/media/payments/auth/multi-tenancy/ML/SEO.
6. Quality and compliance: availability string labels, p95 target, compliance multi-select.
7. Priorities: six 1–5 controls with explicit numeric values and descriptions.
8. Review: raw supplied values, applied defaults, missing fields, contradictions, editable links.

Use searchable selects only where option volume needs them; enum labels map to exact schema strings. Languages accept lowercase tokens, with suggested values; do not constrain the schema to a closed language enum. Unknown numerical optional fields have “Not specified,” not a misleading zero. Availability is a select, not a numeric slider. Blank optional values are omitted rather than exported as empty strings/null indiscriminately.

### Import dialog

Choose `.json` or paste JSON. Show file/size, parse errors, single object vs batch count. A batch opens a scenario picker and “Run all” action. Import into a populated form requires an explicit replace action because it discards edits. Preserve unknown extensions and surface a notice. Do not send file contents to a third party. Reject oversized input with a helpful limit message.

## Screen B: results workspace

Reading order:

1. Status banner and summary; critical constraints before technology cards.
2. Architecture style and a small accessible topology diagram.
3. Four core layer cards; relevant supporting services below.
4. Monthly cost band, estimate horizon, assumptions, and budget comparison.
5. Warnings grouped by severity, affected fields linked back to form.
6. Assumptions/defaults; methodology/catalog versions; optional decision trace.
7. Export and edit/rerun actions.

Each component card shows layer, choice, short justification, driver field/value chips, at least one rejected alternative with reason, trade-offs, source links, and optional target platform mapping. Avoid a single unexplained numerical “confidence” score. If showing rank scores, label them relative selection scores, not probabilities.

`invalid_input`: show field errors and return-to-form; no placeholder stack cards. `infeasible`: show conflicting constraints and suggested input changes without presenting a complete recommended stack. Cost placeholder 0–0 for no stack renders “Not estimated.” `ok_with_warnings`: keep warning banner visible and name every scope relaxation. `ok`: concise success treatment; do not imply guaranteed compliance or SLA.

## Wireframes

```text
DESKTOP / INPUT
+---------------------------------------------------------------+
| StackSense             Methodology       Import   Load sample |
+--------------+--------------------------------+---------------+
| Project      | Project / scale / team fields  | Review        |
| Scale        | Labels, help, inline errors    | Defaults      |
| Team         |                                | Constraints   |
| Features ... | [Back] [Continue]              | [Recommend]   |
+--------------+--------------------------------+---------------+

DESKTOP / RESULT
+---------------------------------------------------------------+
| Status + summary                          Edit inputs  Export |
| Warnings requiring attention                                  |
+-------------------------------+-------------------------------+
| Frontend                      | Backend                       |
| Choice / why / drivers        | Choice / why / drivers        |
| Alternative / trade-offs      | Alternative / trade-offs      |
+-------------------------------+-------------------------------+
| Database                      | Hosting                       |
+---------------------------------------------------------------+
| Supporting services | Cost and budget | Assumptions | Sources  |
+---------------------------------------------------------------+
```

Mobile preserves that reading order in one column. Do not show mock data as genuine run results.

## Interaction state contract

States: empty, editing, invalid, ready, running, success, warned, infeasible, failed, stale. Running disables duplicate submissions and uses a live status message. After a run, any input change marks it stale and disables current-result export. Navigation away from unsaved edits prompts only when edits would be lost. Reset has a clear confirm action. No silent autosave of sensitive descriptions.

## Visual and accessibility baseline

Proposed tokens: background `#F8FAFC`, surface `#FFFFFF`, text `#0F172A`, muted text `#475569`, primary `#1D4ED8`, success `#166534`, warning `#92400E`, critical `#B91C1C`; validate actual foreground/background combinations. System sans-serif stack; mono for JSON/field paths. Base 16 px, line-height 1.5; spacing multiples of 4 px; restrained 8 px card radius. Minimum touch target approximately 44 px. Color never conveys status alone.

Keyboard tab sequence follows document order. Every input has a label and associated help/error via `aria-describedby`. Error summary receives focus after failed submit; links focus relevant fields. Use native buttons and fieldsets, visible focus, reduced-motion support, and text descriptions for diagrams. Target WCAG 2.2 AA; test rather than claiming conformance.

## Essential content examples

Good: “Budget may be exceeded: estimated $120–$210/month against $150. This assumes 800 concurrent users and includes storage, but SMS volume is unknown.”

Avoid: “Enterprise-grade, infinitely scalable, fully compliant.”

Implementation acceptance: keyboard-only import→run→inspect→export; no horizontal overflow at 360 px; status changes announced; stale result blocked; no mocked evidence in report.

## Phase 6 delivered result panels

Blocked results include expandable evidence-resolution tasks with field/component scope and primary links. Existing-system review distinguishes federation, SQL reuse and inventory; task completion is not deployment approval. Usable results include up to three complete-plan comparisons and cost-group/sensitivity disclosures. Price lines expose units, rates and references. At mobile widths the sensitivity table scrolls inside a labeled keyboard-focusable region. [Implementation and QA limits](PHASE_6.md).
