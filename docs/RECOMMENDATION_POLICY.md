# Recommendation policy and cost scope

Release 0.8.0 distinguishes a known integration with incomplete evidence from an actual architecture conflict. The problem statement permits critically flagged recommendations when hard constraints cannot be fully established.

## Provisional integrations

MSG91 OTP, Razorpay Checkout for India payments, Stripe Checkout for other reviewed country requests, and existing Entra tenant federation are real integration choices. A required external residency boundary without sufficient project evidence produces `ok_with_warnings`, a stack, critical warning(s), explicit reduced-assurance assumptions and pre-production review tasks. It does not approve those flows or certify that the original hard requirement has been met. Existing input constraints are preserved in the report; the external exception is named.

Actual conflicts remain blocking: external runtime services in an air gap/restricted deployment, incompatible clients/drivers/providers, unsupported regional core mappings, contradictory RBI/EU policy, missing indispensable identity scope, unsupported ML sizing and invalid input/model bounds. A stronger preference cannot erase a conflict or a critical warning.

## Product choices

- India payment requests propose Razorpay Checkout. Merchant eligibility, localization, webhook signatures, refunds, payouts, taxes and exact pricing remain scoped review work. Checkout does not by itself implement lending, KYC, a ledger or disbursal/EMI mandates.
- Phone OTP proposes MSG91 plus a custom Keycloak integration. It is not mislabeled as built-in SMS/TOTP support, and geography/delivery/contract scope stays critically qualified where residency is requested.
- Existing Microsoft identity proposes direct application OIDC/SAML federation with Entra. A separate Keycloak broker is not automatically deployed. Tenant data boundaries and license entitlement are not inferred from application hosting.
- Missing HIPAA cloud BAA evidence is a critical pre-production condition on a provisional design. Missing access-control scope or structural incompatibility can still block it.

Sources: [Razorpay integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/), [Razorpay pricing](https://razorpay.com/pricing/), [MSG91 OTP](https://docs.msg91.com/otp), [Entra OIDC](https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc). Product capability is distinct from contract/residency approval.

## Infrastructure and activity costs

`estimated_monthly_cost_usd` and budget ranking cover infrastructure/operations, identified by `estimated_cost_scope: infrastructure_and_operations`. `cost_groups` separately reconciles the headline infrastructure total and additional payment/SMS activity scenarios. `cost_breakdown` itemizes both; adding every row gives a broader scenario total, not the headline infrastructure figure. Fee assumptions are visible and do not become known expenditure merely because they are numeric.

Peak WebSocket capacity is counted once in the replica floor. Auth, workers and telemetry retain their disclosed allocations. Duty-cycle, rate and database/storage proxies still create uncertainty; local reference workload measurements are not used to manufacture production capacity claims. Sensitivity reports identify the affected cost category, so fee changes do not masquerade as infrastructure-budget changes.

All six public inputs now receive stacks: P1 `ok`, P2–P6 `ok_with_warnings`. P2/P4/P5/P6 include critical conditions. P2 and P5 remain over budget even at the lower infrastructure estimate. The policy improves proposal coverage without pretending every original constraint is verified or every budget can be met.
