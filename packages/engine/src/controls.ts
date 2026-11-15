import type { NormalizedScenario, Warning } from '../../contracts/src/index.js';
import type { Policies } from '../../catalog/src/services.js';
import type { CorePlan } from './types.js';
import { hasReviewedEuLocations } from './gdpr.js';
import type { ControlPlan, SupportResult } from './complete-types.js';
const frameworkIds: Record<string, string> = {
  gdpr: 'gdpr',
  dpdp: 'dpdp',
  hipaa: 'hipaa',
  pci_dss: 'pci',
  rbi_localisation: 'rbi',
  soc2: 'soc',
  iso27001: 'iso',
};
export function controlPlan(
  s: NormalizedScenario,
  plan: CorePlan,
  support: SupportResult,
  p: Policies,
): ControlPlan {
  const result: ControlPlan = {
    frameworks: [],
    deployment_controls: [
      'TLS at all client/service/database boundaries.',
      'Least-privilege service identities, secret rotation, encryption at rest and redacted audit logs.',
      'Explicit regional primary/replica/storage/log/backup locations and retention; no uncontrolled cross-region replication.',
      'Restore-test backups and test negative authorization, tenant boundaries and deletion workflows.',
    ],
    warnings: [],
    blockers: [],
  };
  const block = (code: string, message: string, fields: string[]) =>
    result.blockers.push({ code, severity: 'critical', message, fields });
  if (plan.database.service_bundle) {
    result.warnings.push({
      code: 'MANAGED_TIER_CAPACITY_REVIEW',
      severity: 'critical',
      message:
        'This paid managed tier is a planning proposal, not validated capacity or an availability SLA. Validate pool limits, concurrent clients, CPU/memory, backup restore and the requested p95/availability before deployment; no automatic HA replicas are assumed.',
      fields: [
        'scale.peak_concurrent_users',
        'requirements.availability',
      ].filter(
        (path) =>
          path !== 'scale.peak_concurrent_users' ||
          s.scale.peak_concurrent_users !== undefined,
      ),
    });
    if (s.infrastructure.data_residency !== 'none')
      result.warnings.push({
        code: 'MANAGED_BOUNDARY_RESIDENCY_REVIEW',
        severity: 'critical',
        message:
          'Only regional application/project placement is reviewed. Supabase/Neon and hosting CDN, control plane, logs, support, backups and network processing do not have verified end-to-end residency; resolve this explicit provisional boundary before production.',
        fields: ['infrastructure.data_residency'],
      });
  }
  if (plan.hosting.id === 'do-app')
    result.warnings.push({
      code: 'ARCHIVE_INTEGRATION_UNVERIFIED',
      severity: 'critical',
      message:
        'The proposed regional log/file archive requires an implemented, pinned and tested S3-compatible exporter/SDK, IAM, retry/backpressure, deletion retention and restore workflow. The reviewed OpenTelemetry S3 exporter is alpha; no durable local worker disk, indexed log search, archive delivery or successful restore is assumed verified. Shared one-GiB container capacity and end-to-end availability remain unmeasured.',
      fields: ['requirements.availability', 'requirements.file_media_storage'],
    });
  if (plan.hosting.id === 'appservice-india')
    result.warnings.push({
      code: 'AZURE_STANDARD_SCOPE_UNVERIFIED',
      severity: 'critical',
      message:
        'Central India B1 application placement is reviewed, but standard App Service metadata, control plane, logs, backups and support processing do not inherit ASE in-region assurance. Existing SQL private routes, tenant scope, network/edition charges and capacity remain unverified. Resolve this explicit provisional residency/network exception before production.',
      fields: [
        'infrastructure.data_residency',
        'infrastructure.existing_systems',
      ],
    });
  if (plan.database_existing) {
    result.warnings.push({
      code: 'EXISTING_DATABASE_SCOPE_UNVERIFIED',
      severity: 'critical',
      message:
        'Reuse the existing SQL Server provisionally. Its physical geography, reachable private network, capacity, backups, edition/license entitlement and restore compatibility are not established; no India location, free license or migration is assumed.',
      fields: [
        'infrastructure.existing_systems',
        'infrastructure.data_residency',
      ],
    });
  }
  if (s.compliance.includes('gdpr')) {
    const eu = hasReviewedEuLocations(plan);
    result.warnings.push({
      code: eu ? 'GDPR_DATA_FLOW_REVIEW' : 'GDPR_CROSS_BORDER_REVIEW',
      severity: 'critical',
      message: eu
        ? 'Reviewed EU primary compute and database placement is preferred, but does not establish GDPR compliance or end-to-end EU processing. Execute applicable processor DPAs; map CDN, identity, logs, backups, support and subprocessors. Any EU/EEA personal-data transfer needs a valid Chapter V mechanism and scope-specific review before production.'
        : 'Primary compute/database placement is non-EU or unverified. Before processing GDPR personal data, execute applicable processor DPAs and establish a valid Chapter V transfer mechanism for EU/EEA transfers (including EU-US flows), such as an applicable adequacy decision or SCCs with transfer assessment and supplementary measures where needed. No transfer mechanism, vendor eligibility or agreement is assumed; review CDN, identity, logs, backups, support and subprocessors before production.',
      fields: ['compliance', 'infrastructure.data_residency'],
    });
    result.deployment_controls.push(
      'GDPR: configure declared EU locations where available; review processor DPAs, subprocessors, remote access and all processing/backup/log flows. Non-EEA transfers require a validated Chapter V mechanism; location alone is not compliance.',
    );
  }
  for (const label of s.compliance) {
    const framework = p.frameworks.find(
      (item) => item.id === frameworkIds[label],
    );
    if (!framework) {
      block(
        'CONTROL_COVERAGE_GAP',
        `No control design recorded for ${label}.`,
        ['compliance'],
      );
      continue;
    }
    result.frameworks.push(structuredClone(framework));
    if (
      label === 'hipaa' &&
      (!['on_premise', 'air_gapped'].includes(
        s.infrastructure.deployment_model,
      ) ||
        support.components.some((item) => item.placement === 'external'))
    )
      result.warnings.push({
        code: 'BAA_EVIDENCE_REQUIRED',
        severity: 'critical',
        message:
          'Provisional design only: HIPAA cloud/external services require eligible-service scope and an executed BAA before handling health data. Neither is assumed or approved by this recommendation.',
        fields: ['compliance', 'infrastructure.deployment_model'],
      });
    if (label === 'hipaa' && s.requirements.auth === 'none')
      block(
        'HEALTH_IDENTITY_SCOPE_REQUIRED',
        'Health-data access control cannot be established without an identity/access scope; clarify the access boundary.',
        ['compliance', 'requirements.auth'],
      );
    if (label === 'pci_dss' && !s.requirements.payments)
      block(
        'PAYMENT_SCOPE_UNSPECIFIED',
        'PCI scope without a specified payment flow cannot be approved by assuming no card data.',
        ['compliance', 'requirements.payments'],
      );
    if (
      label === 'rbi_localisation' &&
      s.infrastructure.data_residency !== 'india'
    )
      block(
        'RBI_REGION_CONFLICT',
        'The requested RBI policy needs an India payment-data configuration; the effective residency must be India.',
        ['compliance', 'infrastructure.data_residency'],
      );
  }
  if (result.frameworks.length)
    result.warnings.push({
      code: 'COMPLIANCE_IMPLEMENTATION_REVIEW',
      severity: 'warning',
      message:
        'The output proposes technical control designs only. It does not certify compliance, establish legal applicability, execute contracts, or replace an audit. Implement controls and obtain scope-specific review.',
      fields: ['compliance'],
    });
  if (s.requirements.availability !== '99')
    result.warnings.push({
      code: 'AVAILABILITY_TARGET_UNVERIFIED',
      severity: 'warning',
      message: `${s.requirements.availability}% is a target, not a product guarantee. The cost model provisions redundancy assumptions; service terms, failover and workload behavior still require verification.`,
      fields: ['requirements.availability'],
    });
  else
    result.warnings.push({
      code: 'FREE_TIER_OR_DEPLOYMENT_LIMITS',
      severity: 'info',
      message:
        'Availability and build/usage limits must still be checked for the configured deployment; no SLA is inferred from the product name.',
      fields: ['requirements.availability'],
    });
  if (s.requirements.p95_latency_ms !== null)
    result.warnings.push({
      code: 'LATENCY_TARGET_UNVERIFIED',
      severity: 'warning',
      message: `No measured evidence establishes the ${s.requirements.p95_latency_ms} ms p95 target; load-test the complete client/network/data path.`,
      fields: ['requirements.p95_latency_ms'],
    });
  if (s.team.size <= 2 && !s.team.has_devops && plan.hosting.operations >= 4)
    result.warnings.push({
      code: 'OPERATIONS_SKILL_GAP',
      severity: 'warning',
      message:
        'Requested self-operated infrastructure needs patching, backups and on-call capacity absent from the stated DevOps capability.',
      fields: [
        'team.size',
        'team.has_devops',
        'infrastructure.deployment_model',
      ],
    });
  if (
    s.timeline.mvp_weeks <= 4 &&
    (s.project.platforms.length > 1 || support.components.length > 4)
  )
    result.warnings.push({
      code: 'TIMELINE_RISK',
      severity: 'warning',
      message:
        'The short MVP window conflicts with multiple client/service integrations; no features have been silently removed.',
      fields: ['timeline.mvp_weeks', 'project.platforms', 'requirements'],
    });
  if (s.infrastructure.existing_systems.length)
    result.warnings.push({
      code: 'EXISTING_SYSTEM_REVIEW',
      severity: 'warning',
      message:
        'Legacy reuse requires version/EOL, license, network, schema and identity integration checks; no migration or connectivity is assumed verified.',
      fields: ['infrastructure.existing_systems'],
    });
  return result;
}

export function existingLifecycleWarnings(
  s: NormalizedScenario,
  p: Policies,
): Warning[] {
  const result: Warning[] = [];
  for (const item of p.lifecycle) {
    const found = s.infrastructure.existing_systems.filter((system) =>
      new RegExp(item.pattern, 'i').test(system),
    );
    if (found.length)
      result.push({
        code: 'EXISTING_TECH_EOL',
        severity: 'warning',
        message: `${item.product} upstream support ended ${item.ended}; found in ${found.join('; ')}. Do not retain it as the recommended production runtime. Plan migration/isolation and review compatibility. Evidence: ${item.source_ids.map((id) => p.sources.find((source) => source.id === id)!.url).join(', ')}`,
        fields: ['infrastructure.existing_systems'],
      });
  }
  return result;
}
