# Extended user guide

Start with the root [README](../README.md). Import one scenario or 1–100 scenarios as JSON, or use the guided form. Sample inputs are unchanged organiser briefs. No submitted project data is sent to an external model/service.

Results show the complete stack, alternatives, source/field drivers, cost lines and warnings. Treat critical vendor/residency/contract/capacity conditions as unresolved. A selected plan does not guarantee compliance, availability, latency or affordability. Inspect [current public outputs](../outputs/README.md) rather than historical phase snapshots for current prices and choices.

The headline covers infrastructure and operations; SMS/payment scenarios are additional. Budget planning exposes a same-brief catalog floor and a bounded optional scope-change proposal. Accepting a proposal is a requirement change: inspect it, edit a copy and rerun explicitly. No field is automatically applied.

Decision Lab explores priority sensitivity, finite tradeoffs and bounded functional changes. It preserves protected infrastructure/compliance inputs in functional trials. Counts are finite authored experiments, not probabilities or measured independent quality. Download JSON and ADR after analysis. Changed input makes old results stale and disables export.

See [CLI/API](API_CLI.md), [input map](INPUT_DECISION_MAP.md), [engine walkthrough](ENGINE_WALKTHROUGH.md), [cost model](COST_MODEL.md), [phase history](PHASES.md), and [AI assistance](AI_ASSISTANCE.md).

For metered managed realtime, optional `monthly_realtime_messages` is the billed sender/recipient count including fan-out. It applies only to actual Supabase Realtime, not self-hosted Yjs/ws. Supplying a hypothetical quantity narrows a scenario estimate; it is not a measurement or permission to rewrite the public brief.
