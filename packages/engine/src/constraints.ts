import type { Entry, Catalog, Layer } from '../../catalog/src/index.js';
import type { NormalizedScenario } from '../../contracts/src/index.js';
import type { CorePlan, Features, Rejection, Style } from './types.js';
import { prefersEuForGdpr } from './gdpr.js';

export function candidateRejection(
  entry: Entry,
  scenario: NormalizedScenario,
  features: Features,
  style: Style,
): Rejection | null {
  const reject = (
    code: string,
    message: string,
    fields: string[],
  ): Rejection => ({
    layer: entry.layer,
    candidate_id: entry.id,
    code,
    message,
    fields,
  });
  if (entry.status !== 'active')
    return reject(
      'TECH_NOT_ACTIVE',
      `Catalog status ${entry.status} is not selectable.`,
      [],
    );
  if (entry.layer === 'frontend') {
    const targets = scenario.project.platforms.filter(
      (target) => target !== 'api_only',
    );
    if (targets.length === 0 && entry.id !== 'frontend-none')
      return reject(
        'FRONTEND_NOT_NEEDED',
        'API-only targets have no client UI requirement.',
        ['project.platforms'],
      );
    if (
      targets.length &&
      (entry.id === 'frontend-none' ||
        targets.some((target) => !entry.platforms!.includes(target)))
    )
      return reject(
        'PLATFORM_MISMATCH',
        'This reviewed frontend variant does not cover every client target.',
        ['project.platforms'],
      );
    if (style === 'static' && entry.rendering !== 'static')
      return reject(
        'RENDERING_MISMATCH',
        'Static content profile requires a reviewed static frontend variant.',
        ['project.type'],
      );
    if (style !== 'static' && entry.rendering === 'static')
      return reject(
        'STATIC_VARIANT_ONLY',
        'This catalog entry is reviewed only for static content, not a dynamic client.',
        ['project.type'],
      );
    if (
      scenario.requirements.seo_critical &&
      targets.includes('web') &&
      !['ssr', 'static'].includes(entry.rendering!)
    )
      return reject(
        'SEO_RENDERING_GAP',
        'This variant lacks a reviewed crawlable web-rendering configuration.',
        ['requirements.seo_critical', 'project.platforms'],
      );
  }
  if (
    entry.layer === 'backend' &&
    (style === 'static') !== (entry.runtime === 'none')
  )
    return reject(
      'BACKEND_REQUIREMENT',
      style === 'static'
        ? 'No application server is needed for this static profile.'
        : 'A backend is required for this application/API profile.',
      ['project.type', 'requirements.auth', 'requirements.realtime'],
    );
  if (entry.layer === 'database') {
    if ((entry.model !== 'none') !== features.databaseRequired)
      return reject(
        'PERSISTENCE_REQUIREMENT',
        features.databaseRequired
          ? 'Domain/features require a persistent application database.'
          : 'No server-side persistence need was inferred; avoid an unnecessary database.',
        ['project.type', 'requirements.auth', 'requirements.offline_support'],
      );
    if (features.ledger && !['relational', 'none'].includes(entry.model!))
      return reject(
        'LEDGER_MODEL_NOT_REVIEWED',
        'This catalog has no reviewed ledger design for this database variant; this is a coverage limit, not a claim of technical impossibility.',
        ['project.description'],
      );
  }
  if (entry.layer === 'hosting') {
    const infrastructure = scenario.infrastructure;
    if (!entry.deployments!.includes(infrastructure.deployment_model))
      return reject(
        'DEPLOYMENT_MISMATCH',
        'Hosting variant does not match the requested deployment model.',
        ['infrastructure.deployment_model'],
      );
    if (infrastructure.cloud_preference === 'none' && entry.provider !== 'none')
      return reject(
        'CLOUD_FORBIDDEN',
        'cloud_preference=none prohibits this public-cloud variant.',
        ['infrastructure.cloud_preference'],
      );
    if (
      !['any', 'none'].includes(infrastructure.cloud_preference) &&
      infrastructure.cloud_preference !== entry.provider
    )
      return reject(
        'PROVIDER_MISMATCH',
        'Explicit cloud preference does not match this provider.',
        ['infrastructure.cloud_preference'],
      );
    if (
      infrastructure.data_residency !== 'none' &&
      !entry.regions!.some(
        (region) => region.residency === infrastructure.data_residency,
      )
    )
      return reject(
        'REGION_EVIDENCE_GAP',
        'No reviewed primary-compute region mapping satisfies the requested residency; no country location is inferred.',
        ['infrastructure.data_residency'],
      );
  }
  return null;
}
export function compatiblePlan(
  frontend: Entry,
  backend: Entry,
  database: Entry,
  hosting: Entry,
  style: Style,
  scenario: NormalizedScenario,
): { plan: CorePlan | null; reason: string } {
  if (
    !backend.databases!.includes(database.upstream_database_id ?? database.id)
  )
    return {
      plan: null,
      reason:
        'No reviewed backend/driver compatibility edge for this database.',
    };
  if (database.service_bundle && scenario.compliance.includes('hipaa'))
    return {
      plan: null,
      reason:
        'Reviewed entry is a low-cost tier without the required HIPAA contractual/service scope; choose an eligible contracted tier.',
    };
  if (
    database.service_bundle === 'supabase_pro' &&
    scenario.requirements.auth === 'enterprise_sso'
  )
    return {
      plan: null,
      reason:
        'This Supabase Pro profile does not review enterprise identity integration or its additional charges.',
    };
  if (
    hosting.id === 'vercel' &&
    (scenario.requirements.ml_features !== 'none' ||
      scenario.infrastructure.existing_systems.some((x) =>
        /sql\s+server/i.test(x),
      ) ||
      (scenario.requirements.realtime &&
        /collaborat|whiteboard|crdt|shared\s+canvas/i.test(
          scenario.project.description,
        )))
  )
    return {
      plan: null,
      reason:
        'Bounded Vercel functions profile does not cover resident inference, existing private SQL connectivity or persistent collaborative WebSocket servers.',
    };
  if (
    database.service_bundle === 'supabase_pro' &&
    typeof scenario.extensions?.retention_months === 'number'
  )
    return {
      plan: null,
      reason:
        'Explicit month-based database retention exceeds this Pro seven-day included-backup profile; use another reviewed plan.',
    };
  if (
    hosting.id === 'do-app' &&
    (database.service_bundle !== 'supabase_pro' ||
      scenario.requirements.ml_features !== 'none' ||
      (scenario.requirements.realtime &&
        (scenario.project.type === 'realtime_collab' ||
          /whiteboard|collaborative\s+editing|live\s+cursors/i.test(
            scenario.project.description,
          ))))
  )
    return {
      plan: null,
      reason:
        'Bounded App Platform profile requires Supabase persistence and does not review resident ML or collaborative Yjs sizing.',
    };
  const runtimes = [backend.runtime!, frontend.runtime!];
  if (runtimes.some((runtime) => !hosting.runtimes!.includes(runtime)))
    return {
      plan: null,
      reason: 'Host does not cover all backend and SSR runtimes.',
    };
  if (frontend.platforms!.includes('web') && !hosting.static_assets)
    return {
      plan: null,
      reason: 'No reviewed web asset delivery on this host.',
    };
  const existingDatabase =
    scenario.infrastructure.deployment_model !== 'air_gapped' &&
    database.id === 'sqlserver' &&
    scenario.infrastructure.existing_systems.some((system) =>
      /\bsql\s+server\b/i.test(system),
    );
  // GDPR without an explicit residency is a placement preference, never an
  // invented residency input. Only choose EU when both reviewed data locations
  // can be placed there. Retain other feasible plans for critical review.
  const euCompute = hosting.regions?.some((item) => item.residency === 'eu');
  const euDatabase = database.model === 'none' ||
    (!existingDatabase &&
      (scenario.infrastructure.deployment_model === 'managed_cloud'
        ? hosting.managed_databases?.some((item) =>
            item.database_id === database.id &&
            item.regions.some((region) => region.residency === 'eu'))
        : database.self_hosted && hosting.persistent_volume));
  const preferEu = prefersEuForGdpr(scenario) && euCompute && euDatabase;
  const residency = preferEu ? 'eu' :
    scenario.infrastructure.data_residency === 'none'
      ? (hosting.default_residency ?? 'none')
      : scenario.infrastructure.data_residency;
  const region =
    residency === 'none'
      ? (hosting.fixed_region ?? null)
      : (hosting.regions!.find((item) => item.residency === residency)
          ?.region ?? null);
  let databaseDeployment = 'None';
  let databaseRegion: string | null = null;
  if (database.model !== 'none') {
    if (
      existingDatabase &&
      !['air_gapped'].includes(scenario.infrastructure.deployment_model)
    ) {
      databaseDeployment =
        'Existing on-premises SQL Server; private application integration, not an assumed migration';
    } else if (
      hosting.deployments!.includes('managed_cloud') &&
      scenario.infrastructure.deployment_model === 'managed_cloud'
    ) {
      const managed = hosting.managed_databases!.find(
        (item) => item.database_id === database.id,
      );
      if (!managed)
        return {
          plan: null,
          reason:
            'No reviewed separately managed database product for this host/provider.',
        };
      if (residency !== 'none' || hosting.fixed_region) {
        databaseRegion =
          managed.regions.find((item) =>
            residency === 'none'
              ? item.region === hosting.fixed_region
              : item.residency === residency,
          )?.region ?? null;
        if (!databaseRegion)
          return {
            plan: null,
            reason:
              'Managed database has no reviewed primary-region mapping for requested residency.',
          };
      }
      databaseDeployment = managed.choice;
    } else {
      if (!database.self_hosted || !hosting.persistent_volume)
        return {
          plan: null,
          reason:
            'Self-hosted database needs a reviewed persistent volume and self-hostable engine.',
        };
      databaseDeployment = `Self-hosted ${database.name} on provisioned persistent storage`;
      databaseRegion = region;
    }
  }
  const id = [
    style,
    frontend.id,
    backend.id,
    database.id,
    hosting.id,
    region ?? 'unspecified',
  ].join('|');
  return {
    plan: {
      id,
      style,
      frontend,
      backend,
      database,
      hosting,
      primary_region: region,
      database_deployment: databaseDeployment,
      database_region: databaseRegion,
      database_existing: existingDatabase,
    },
    reason: '',
  };
}
export function domains(
  catalog: Catalog,
  scenario: NormalizedScenario,
  features: Features,
  style: Style,
): { values: Record<Layer, Entry[]>; rejections: Rejection[] } {
  const values: Record<Layer, Entry[]> = {
    frontend: [],
    backend: [],
    database: [],
    hosting: [],
  };
  const rejections: Rejection[] = [];
  for (const entry of catalog.entries) {
    const rejection = candidateRejection(entry, scenario, features, style);
    if (rejection) rejections.push(rejection);
    else values[entry.layer].push(entry);
  }
  for (const entries of Object.values(values))
    entries.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  rejections.sort((a, b) =>
    a.candidate_id < b.candidate_id
      ? -1
      : a.candidate_id > b.candidate_id
        ? 1
        : a.code < b.code
          ? -1
          : a.code > b.code
            ? 1
            : 0,
  );
  return { values, rejections };
}
