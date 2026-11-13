# Phase 5 — evaluation, report and release package

Technical release prepared 13 November 2026 IST. App/engine/rules/service policies are 0.5.0; core catalog is 0.3.0. Owner review and external Drive/Unstop submission are separate, pending actions.

## Implemented and corrected

- Added 14 author-designed unseen-style scenarios with explicit behavioral invariants, nine required edge categories and metadata/set-order mutations. They are not organiser hidden tests or independent expert review.
- Added sourced Python 2 and AngularJS upstream EOL notices, including no-plan results, without mislabeling Python 3, maintained Angular or SQL Server 2019. Inactive core entries remain unselectable.
- Added reviewed AWS Fargate / RDS PostgreSQL Mumbai primary mappings. Other database families and external identity/payment flows do not inherit this evidence.
- Preserved distinct external residency diagnostics for phone authentication and payments; one warning code no longer hides a second affected requirement.
- Stopped collecting the still-unapplied primary_user_region / vendor_lock_in_tolerance hints in the guided form; imported values remain preserved and explicitly warned as unapplied.
- Added reproducible evaluation, HTTP timing, clean-source rehearsal, output freshness verification, packaging and a pinned read-only CI matrix for macOS/Linux/Windows and Node 22.17.1/24. Remote CI results are separate from local measurements.

## Actual verification

`npm run check`: **201 passing tests across seven files**, generated type freshness and source/browser TypeScript checks. Production build succeeds. `npm run evaluate` writes genuine outputs for 14 release cases and six paired cost-sensitivity experiments. `npm run verify:release` verifies all 20 public/evaluation files byte-for-byte against the current engine, plus the case-set hash.

[Performance evidence](../evaluation/performance.json): Apple M2, 8 GB, macOS arm64, Node 22.17.1, npm 10.9.2. Cold API start to health was **325.867 ms**. After one warm-up per public case, 20 real loopback HTTP POSTs per case (120 total) had an observed maximum **7.116 ms**. Timing includes consumed JSON, excludes browser rendering and recommended-stack deployment/load performance. It is not a general latency guarantee.

[Clean setup evidence](../evaluation/setup.json): a fresh source ZIP extraction, cached offline npm install, all checks, build, evaluation and output verification completed in **16.805 seconds**. Runtime/test source SHA-256 is checked against final packaging. This measures a populated dependency-cache install on this machine; it does not establish online download speed or setup on other OSes.

[Browser evidence manifest](../evaluation/screenshots.json) maps the 15 actual unedited overview captures to input hash, engine versions and image hashes: P1–P6 plus all nine required edge categories. Prior Phase 4 browser checks covered export parity, stale exports, keyboard controls and mobile overflow. Overview screenshots are not fabricated detailed diagnostic panels; full errors/choices are in matching JSON outputs.

## Final public outcomes

| Case | Status | Main result / evidence limit |
|---|---|---|
| P1 | ok | Astro static delivery, no backend/database, USD 0 band under explicit limits |
| P2 | infeasible | India scope for external phone delivery and payments not reviewed |
| P3 | ok_with_warnings | Complete collaboration design, USD 875.51–7785.95; budget/target/implementation review warnings |
| P4 | infeasible | AWS Mumbai primary mapping reviewed; external OTP/payment India scope remains unverified |
| P5 | infeasible | Azure India primary profile absent; existing tenant/network/reuse scope remains project-specific |
| P6 | infeasible | Offline native building blocks modeled; external phone-delivery India scope remains unverified |

No case ID/name selects a rule. Four unusable public results are a material catalog/evidence limitation, not proof of real-world impossibility. The release does not claim all six cases have usable stacks.

## Report and package

[Report](https://github.com/oki-dokii/StackSense/blob/main/output/pdf/Report_SohamBanerjee.pdf): 24 A4 pages, **14 main + 10 appendix**, body 11 pt and table/reference text 10 pt; abstract 128 words. All page renders inspected; final changed pages re-rendered. Includes all six public screenshots, all nine edge categories, P1/P3 deep dives, 135 linked source/tool records, measurements and truthful AI assistance. [Checks and hash](../evaluation/report-checks.json).

[Submission ZIP](https://github.com/oki-dokii/StackSense/blob/main/deliverables/StackSense26_SohamBanerjee.zip) contains the complete source ZIP with root README, six public outputs, the PDF, notes and a SHA-256 manifest. Source excludes dependencies/build/cache/Git internals, report duplication, nested release archives and secret-file patterns. ZIP integrity, source digest, report QA metadata and <1 GB limit are checked. [Package checks](https://github.com/oki-dokii/StackSense/blob/main/evaluation/package-checks.json).

The title-page identity and permission to publish the report/email were explicitly supplied by Soham Banerjee. This is not a claim of completed owner review of the AI-assisted implementation.

## Reproduce

```sh
npm ci
npm run check
npm run build
npm run evaluate
npm run verify:release
npm run recommend:batch -- --input fixtures/public/scenarios.json --output-dir outputs --pretty --force
npm run measure
python3 scripts/package-release.py --source-only
python3 scripts/rehearse-setup.py release/StackSense26_SohamBanerjee/source/source.zip --npm-cache /path/to/populated/npm-cache
```

Public batch exit 3 is expected and exports every result. Report authoring additionally needs Python ReportLab/pypdf and Poppler for rendering; it is independent of runtime setup. Rebuilding the PDF resets its visual-review status and requires fresh render QA before packaging.

## Owner handoff still required

Review and own the design/research/AI disclosure; upload the named folder to Drive, set and privately verify link-view access, submit the folder link on Unstop before the supplied deadline, and freeze the submitted folder afterward. The agent has not uploaded, shared or submitted this package. No other OS/browser-matrix or independent expert certification is claimed from the local run.
