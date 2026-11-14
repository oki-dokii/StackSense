import type { NormalizedScenario, Warning } from '../../contracts/src/index.js';
import type { Source } from '../../catalog/src/types.js';
import type { Policies } from '../../catalog/src/services.js';
import type {
  ReviewAction,
  IntegrationReview,
} from '../../contracts/src/recommendation.generated.js';
export type {
  ReviewAction,
  IntegrationReview,
} from '../../contracts/src/recommendation.generated.js';
const refs = (p: Policies, ids: string[]) =>
  ids
    .map((id) => p.sources.find((source) => source.id === id))
    .filter((source): source is Source => Boolean(source));
export function reviewActions(
  notices: Warning[],
  s: NormalizedScenario,
  p: Policies,
): ReviewAction[] {
  return notices
    .filter((w) => w.severity === 'critical')
    .map((w) => {
      const auth = w.fields.includes('requirements.auth');
      const payment = w.fields.includes('requirements.payments');
      let evidence: [string, ...string[]] = [
        'Exact product/version, region, network path, stored/processed data, backups/logs and supporting primary evidence.',
      ];
      let components: [string, ...string[]] = ['complete deployment'];
      let ids: string[] = [];
      let next =
        'Review the rejected constraints against the scoped catalog; add reviewed coverage and rerun the unchanged input.';
      if (w.code === 'EXTERNAL_RESIDENCY_UNVERIFIED') {
        components = auth
          ? ['phone delivery', 'identity broker']
          : payment
            ? ['hosted checkout', 'payment webhooks']
            : ['external service'];
        ids = auth
          ? ['msg91-privacy']
          : payment
            ? ['payment', 'razorpay-privacy']
            : [];
        evidence = auth
          ? [
              `Evidence covering ${s.infrastructure.data_residency} storage AND processing of phone numbers, message content, delivery records, backups and logs.`,
              'Country routing, telecom/subprocessor list, retention/deletion, support access and tenant-specific contract/configuration; an Indian endpoint is insufficient.',
              'SMS eligibility, sender/template registration, Keycloak custom authentication SPI and delivery tariff/volume review.',
            ]
          : [
              `Merchant- and product-specific ${s.infrastructure.data_residency} payment-data flow, including processors, card networks, webhooks, logs and backups.`,
              'Eligibility, settlement, retention, subprocessors and contract scope; distinguish domestic and international transactions.',
              'Hosted checkout/tokenization, signed idempotent webhooks, reconciliation and transaction/FX/refund fees.',
            ];
        next =
          'Request the scoped vendor data-flow and configuration evidence. Review a regional alternative without changing the original residency requirement.';
      } else if (
        w.code === 'EXISTING_IDENTITY_SCOPE_UNVERIFIED' ||
        w.code === 'IDENTITY_RESIDENCY_UNVERIFIED'
      ) {
        components = ['existing identity provider', 'identity broker'];
        ids = ['entra-residency', 'entra-oidc'];
        evidence = [
          'Tenant geography and service-specific storage/processing/replication evidence for identity, tokens, audit and support flows.',
          'OIDC/SAML endpoints, claims minimization, issuer/audience checks, admin consent, licenses and reachable network path.',
        ];
        next =
          'Ask the tenant owner for the identity boundary and connectivity details. Microsoft 365 content geography does not establish Entra identity residency.';
      } else if (
        w.code.includes('RESTRICTED') ||
        w.code === 'AIR_GAP_EXTERNAL_REQUIREMENT'
      ) {
        components = [
          'network boundary',
          ...(auth ? ['identity/phone delivery'] : []),
          ...(payment ? ['payments'] : []),
        ];
        evidence = [
          'An explicitly approved network boundary and integration path that preserves the requested deployment constraint.',
        ];
        next =
          'Resolve the external-flow/deployment conflict with the requirement owner. Rerun only after an explicit requirement revision or a reviewed compatible design.';
      } else if (w.code === 'CORE_CATALOG_COVERAGE_GAP') {
        components = ['frontend', 'backend', 'database', 'hosting'];
        next =
          'Inspect core_rejections. Review exact provider/runtime/database regional variants and driver compatibility; do not substitute a different cloud or region.';
      } else if (w.code === 'COST_MODEL_COVERAGE_GAP') {
        evidence = [
          'Reviewed workload quantities and rates within safely representable pricing bounds, plus a sizing/quote review for the expanded model.',
        ];
        next =
          'Validate the units and input magnitude, then extend the pricing model with independently reviewed examples. Do not clip quantities or invent a price.';
      } else if (
        w.fields.includes('compliance') &&
        w.code !== 'COMPLETE_PLAN_COVERAGE_GAP'
      ) {
        components = ['control design', 'contract scope'];
        evidence = [
          'Framework-specific required controls, contractual eligibility, implementation ownership and independently reviewed scope.',
        ];
        next =
          'Obtain the missing control/contract evidence and verify implementation; a vendor badge does not approve the application.';
      }
      const conflict =
        w.code.includes('RESTRICTED') ||
        w.code === 'AIR_GAP_EXTERNAL_REQUIREMENT';
      return {
        id: `${w.code}:${w.fields.join('|')}`,
        code: w.code,
        kind:
          w.code === 'COST_MODEL_COVERAGE_GAP'
            ? 'model_limit'
            : conflict
              ? 'constraint_conflict'
              : 'evidence_gap',
        fields: [...w.fields],
        affected_components: components,
        evidence_required: evidence,
        next_action: next,
        resolution_gate:
          'This checklist does not approve a design. Add scoped reviewed evidence/rules and rerun; missing evidence cannot be cleared by a free-text assertion.',
        references: refs(p, ids),
      };
    });
}
export function integrationReviews(
  s: NormalizedScenario,
  p: Policies,
): IntegrationReview[] {
  return s.infrastructure.existing_systems.map((system) => {
    const identity = /entra|azure\s+ad|microsoft\s*365/i.test(system);
    const sql = /sql\s*server/i.test(system);
    return {
      system,
      approach: identity
        ? 'federation_review'
        : sql
          ? 'database_reuse_review'
          : 'inventory_review',
      approval: 'pending_project_evidence',
      protocol: identity
        ? 'OIDC or SAML federation; no password migration assumed.'
        : sql
          ? 'TLS-protected SQL Server driver over an approved private network/VPN; no public database exposure assumed.'
          : 'Inventory the documented integration protocol before selecting an adapter.',
      data_boundary: identity
        ? 'Tenant identity, claims, tokens and audit flows are separate from application and Microsoft 365 content residency.'
        : sql
          ? 'Confirm whether this system remains the system of record; review read/write ownership, schema and transaction boundaries before reuse or migration.'
          : 'Identify the system of record, data classes, geography, owners and network trust boundaries.',
      cost_treatment:
        'No reuse savings, existing license entitlement or migration approval is inferred. The selected new application resources are priced separately; existing system operation, private connectivity, licenses and migration work need a project quote.',
      tasks: identity
        ? [
            'Record tenant ID/geography, issuer, audiences, allowed claims and retention.',
            'Verify tenant consent, license entitlements, reachable endpoints and failure/recovery behavior.',
            'Review identity data residency separately; changing the compute region does not resolve it.',
          ]
        : sql
          ? [
              'Confirm version/edition, patch level, licenses, spare capacity and support dates.' +
                (/\b2019\b/.test(system)
                  ? ' SQL Server 2019 extended support ends in January 2030; this is not an EOL finding.'
                  : ''),
              'Choose reuse, adapter or migration explicitly with the system owner; validate driver/schema compatibility and read/write ownership.',
              'Specify private DNS/routing/VPN, TLS trust, least-privilege accounts and credential rotation.',
              'Test latency, outages, backup/restore and reconciliation; obtain incremental connectivity/license/operations costs.',
            ]
          : [
              'Record product/version, owner and supported API/protocol.',
              'Review reachability, residency, access controls and incremental cost before approving integration.',
            ],
      references: refs(
        p,
        identity
          ? ['entra-residency', 'entra-oidc']
          : sql
            ? ['sql2019-lifecycle', 'azure-vnet-integration']
            : [],
      ),
    };
  });
}
