# Flow diagrams

These describe planned behavior. Mermaid source files can be edited independently; rendered versions follow.

## User Journey

[Editable source](01-user-journey.mmd)

```mermaid
flowchart TD
  A[Start] --> B{Input method}
  B --> C[Fill guided form]
  B --> D[Import JSON]
  B --> E[Load public sample]
  D --> F[Parse and validate container]
  F -->|Error| G[Show parse or size error]
  G --> D
  F --> H[Review fields and defaults]
  C --> H
  E --> H
  H --> I[Run recommendation]
  I --> J{Result status}
  J -->|invalid_input| K[Show field errors]
  K --> H
  J -->|infeasible| L[Show conflicting constraints]
  J -->|ok or ok_with_warnings| M[Show stack and reasoning]
  L --> N[Edit inputs]
  M --> N
  N --> O[Mark previous result stale]
  O --> H
  L --> P[Export result JSON]
  M --> P
```

## Engine Pipeline

[Editable source](02-engine-pipeline.mmd)

```mermaid
flowchart TD
  A[Raw scenario] --> B[Schema validation]
  B -->|Invalid| C[invalid_input and null stack]
  B -->|Valid| D[Defaults with provenance]
  D --> E[Derive features and conflicts]
  E --> F[Filter deployment variants]
  F --> G[Score candidates]
  G --> H[Search compatible full plans]
  H --> I{Search outcome}
  I -->|No feasible plan proven| J[infeasible and critical warnings]
  I -->|Search limit or internal failure| K[Internal error, not infeasible]
  I -->|Plan found| L[Attach services and estimate costs]
  L --> M[Recheck constraints and budget]
  M --> N[Select with stable tie-breaks]
  N --> O[Generate explanation from evidence]
  O --> P[Validate output and invariants]
  P --> Q[ok or ok_with_warnings]
```

## Request Sequence

[Editable source](03-request-sequence.mmd)

```mermaid
sequenceDiagram
  actor User
  participant UI as Web UI
  participant API as Local API
  participant Engine as Shared Engine
  participant Catalog as Versioned Catalog
  User->>UI: Enter or import scenario
  UI->>UI: Show fields, defaults, errors
  User->>UI: Recommend
  UI->>API: POST /api/recommend
  API->>Engine: recommend(raw, context)
  Engine->>Catalog: Read immutable facts/rules
  Catalog-->>Engine: Data and versions
  Engine->>Engine: Validate, filter, score, plan, explain
  Engine-->>API: Canonical result
  API-->>UI: Result JSON
  UI-->>User: Status, choices, risks, assumptions
  User->>UI: Export
  UI-->>User: Exact result download
```

## Batch Evaluation

[Editable source](04-batch-evaluation.mmd)

```mermaid
flowchart TD
  A[Array input file] --> B[Parse and check limits]
  B -->|Container invalid| C[Report root error]
  B -->|Valid| D[For each item in input order]
  D --> E[Run shared engine]
  E --> F[Validate result contract]
  F --> G[Choose safe unique filename]
  G --> H[Atomic write or explicit overwrite error]
  H --> I{More items}
  I -->|Yes| D
  I -->|No| J[Summary and deterministic exit code]
```

## Ui State

[Editable source](05-ui-state.mmd)

```mermaid
stateDiagram-v2
  [*] --> Empty
  Empty --> Editing: Enter or import
  Editing --> Invalid: Validation errors
  Invalid --> Editing: Correct fields
  Editing --> Running: Submit
  Invalid --> Running: Submit corrected values
  Running --> Success: ok
  Running --> Warned: ok_with_warnings
  Running --> Infeasible: infeasible
  Running --> Invalid: invalid_input
  Running --> Failed: Transport or internal error
  Failed --> Running: Retry
  Success --> Stale: Edit inputs
  Warned --> Stale: Edit inputs
  Infeasible --> Stale: Edit inputs
  Stale --> Running: Rerun
  Stale --> Empty: Confirm reset
```
