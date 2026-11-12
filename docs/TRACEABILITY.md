# Requirements traceability matrix

All entries are planned, except the documentation/contract artifacts themselves. “Evidence” specifies what must exist before release.

| Requirement | Specification / module | Test | Release evidence |
|---|---|---|---|
| FR1 inputs | SRS, input schema, UI form | T02–T05 | Field coverage + running screenshots |
| FR2 import | API_CLI, WORKFLOWS W2/W3 | T01/T19/T20 | Hidden-style file run |
| FR3 core stack | DECISION_ENGINE, planner | T01/T07/T08 | Four core objects in actual outputs |
| FR4 services | Catalog capabilities/planner | T09/T13/T14 | Feature-specific services and rationale |
| FR5 explanation | Evidence/explanation module | T01/T11/T18 | Drivers/alternatives/trade-offs in all outputs |
| FR6 costs | COST_MODEL | T15 | Cost bands and assumptions |
| FR7 validation/conflicts | SRS/constraints | T02–T12/T20/T22 | Nine edge categories + screenshots |
| FR8 export | Output schema/API/CLI/UI | T23/T24 | Six valid output files |
| FR9 determinism | DECISION_ENGINE | T16/T17/T21 | Repeated canonical output equality |
| Local <15 min | TRD/README | Fresh setup rehearsal | OS/runtime/commands/timing |
| Response ~10 s | TRD | Measured cold/warm runs | Machine and measurements |
| No paid keys | ADR-002/security | Offline run | Clean environment run |
| LLM policy | ADR-002 | T21 | No LLM integration / no-op flag explained |
| Research | KNOWLEDGE_BASE/REFERENCES | Source audit | Field-level source evidence |
| Documentation | SUBMISSION/report outline | Delivery review | Final report, README and actual screenshots |

Evaluation mapping: quality 35% → FR3/4/7/9; input/research 30% → FR1/2/7 + catalog; reasoning 20% → FR5/6/warnings; documentation 15% → setup/report/evidence.
