# Generated public recommendations

These six reports are generated from the unchanged supplied public fixtures by engine/rules/services 0.8.0. They are actual evaluations, not hand-authored expected answers.

```sh
npm ci
npm run build
npm run recommend:batch -- --input fixtures/public/scenarios.json --output-dir outputs --pretty --force --no-llm
```

Exit **0**; manifest: one `ok` and five `ok_with_warnings`. P2/P4/P5/P6 include critical provisional exceptions. A selected stack does not certify their external residency, contract or specialist-domain conditions. See [policy and cost scope](../docs/RECOMMENDATION_POLICY.md).

The headline cost is infrastructure/operations. Additional payment/SMS scenarios are separately itemized. A no-plan report, such as the explicit air-gap conflict fixture, has `estimate_status: not_estimated`; its required 0–0 values are not a free architecture.
