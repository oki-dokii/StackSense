# References and evidence register

## Challenge sources

- SRC-CHALLENGE: user-supplied `StackSense_Problem_Statement.pdf`, version 1.0, 19 pages, release 10 November 2026. Requirements read from full document; primary sections: 2 functional/NFR, 3 input, 4 output, 5 design rules, 6 edge cases, 8 evaluation, 9 submission, 10 report, 11–12 rules/FAQ.
- SRC-PUBLIC: user-supplied `stacksense_public_scenarios.json`, six input objects. Copied unchanged to `fixtures/public/scenarios.json`; individual objects split into P1–P6 files. Not expected answers.

Source PDF is not republished in this starter. Its requirements are summarized; original organiser wording prevails.

## Implementation documentation reviewed on 13 November 2026

- Fastify official documentation: https://fastify.dev/docs/latest/ — framework reference for the proposed local API adapter.
- Ajv JSON Schema documentation: https://ajv.js.org/json-schema.html — validator/schema-version reference; project chooses draft-07.
- Vite getting started: https://vite.dev/guide/ — proposed frontend build tooling reference.

These references support tool choice, not claims about the suitability or cost of any recommended production stack. Exact implementation versions are not pinned yet.

## Research register to complete

Use one record per factual source:

```text
source_id:
product_or_rule:
page_title:
url:
reviewed_on:
version_or_region_scope:
facts_supported:
assumptions_or_caveats:
review_due:
```

Required research areas: product maintenance/EOL, platform/runtime support, regional deployment, external dependencies, controls/certifications scope, pricing/tiers/units, operational burden, workload suitability, integration compatibility, realtime/offline behavior. Prefer primary sources. Secondary benchmarks/case studies need methodology and applicability notes.

## Attribution policy

Cite every third-party library, dataset, API, asset, template and borrowed snippet in final report/README as applicable. Record licenses; do not add a repository license without owner choice. Do not claim completed catalog research based only on this starter's candidate backlog.
