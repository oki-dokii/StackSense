# Release 0.8.0: usable recommendations with explicit conditions

14 November 2026. Application, recommendation engine, rules and services catalog: 0.8.0; core catalog: 0.4.0; Decision Lab analysis: 0.2.0.

All six public scenarios now return stacks: P1 is `ok`, and P2–P6 are `ok_with_warnings`. Missing external vendor residency evidence is an explicit critical exception on P2, P4, P5 and P6. This is a provisional proposal, not a declaration of compliance. Actual provider/region/deployment contradictions and restricted external flows remain blocking.

India payments use Razorpay, phone delivery uses MSG91, and existing Entra tenants integrate directly through OIDC/SAML. Checkout does not implement lending, KYC, ledgers or disbursement. See the [policy](RECOMMENDATION_POLICY.md) and [engine walkthrough](ENGINE_WALKTHROUGH.md).

Infrastructure bands count provisioned peak WebSocket capacity once. Payment and SMS activity scenarios remain separately itemized and do not enter the infrastructure budget comparison. P2 and P5 still exceed their stated infrastructure budgets at the lower bound; the release preserves those warnings.

The initial 0.8 validation included 262 application tests across 11 files, 22 native evidence/provenance tests, 14 author-designed evaluation cases, 12 region/auth/payment combinations, exact CLI `--no-llm` parity for all six public inputs and real air-gap/contradictory-region rejection tests. Fresh archive extraction with a populated offline npm cache passed setup, checks, build and output verification in 20.204 seconds on macOS arm64. This is not a clean-network download measurement.

Current browser evidence covers all public outputs, nine edge cases, JSON/ADR export parity, desktop/mobile results and eight scoped accessibility captures. The report contains 15 main pages and 10 appendix pages; all 25 rendered pages were inspected. Source and artifact integrity records live under `evaluation/`.

The README includes Credits and visible LLM-off instructions. AI assistance remains truthfully disclosed. Cross-platform GitHub Actions results are available on the repository Actions page; external submission is not implied by packaging.

The subsequent [thirty-scenario stress evaluation](STRESS_EVALUATION.md) adds 46 regression tests, bringing the application suite to 308 tests across twelve files. It fixes search-only persistence, reviews AWS US/EU primary mappings, and avoids extra client bundles on ties. Current setup and artifact records supersede the initial timing above; all six public recommendation JSON files remain unchanged.
