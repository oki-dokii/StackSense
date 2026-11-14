# Explaining the engine

StackSense searches compatible designs; it does not ask a language model for a stack.

1. **Validate the brief.** Ajv checks types, bounds and required fields. Normalization records optional defaults without rewriting the original input.
2. **Determine the architectural needs.** Platforms, persistence, SEO, realtime, offline use and other declared features constrain eligible components. Limited description hints remain explicitly disclosed.
3. **Search complete combinations.** Core candidates must have compatible clients, runtimes, drivers, provider/deployment mappings and reviewed primary regions. Supporting services are added before the complete plan is ranked.
4. **Separate conflicts from missing evidence.** An external payment service cannot operate in an air gap. That remains a blocking conflict. MSG91 having incomplete India data-flow evidence is different: it can be proposed with a critical warning and an explicit unverified-boundary assumption. The stack is provisional until that condition is resolved.
5. **Estimate quantities and costs.** The month-12 infrastructure model uses disclosed traffic, concurrency, duty-cycle and resource hypotheses. WebSocket concurrency is counted once. Payment and message fees have separate activity scenarios and an additional combined total; they do not alter the infrastructure budget comparison. Cloud Run support allocations have a full-month instance-based floor.
6. **Rank deterministically.** Six priorities weight explainable ordinal fits. Stable cost/operations/unused-client-targets/identifier tie-breaks select one complete design. A higher score cannot erase a warning or certify a deployment.
7. **Explain and export.** Each selection carries input drivers, alternatives and tradeoffs. Critical exceptions, source references, assumptions and review tasks remain visible. Decision Lab reruns actual alternatives and priorities without applying them.

## Examples to understand

- P1 is static: no dynamic backend or database should be added merely because the user count is large.
- P2 needs web/Android, SEO, realtime, search, OTP and payments. The design proposes Next.js + React Native, Django, PostgreSQL and Cloud Run, plus MSG91/Razorpay. The external India boundary is critically qualified; the USD 150 budget is not claimed to fit.
- P3's 5,000 peak connections do not justify billing a second parallel set of per-connection sidecars after the replica floor already accounts for them. That double count has been removed; the remaining duty and capacity assumptions still need measurement.
- P5 can use application OIDC/SAML middleware with the existing Entra tenant rather than running another identity broker. Tenant geography, licensing, SQL Server reuse and connectivity remain separate integration questions.
- An explicit air gap plus phone OTP/payment delivery is a real conflict. The tool returns infeasible instead of quietly selecting an Internet dependency.

## Questions to be ready to answer

- Which values are supplied, defaulted, inferred, assumed or still unknown?
- Why is a particular warning critical, and what evidence/configuration would resolve it?
- Why does a frontend/backend/database/host combination work together?
- How are resource quantities calculated, what is excluded, and why can a cost band remain wide?
- What does the score mean, how are ties broken, and what has actually been measured?
- Where does AI assistance end and participant responsibility for design decisions, knowledge-base review and reasoning begin?

The AI-assistance disclosure describes the actual development process. This walkthrough helps review the implementation; it is not a substitute for understanding or an assertion of unaided authorship.

Budget proposals are a separate bounded rerun. Inspect each field change and its consequences, apply them to a copy only if accepted, and rerun. The original selected plan, inputs and critical vendor conditions remain intact. Lowest cash cost does not prove capacity or availability.
