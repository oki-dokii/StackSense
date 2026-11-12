# Challenge interpretation

## What is being built

One recommendation engine, not six applications. It receives a structured software-project scenario and recommends frontend, backend, database, hosting, and relevant supporting services. Every recommendation must connect to inputs, compare alternatives, identify trade-offs, and estimate monthly cost.

The supplied JSON is an array of six input objects. It is neither a labeled training dataset nor a list of official expected stacks. Import must also accept one standard scenario object because judges use that interface for hidden cases. Never branch on project name or scenario ID to select a stack.

## Organiser requirements

- FR1–FR9: collect inputs; import JSON; choose four core components; add supporting services; explain; estimate cost; validate/report conflicts; export JSON; deterministic stack.
- Local setup in approximately 15 minutes; recommendation in approximately 10 seconds; no paid key dependency; any implementation language; web or CLI accepted.
- Hard constraints in §5.3: residency, compliance, deployment model, explicit cloud preference. Budget, timeline, and priorities are soft but any violation must be visible.
- LLMs only for user-confirmed input parsing or rewording existing explanations. Disabling all LLM calls must preserve stack selection. MVP omits LLMs.
- Knowledge base must be curated, sourced, and cover real maintained technologies. The FAQ's 6–8 options per core layer is guidance, not a strict minimum.
- Individual original work during the challenge window. AI coding tools allowed with disclosure; owner must own design/research. No fabricated screenshots, scenario-specific hard-coding, or post-deadline submission edits.

## Public scenarios

| ID | Project | Main distinguishing needs |
|---|---|---|
| P1 | DevFolio | Markdown portfolio/blog; $0; beginner solo; SEO; 2 weeks |
| P2 | FixIt Now | India marketplace; web/Android; chat, search, OTP, payments; $150 |
| P3 | BoardRoom | Collaborative whiteboard; 5,000 peak concurrent; 100 ms p95; multi-tenant; $1,500 |
| P4 | QuickCredit | AWS/India; lending, ledger, KYC, inference; multiple compliance labels; $6,000 |
| P5 | PeopleDesk | Internal HR; Azure; C#/SQL skills; Entra/SQL Server/M365 integration; $300 |
| P6 | KhetSurvey | Offline Android; unreliable network; photos; low-end devices; India; $100 |

These are constraints to reason about, not permission to claim a reference answer.

## Ambiguities and adopted interpretation

| Issue | Source conflict | Project interpretation |
|---|---|---|
| Budget | §5.3 soft, evaluation table calls it hard | Score affordability, but always warn on overruns; do not present an over-budget plan as unqualified `ok` |
| Missing required inputs | Edge table mentions defaults loosely | Required fields are errors; only optional fields receive documented defaults |
| Alternatives | Schema says at least one per core layer; abbreviated example has empty arrays | Enforce at least one per core component, including a justified `None` |
| Trade-offs | Output table optional, FR5/evaluation expect them | Require meaningful trade-offs for all selected components in our profile |
| Supporting layer `forms` in example | Not in supporting-layer enum | Use `other` with a descriptive component choice; retain official enum |
| No feasible candidate | Core schema expects stack, prose allows infeasible | Permit `stack: null` for infeasible and require critical warnings; never invent a valid-looking stack |
| Report pagination | Sections 1–10 ≤15 pages; section 11 separately listed | Aim to include AI declaration within the 15-page body; confirm if necessary |
| `cloud_preference: none` | Meaning not fully defined | Treat as no public-cloud dependency; flag conflict with managed-cloud deployment rather than assuming `any` |

Required input errors are not constraint conflicts: a negative budget is invalid input; a valid zero budget combined with expensive requirements may be infeasible.

## Schedule and evaluation

Release: 10 November 2026, 10:00 IST. Deadline: 15 November 2026, 23:59 IST. Weights: recommendation quality 35%, input/research 30%, reasoning 20%, documentation 15%. No online deployment required.
