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
    .map((w, index) => {
      const auth = w.fields.includes('requirements.auth');
      const payment = w.fields.includes('requirements.payments');
      let evidence: [string, ...string[]] = [
        'Exact product/version, region, network path, stored/processed data, backups/logs and supporting primary evidence.',
      ];
      let components: [string, ...string[]] = ['complete deployment'];
      let ids: string[] = [];
      let next =
        'Review the scoped catalog evidence, workload and configuration; resolve the condition and rerun the unchanged input.';
      if (w.code === 'EXTERNAL_RESIDENCY_UNVERIFIED') {
        components = auth
          ? ['phone delivery', 'identity broker']
          : payment
            ? ['hosted checkout', 'payment webhooks']
            : ['external service'];
        ids = auth
          ? ['msg91-privacy']
          : payment
            ? ['razorpay-checkout', 'razorpay-privacy']
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
        if (w.message.includes('Supabase')) {
          components = auth
            ? ['Supabase regional identity', 'application JWT boundary']
            : ['Supabase regional project service'];
          ids = auth
            ? ['supabase-price', 'supabase-sms-hook', 'supabase-regions']
            : [
                'supabase-price',
                'supabase-regions',
                ...(w.fields.includes('requirements.file_media_storage')
                  ? ['supabase-storage']
                  : ['supabase-realtime']),
              ];
          evidence = [
            `Product-specific ${s.infrastructure.data_residency} storage AND processing, logs, backups, control plane, support and subprocessor evidence; project-region placement alone is insufficient.`,
            auth
              ? 'Review JWT claims/session policies, signed custom SMS hook and delivery partner scope; configure separately reviewed mail recovery if required.'
              : 'Review private bucket/channel access, retention/deletion, direct upload or message fan-out, file backup and restore behavior.',
          ];
        } else if (!auth && !payment) {
          evidence = [
            `Service-specific ${s.infrastructure.data_residency} processing, stored data, logs, backups, support and subprocessor scope, plus contractual/configuration evidence.`,
          ];
        }
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
        w.code === 'AZURE_STANDARD_SCOPE_UNVERIFIED' ||
        w.code === 'EXISTING_DATABASE_SCOPE_UNVERIFIED'
      ) {
        components = [
          'regional App Service',
          'existing SQL Server private integration',
        ];
        ids = [
          'azure-app-network',
          'azure-app-scope',
          'azure-b1-india-price',
          'sql2019-lifecycle',
        ];
        evidence = [
          'B1 Central India SKU/quota and tenant-specific metadata/control-plane/log/backup geography; do not apply ASE assurances to Basic.',
          'Approved VNet/subnet/private DNS, existing site-to-site VPN or ExpressRoute, on-premises firewall/TLS/identity and SQL edition/license/spare-capacity evidence.',
          'Connection failure, recovery, SQL transaction/pool latency and restore tests; itemized network/operations quote beyond the disclosed allowance.',
        ];
        next =
          'Validate the actual tenant/network path and tariff scope, configure region-pinned storage/logging, then run the integration and failover tests before accepting the qualified deployment.';
      } else if (w.code === 'GDPR_CROSS_BORDER_REVIEW' || w.code === 'GDPR_DATA_FLOW_REVIEW') {
        components = ['compute/database geography', 'processor/subprocessor boundaries'];
        ids = ['gdpr', 'gdpr-transfers'];
        evidence = [
          'Configured compute/database, CDN, logs, backup, identity, support and remote-access locations; identify every EU/EEA personal-data transfer.',
          'Executed applicable processor DPAs and a scoped Chapter V mechanism (applicable adequacy decision or SCCs/other safeguards), including transfer assessment and supplementary measures where required.',
        ];
        next = 'Review the complete processing chain and contracts before production; prefer reviewed EU placement without changing explicit residency or provider requirements. An EU region is not compliance certification.';
      } else if (w.code === 'ARCHIVE_INTEGRATION_UNVERIFIED') {
        components = ['background worker', 'regional log/file archive'];
        ids = [
          'do-spaces-regions',
          'do-spaces-price',
          'otel-s3-export',
          'do-app-runtime',
        ];
        evidence = [
          'Pinned alpha exporter or reviewed S3 SDK with TLS, least-privilege bucket credentials and explicit blr1/fra1/nyc3 endpoint; no global CDN for the private archive.',
          'Synthetic export/restore drill covering retries, duplicate IDs, partial uploads, worker restart, disk/memory backpressure and retention/deletion.',
          'Measured log bytes, object version churn, backup download/restore counts, shared-worker peak memory and end-to-end delivery alerts; reconcile both provider transfer meters.',
        ];
        next =
          'Implement the regional archive boundary and run the synthetic failure/restore drill. The estimate is not proof that the archive exists or survives failures.';
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
        id: `${w.code}:${w.fields.join('|')}:${index}`,
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
          'This checklist is a pre-production review gate, not approval. A provisional stack remains critically qualified until scoped evidence and configuration resolve the issue; a free-text assertion does not verify residency or compliance.',
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
