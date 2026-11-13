# Test and validation plan

Status: release checks implemented and executed (201 passing tests), with 14 author-designed unseen-style cases, actual browser evidence, measured local API/setup and verified outputs/report/package. See [Phase 5](PHASE_5.md). Full expert/cross-browser/other-OS validation remains outside the local evidence.

## Verification layers

1. Contract: validate schemas, all six original fixtures and split copies, positive/negative boundary payloads, output statuses.
2. Unit: defaults/provenance, rule evidence, eligibility, fit rules, integer tie-breaks, cost arithmetic, warnings.
3. Integration: full engine with curated catalog; API and CLI parity; batch continuation and safe filenames.
4. UI: manual/import/edit/recommend/inspect/export; invalid input; infeasible; stale output; keyboard and mobile behavior.
5. Evaluation: review public/hidden-style outputs against sourced architectural reasoning; document acceptable alternatives, not one exact brand list.
6. Delivery: clean install/build/run; genuine outputs/screenshots/report; references and submission link rehearsal.

## Required cases

| ID | Case | Expected invariant |
|---|---|---|
| T01 | P1–P6 original fixtures | Parse and evaluate; specific decisions and justified statuses |
| T02 | Missing each required field | invalid_input, null stack, correct path |
| T03 | Negative/float integer fields, wrong types, unknown enums, priorities 0/6 | All discoverable field errors, no coercion/crash |
| T04 | Minimal standard input | Documented defaults, valid full evaluation |
| T05 | Optional null where prohibited; p95 null | Reject prohibited null; accept explicit p95 null |
| T06 | Huge scale/zero budget; tiny team/extreme SLA | Critical conflicts or clearly labeled reduced scope |
| T07 | Static high traffic; small internal tool | No unjustified microservices/Kubernetes |
| T08 | India/EU residency, explicit provider, compliance | No silent region/provider/control violations |
| T09 | Existing identity/database integrations | Concrete reuse/integration or sourced incompatibility |
| T10 | On-premise/air-gapped | No hidden runtime SaaS/CDN dependency |
| T11 | Skill mismatch | Explicit team-language driver and alternative trade-off |
| T12 | Retired technology in existing systems/catalog | Warning; retired option never selected |
| T13 | Offline Android + photos + unreliable network | Local persistence/sync/upload strategy, not just server cache |
| T14 | Realtime + 100 ms target | Compatible connection architecture; honest latency assumptions |
| T15 | Cost boundaries, bundle overlap, OTP/ML unknown | Correct min/max, warnings, usage disclosure, no duplicate charging |
| T16 | Repeat, permute object keys, adapter parity | Identical canonical result for fixed versions |
| T17 | Rename project/change scenario_id | Stack unchanged |
| T18 | Change one architectural input at a time | Explain sensible local changes; hard constraints retained |
| T19 | Batch with valid, invalid, duplicate/missing IDs | Every result returned; safe deterministic filenames |
| T20 | Malformed/oversized JSON, deep nesting, hostile text | Helpful bounded errors; no injection or UI execution |
| T21 | LLM-off/no network | Same stack and complete functionality |
| T22 | Missing/invalid catalog and search bound exhausted | Internal failure, never false invalid_input/infeasible |
| T23 | All four statuses | Output schema + status invariants pass |
| T24 | Input edited after run | Stale label and export prevention |

## Public scenario assessment rubric

P1: static/no unnecessary backend; free-tier assumptions. P2: web+Android, payments/chat/search/OTP, India, budget realism. P3: collaboration correctness, tenant isolation, realtime load/latency. P4: ledger consistency, security controls, AWS/India and inference. P5: existing Microsoft integration and low operations burden. P6: offline writes, sync conflict policy, low-memory clients and media handling. These are review dimensions, not predetermined products.

## Mutation / metamorphic checks

For each base scenario change cloud, residency, deployment, budget, languages, DevOps, offline, concurrency, or priorities independently. Compare trace explanations. Adding a hard constraint may remove candidates, never merely reduce their score. Increasing traffic on static content should not force a dynamic backend without another reason. Repeat with reordered set-like arrays and object keys.

## Evidence record

Record command, commit, engine/catalog/rules versions, date, machine/OS/runtime, result, elapsed time, and screenshot/output path. Time 20 warm runs plus cold startup on a stated laptop; report observed maximum/p95, not fabricated benchmark values. Rehearse install on a fresh clone; identify OSes actually tested. Real company case studies/expert review are optional validation evidence, but citations and comparison rationale are required for claims.


## Phase 3 execution record

145 automated tests now pass, including complete recommendation status/schema checks, real CLI batch exports, service/database/data-flow compatibility, conservative external residency and BAA evidence, explicit RBI region policy, cost-cent arithmetic, zero budget, retention, extension handling and catalog/metadata ordering invariance. These checks do not validate deployed workload performance or certify compliance. Details: [Phase 3](PHASE_3.md).


## Phase 4 execution record

The suite now has 182 passing tests across six files, including HTTP parity/status/security/bounds and real static-serving integration plus browser input-model checks. Actual browser flows and screenshots complement the automated checks; no full accessibility or cross-browser conformance is claimed. See [Phase 4](PHASE_4.md).
