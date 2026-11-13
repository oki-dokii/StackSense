# Release evaluation evidence

These are author-designed unseen-style cases, not organiser hidden cases or independent expert review. `cases.json` records inputs and explicit invariants; tests exercise them without scenario-ID branching in the engine.

- `outputs/`: 14 actual engine result objects.
- `results.json`: status/selection/cost/warning summary and case-set SHA-256.
- `sensitivity.json`: six paired usage-input changes with actual cost effects.
- `performance.json`: real cold API startup and 120 warm loopback HTTP measurements on the stated machine.
- `setup.json`: clean extracted-source rehearsal with a populated offline npm cache and runtime/test source digest.
- `ui-scenarios.json`: unchanged public inputs followed by the nine edge-category inputs used for browser capture.
- `screenshots.json`: actual screenshot hashes, input hash and scope.
- `report-checks.json`: page/format/identity/abstract/hash and actual render inspection record.
- `package-checks.json`: final archive integrity, hashes, bounds and source validation.

After building, run `npm run evaluate` and `npm run verify:release`. Timing is deliberately separate (`npm run measure`) so normal checks do not pretend stable benchmark timings. Repeated measurements can vary; they do not benchmark the recommended stacks.
