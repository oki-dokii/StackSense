# Risks and open questions

| Risk | Impact | Mitigation / owner action |
|---|---|---|
| Short challenge window | Incomplete engine/report | Implement CLI vertical slice first; protect P0; timebox optional UI polish |
| Catalog breadth without depth | Wrong regional/capability claims | Prefer sourced deployment facts and coverage over inflated counts |
| Independent per-layer scoring | Incompatible overall architecture | Whole-plan compatibility checks and adversarial cases |
| Budget/SLA assumptions | Misleading confidence | State horizon/usage/topology; expose warnings and no-estimate states |
| Overfitting public scenarios | Hidden-case failure | Mutations, ID invariance, no name-based rules |
| EOL/pricing drift | Invalid recommendations | Review official sources before release; version catalog |
| Documentation ahead of code | Unrunnable submission | Label plans now; replace with verified commands and actual evidence later |
| Compliance oversimplification | Unsafe/unjustified claims | Deployment/control evidence, explicit responsibility and gaps |
| Search cutoff misclassified | False infeasibility | Separate internal planner failure from proven no-plan outcome |

## Decisions owner should review before implementation

- TypeScript/React/Fastify baseline is proposed, chosen to minimize runtimes; revise if owner has stronger skills elsewhere.
- Node.js 24 LTS target and dependency versions require compatibility check/pinning.
- Month-12 cost horizon and usage defaults must be transparent and researched.
- `cloud_preference:none` and report page-count ambiguities are documented in challenge brief; seek organiser clarification if needed, without blocking independent implementation.
- Extra input fields must be justified by observable decision changes; do not collect unused fields for appearance.

No unanswered preference is required to begin the documented P0 implementation.


## Release handoff status

The implementation/report/package are prepared. Four public scenarios retain explicit evidence blockers; pricing/control/sizing rubrics remain uncalibrated, other-OS and independent expert review are not claimed from local tests, and owner review/originality/online submission remain owner actions. The local source/measurement/report evidence is in [Phase 5](PHASE_5.md).
