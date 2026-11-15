import type { NormalizedScenario, Warning } from '../../contracts/src/index.js';
import type { Policies, ServiceProfile } from '../../catalog/src/services.js';
import type { CorePlan, Features } from './types.js';
import type { SupportResult, SupportingComponent } from './complete-types.js';

export function selectSupporting(
  plan: CorePlan,
  s: NormalizedScenario,
  f: Features,
  p: Policies,
): SupportResult {
  const result: SupportResult = {
    components: [],
    warnings: [],
    blockers: [],
    assumptions: [],
    data_flows: [],
  };
  const provider = plan.hosting.provider!;
  const databaseId = plan.database.upstream_database_id ?? plan.database.id;
  const bundled = plan.database.service_bundle === 'supabase_pro';
  const functions = plan.hosting.id === 'vercel';
  const restricted = ['on_premise', 'air_gapped'].includes(
    s.infrastructure.deployment_model,
  );
  const region = s.infrastructure.data_residency;
  const fail = (code: string, message: string, fields: string[]) =>
    result.blockers.push({ code, severity: 'critical', message, fields });
  function add(
    profile: ServiceProfile,
    fields: [string, ...string[]],
    reason: string,
  ): void {
    if (
      profile.database_ids.length &&
      !profile.database_ids.includes(databaseId)
    ) {
      fail(
        'SERVICE_DATABASE_MISMATCH',
        `${profile.choice} has no reviewed integration with ${plan.database.name}.`,
        fields,
      );
      return;
    }
    if (
      profile.frontend_ids.length &&
      !profile.frontend_ids.includes(plan.frontend.id)
    ) {
      fail(
        'SERVICE_CLIENT_MISMATCH',
        `${profile.choice} has no reviewed integration for ${plan.frontend.name}.`,
        fields,
      );
      return;
    }
    if (profile.providers.length && !profile.providers.includes(provider)) {
      fail(
        'SERVICE_PROVIDER_MISMATCH',
        `${profile.choice} does not match provider ${provider}.`,
        fields,
      );
      return;
    }
    if (
      profile.placement === 'host' &&
      profile.compute_units > 0 &&
      ['pages', 'vercel'].includes(plan.hosting.id)
    ) {
      fail(
        functions ? 'FUNCTION_RESIDENT_RUNTIME_GAP' : 'STATIC_HOST_RUNTIME_GAP',
        `${profile.choice} needs an application runtime absent from this static host variant.`,
        fields,
      );
      return;
    }
    if (profile.placement === 'external' && restricted) {
      fail(
        'RESTRICTED_EXTERNAL_SERVICE',
        `${profile.choice} requires an external service unavailable under the restricted deployment policy.`,
        ['infrastructure.deployment_model', ...fields],
      );
      return;
    }
    if (profile.placement === 'external' && region !== 'none') {
      result.warnings.push({
        code:
          profile.id === 'entra'
            ? 'EXISTING_IDENTITY_SCOPE_UNVERIFIED'
            : 'EXTERNAL_RESIDENCY_UNVERIFIED',
        severity: 'critical',
        message: `${profile.choice} is proposed provisionally: end-to-end ${region} data residency is NOT established. Verify tenant/merchant eligibility, processing, logs, backups, delivery partners and contracts before production. This warning is an explicit exception to verified residency, not approval.`,
        fields: ['infrastructure.data_residency', ...fields],
      });
      result.assumptions.push(
        `PROVISIONAL RESIDENCY EXCEPTION: ${profile.choice} remains in the proposed stack without verified end-to-end ${region} geography. Scope of assurance excludes this external boundary; retain the requested application/database region and resolve or explicitly accept this critical risk before production.`,
      );
    }
    result.components.push({
      layer: profile.layer,
      service_id: profile.id,
      choice: profile.choice,
      capabilities: [profile.capability],
      placement: profile.placement,
      source_ids: [...profile.source_ids],
      incremental_compute_units: profile.compute_units,
      justification:
        `${reason} ${profile.placement === 'host' ? 'Deploy in the same reviewed compute/data region; explicit configuration is required.' : ''}`.trim(),
      driven_by: fields,
      alternatives: [{ choice: profile.alternative, why_not: profile.why_not }],
      tradeoffs: [profile.tradeoffs[0]!, ...profile.tradeoffs.slice(1)],
    });
    result.data_flows.push({
      component: profile.id,
      location:
        profile.id === 'do-archive'
          ? `Application ${plan.primary_region}; explicitly configure Spaces ${plan.primary_region === 'blr' ? 'blr1' : plan.primary_region === 'fra' ? 'fra1' : 'nyc3'} regional archive (end-to-end scope unverified)`
          : profile.placement === 'external'
            ? 'External service geography not established'
            : profile.placement === 'device'
              ? 'User device local storage'
              : profile.placement === 'build'
                ? 'Build environment: source/synthetic fixtures only'
                : (plan.primary_region ??
                  'Selected deployment region (must be chosen before provisioning)'),
      scope:
        profile.placement === 'build'
          ? 'Never export production data/secrets/personal data to build logs.'
          : profile.tradeoffs.join(' '),
      verification:
        profile.placement === 'external'
          ? 'external_scope_review'
          : profile.placement === 'build'
            ? 'source_only_no_production_data'
            : 'configuration_required',
    });
  }
  if (provider === 'digitalocean' && f.collaborative)
    fail(
      'APP_PLATFORM_PROFILE_GAP',
      'This bounded paid profile has no reviewed Yjs memory/replication sizing; use another complete candidate.',
      ['requirements.realtime', 'project.type'],
    );
  const get = (id: string) => {
    const profile = p.services.find((item) => item.id === id);
    if (!profile) throw new Error(`Missing required service profile ${id}`);
    return profile;
  };
  if (s.requirements.auth !== 'none') {
    const existingEntra =
      s.requirements.auth === 'enterprise_sso' &&
      s.infrastructure.existing_systems.some((system) =>
        /entra|azure\s+ad|microsoft\s*365/i.test(system),
      );
    add(
      get(existingEntra ? 'entra' : bundled ? 'supabase-auth' : 'keycloak'),
      ['requirements.auth'],
      existingEntra
        ? 'Integrate the existing Microsoft Entra tenant directly using application OIDC/SAML middleware; do not migrate passwords or add an unnecessary identity broker.'
        : bundled
          ? 'Use regional Supabase Auth and verify JWT/authorization in the application; configure a signed Send SMS hook for phone delivery.'
          : `Authentication method ${s.requirements.auth} uses a separate Keycloak realm/schema and least-privilege database identity.`,
    );
    if (s.requirements.auth === 'phone_otp')
      add(
        get('msg91'),
        ['requirements.auth'],
        bundled
          ? 'Phone delivery uses MSG91 through a custom signed Supabase Send SMS hook; implement retries, abuse limits and DLT/routing review.'
          : 'Phone delivery uses a provider OTP API; integrate a custom Keycloak authentication SPI rather than mislabeling TOTP as SMS.',
      );
    if (s.requirements.auth === 'social') {
      if (restricted)
        fail(
          'RESTRICTED_PUBLIC_IDENTITY',
          'Public social identity providers conflict with restricted deployment.',
          ['requirements.auth', 'infrastructure.deployment_model'],
        );
      if (region !== 'none')
        result.warnings.push({
          code: 'IDENTITY_RESIDENCY_UNVERIFIED',
          severity: 'critical',
          message:
            'Public social identity geography is unverified; this integration is provisional and requires provider-specific residency/transfer review before production.',
          fields: ['requirements.auth', 'infrastructure.data_residency'],
        });
      result.assumptions.push(
        'Social login brokers only necessary identity claims; choose an eligible provider, legal basis and transfer/contract arrangement before production.',
      );
      result.warnings.push({
        code: 'IDENTITY_PROVIDER_REVIEW',
        severity: 'warning',
        message:
          'Social provider selection and privacy/transfer terms need explicit review; Keycloak is only the local broker.',
        fields: ['requirements.auth', 'compliance'],
      });
    }
    if (s.requirements.auth === 'enterprise_sso')
      result.assumptions.push(
        'Enterprise identity integration assumes a reachable, eligible OIDC/SAML identity provider; verify tenant scopes, licenses and network paths before provisioning.',
      );
    if (s.requirements.auth === 'email_password')
      result.assumptions.push(
        'Email is an account identifier; external verification/reset mail is not enabled until an SMTP provider and its data scope/cost are reviewed. Administrative recovery is assumed initially.',
      );
  }
  if (s.requirements.realtime)
    add(
      get(f.collaborative ? 'yjs' : bundled ? 'supabase-realtime' : 'ws'),
      [
        'requirements.realtime',
        ...(f.collaborative ? ['project.description'] : []),
      ],
      f.collaborative
        ? 'Shared CRDT state and WebSocket transport cover concurrent editing; persist updates/snapshots in the application database.'
        : 'WebSocket transport provides live updates; enforce authorization, reconnects, shared state and backpressure.',
    );
  if (s.requirements.offline_support) {
    const profile =
      plan.style === 'static'
        ? get('workbox')
        : p.services.find(
            (item) =>
              item.capability === 'offline' &&
              item.frontend_ids.includes(plan.frontend.id),
          );
    if (profile)
      add(
        profile,
        ['requirements.offline_support', 'project.platforms'],
        plan.style === 'static'
          ? 'Precache public pages/assets for offline reads; no server-side sync is required.'
          : 'Persist edits/photos before transmission; enqueue durable operations with idempotency keys/version checks, retry/backoff and an explicit conflict policy.',
      );
    else
      fail(
        'OFFLINE_CLIENT_COVERAGE_GAP',
        'No reviewed device-local persistence/sync profile covers the selected client.',
        ['requirements.offline_support', 'project.platforms'],
      );
    if (
      plan.frontend.id === 'next-native' &&
      s.project.platforms.includes('web')
    )
      add(
        get('dexie'),
        ['requirements.offline_support', 'project.platforms'],
        'Web target needs its own IndexedDB persistence in addition to mobile SQLite.',
      );
    if (plan.style !== 'static')
      result.assumptions.push(
        'Offline sync uses versioned records and server-side idempotency; app-specific merge/rejection UX and resumable uploads must be implemented and tested.',
      );
  }
  if (s.requirements.full_text_search) {
    const profile = p.services.find(
      (item) =>
        item.capability === 'search' && item.database_ids.includes(databaseId),
    );
    if (profile)
      add(
        profile,
        ['requirements.full_text_search'],
        'Use reviewed database-native search before adding another operated search cluster.',
      );
    else
      fail(
        'SEARCH_COVERAGE_GAP',
        'No reviewed full-text profile for this database.',
        ['requirements.full_text_search'],
      );
  }
  if (s.requirements.multi_tenant)
    add(
      get('rls'),
      ['requirements.multi_tenant'],
      'Tenant isolation uses forced RLS plus application authorization, tenant-scoped keys and negative access tests.',
    );
  if (s.requirements.file_media_storage) {
    const id = bundled
      ? 'supabase-storage'
      : provider === 'gcp'
        ? 'gcs'
        : provider === 'aws'
          ? 's3'
          : provider === 'azure'
            ? 'azure-blob'
            : provider === 'none'
              ? 'local-storage'
              : null;
    if (id)
      add(
        get(id),
        ['requirements.file_media_storage'],
        'Private uploads use explicit regional storage, signed access and malware/content validation; preserve upload retries and retention policy.',
      );
    else
      fail(
        'OBJECT_STORAGE_COVERAGE_GAP',
        'No reviewed regional object-storage configuration for this provider.',
        ['requirements.file_media_storage', 'infrastructure.cloud_preference'],
      );
  }
  if (s.requirements.payments)
    add(
      get(region === 'india' ? 'razorpay' : 'stripe'),
      ['requirements.payments'],
      'Hosted checkout keeps raw payment credentials outside the application; verify webhook signatures, idempotency and merchant scope.',
    );
  if (s.requirements.payments && s.project.type === 'fintech') {
    result.warnings.push({
      code: 'FINTECH_PAYMENT_SCOPE_REVIEW',
      severity: 'critical',
      message:
        'Checkout is only the collection integration. Lending authorization, KYC, double-entry ledger controls, disbursal/payout product eligibility and EMI mandates require a separately scoped implementation and contractual review; no approval or complete lending product is implied.',
      fields: ['project.type', 'requirements.payments', 'compliance'],
    });
    result.assumptions.push(
      'Fintech scope exception: checkout/collection is proposed; lending, KYC, ledger and disbursal/mandate integrations are application and specialist-provider work, not fulfilled merely by selecting a payment gateway.',
    );
  }
  if (s.requirements.ml_features === 'inference_api') {
    add(
      get('onnx'),
      ['requirements.ml_features'],
      'Use a colocated CPU inference service with a versioned ONNX model; no external inference API data export is assumed.',
    );
    result.assumptions.push(
      'The inference model can be exported to ONNX and fits a CPU/2 GiB reference allocation; prediction parity, CPU/RAM and throughput need validation.',
    );
  } else if (s.requirements.ml_features !== 'none')
    fail(
      'ML_DEPLOYMENT_COVERAGE_GAP',
      `No reviewed model sizing/vector/GPU deployment for ${s.requirements.ml_features}; do not substitute generic CPU inference.`,
      ['requirements.ml_features'],
    );
  if (
    (s.requirements.offline_support && plan.style !== 'static') ||
    s.requirements.payments ||
    f.collaborative
  )
    add(
      get(functions ? 'vercel-outbox' : 'outbox'),
      [
        'requirements.offline_support',
        'requirements.payments',
        'requirements.realtime',
      ],
      functions
        ? 'Application and outbox writes commit atomically; an authenticated minute-scale scheduled function drains bounded batches with row locks, idempotency and dead letters. Test duration/concurrency/retry limits.'
        : 'Application and outbox writes commit atomically; a separately budgeted worker retries idempotently and records dead letters.',
    );
  if (plan.style !== 'static')
    add(
      get(
        functions
          ? 'vercel-telemetry'
          : provider === 'digitalocean'
            ? 'do-archive'
            : 'otel',
      ),
      ['requirements.availability'],
      'Collect redacted metrics/logs/traces with regional retention; on cloud use a configured host-provider regional log bucket, locally use provisioned persistent storage.',
    );
  add(
    get(
      plan.style === 'static'
        ? 'local-build'
        : restricted
          ? 'jenkins'
          : functions
            ? 'vercel-build'
            : provider === 'digitalocean'
              ? 'do-build'
              : 'actions',
    ),
    ['infrastructure.deployment_model'],
    'Build/test/deploy with pinned dependencies, synthetic fixtures and controlled secrets; production data does not enter the build service.',
  );
  if (provider === 'cloudflare')
    add(
      get('cdn'),
      ['project.type'],
      'Static delivery is part of the hosting bundle; do not count it as another resource bill.',
    );
  if (region !== 'none')
    result.assumptions.push(
      `All host/database/storage/log/backup configurations must use the reviewed ${region} region, no cross-region copies, private access and retention/deletion controls. Device data and explicit external identity/OTP/payment flows are assessed separately.`,
    );
  if (restricted)
    result.assumptions.push(
      'Existing local hardware, compatible operating system, persistent volumes and offline artifact/plugin mirrors are assumed; procurement and labor are outside infrastructure operating estimates.',
    );
  result.components.sort((a, b) =>
    a.service_id < b.service_id ? -1 : a.service_id > b.service_id ? 1 : 0,
  );
  return result;
}
