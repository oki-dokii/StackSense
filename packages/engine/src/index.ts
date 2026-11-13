import { describeCoreSelection } from './explanations.js';
import {
  defaultCatalog,
  assertCatalog,
  type Catalog,
  type Entry,
  type Layer,
} from '../../catalog/src/index.js';
import { normalizeScenario, compare } from '../../contracts/src/index.js';
import type {
  ValidationIssue,
  Warning,
  NormalizedScenario,
} from '../../contracts/src/index.js';
import { assertCoreReport } from './report-contract.js';
export { assertCoreReport } from './report-contract.js';
import { deriveFeatures } from './features.js';
import { searchCorePlans } from './planner.js';
import type {
  CorePlanningReport,
  PlanningContext,
  RankedPlan,
  Selection,
  Features,
} from './types.js';
export * from './types.js';
export { deriveFeatures } from './features.js';
export { searchCorePlans } from './planner.js';
export { rankPlan, compareRanked } from './scoring.js';
export { candidateRejection, compatiblePlan } from './constraints.js';

const layers: Layer[] = ['frontend', 'backend', 'database', 'hosting'];
export function invalidCoreReport(
  errors: ValidationIssue[],
  catalogVersion = defaultCatalog.version,
): CorePlanningReport {
  return {
    schema_version: '0.2.0',
    engine_version: '0.2.0',
    catalog_version: catalogVersion,
    rules_version: '0.2.0',
    scope: 'core_layers_only',
    status: 'invalid_input',
    summary: 'Input is invalid; no core planning was performed.',
    core_stack: null,
    architecture_style: null,
    primary_region: null,
    database_deployment: null,
    database_region: null,
    score: null,
    score_breakdown: [],
    feasible_core_plans: 0,
    features: [],
    pending_requirements: [],
    warnings: [],
    assumptions: [],
    validation_errors: errors,
    trace: { explored_assignments: 0, rejections: [], shortlist: [] },
  };
}
function pending(
  scenario: NormalizedScenario,
): { field: string; reason: string }[] {
  const result = [
    {
      field: 'budget.monthly_infra_usd',
      reason: 'Monthly cost and affordability are not estimated in this phase.',
    },
    {
      field: 'requirements.availability',
      reason:
        'Availability topology and operating controls require Phase 3 review.',
    },
  ];
  const booleanFeatures = [
    'realtime',
    'offline_support',
    'full_text_search',
    'file_media_storage',
    'payments',
    'multi_tenant',
  ] as const;
  for (const key of booleanFeatures)
    if (scenario.requirements[key])
      result.push({
        field: `requirements.${key}`,
        reason:
          'Supporting-service implementation, compatibility and cost are pending Phase 3.',
      });
  if (scenario.requirements.auth !== 'none')
    result.push({
      field: 'requirements.auth',
      reason: `${scenario.requirements.auth} integration and data flows have not been verified.`,
    });
  if (scenario.requirements.ml_features !== 'none')
    result.push({
      field: 'requirements.ml_features',
      reason:
        'ML serving/training/retrieval infrastructure is not selected yet.',
    });
  if (scenario.requirements.p95_latency_ms !== null)
    result.push({
      field: 'requirements.p95_latency_ms',
      reason:
        'No deployment benchmark or end-to-end latency guarantee is available.',
    });
  if (scenario.infrastructure.data_residency !== 'none')
    result.push({
      field: 'infrastructure.data_residency',
      reason:
        'Only primary compute/database mappings are checked; backups, logs, identity, media and all other data flows remain unverified.',
    });
  if (scenario.infrastructure.existing_systems.length)
    result.push({
      field: 'infrastructure.existing_systems',
      reason:
        'Reuse is only a ranking hint. Versions/EOL, licenses, network access and protocol compatibility need entry-level review.',
    });
  if (scenario.compliance.length)
    result.push({
      field: 'compliance',
      reason: `Required control evidence for ${scenario.compliance.join(', ')} is not modeled yet; a core plan cannot approve these constraints.`,
    });
  return result.sort((a, b) => compare(a.field, b.field));
}
export function planCore(
  raw: unknown,
  context: PlanningContext = {},
): CorePlanningReport {
  const validation = normalizeScenario(raw);
  const catalog = context.catalog ?? defaultCatalog;
  if (validation.status === 'invalid_input')
    return invalidCoreReport(validation.validation_errors, catalog.version);
  assertCatalog(catalog);
  const scenario = validation.normalized_input!;
  const features = deriveFeatures(scenario);
  const search = searchCorePlans(
    catalog,
    scenario,
    features,
    context.maxAssignments,
  );
  const winner = search.ranked[0];
  const blockers: Warning[] = [];
  if (
    scenario.infrastructure.deployment_model === 'air_gapped' &&
    (scenario.requirements.payments ||
      scenario.requirements.auth === 'phone_otp' ||
      scenario.requirements.auth === 'social')
  )
    blockers.push({
      code: 'AIR_GAP_EXTERNAL_REQUIREMENT',
      severity: 'critical',
      message:
        'An air-gapped deployment conflicts with the requested external payment or public identity/phone delivery flow; no offline substitute is approved.',
      fields: [
        'infrastructure.deployment_model',
        ...(scenario.requirements.payments ? ['requirements.payments'] : []),
        ...(scenario.requirements.auth !== 'none' ? ['requirements.auth'] : []),
      ],
    });
  if (!winner)
    blockers.push({
      code: 'CORE_CATALOG_COVERAGE_GAP',
      severity: 'critical',
      message:
        'No complete core plan in the reviewed catalog satisfies the primary deployment, platform, driver and region constraints. This is catalog-relative, not proof of real-world impossibility.',
      fields: [
        'project.platforms',
        'infrastructure.cloud_preference',
        'infrastructure.deployment_model',
        'infrastructure.data_residency',
      ],
    });
  if (scenario.compliance.length)
    blockers.push({
      code: 'COMPLIANCE_EVIDENCE_PENDING',
      severity: 'critical',
      message: `Core stack withheld: required control evidence for ${scenario.compliance.join(', ')} is not modeled yet. A vendor name cannot establish compliance.`,
      fields: ['compliance'],
    });
  const warnings: Warning[] = [
    ...validation.warnings,
    ...features.warnings,
    ...blockers,
    {
      code: 'CORE_SCOPE_ONLY',
      severity: 'warning',
      message:
        'Core planning only. Supporting services, costs, configured controls and full requirement feasibility are not approved in Phase 2.',
      fields: ['requirements', 'budget.monthly_infra_usd'],
    },
  ];
  if (features.lowMemory)
    warnings.push({
      code: 'DEVICE_BENCHMARK_PENDING',
      severity: 'warning',
      message:
        'A low-memory client hint was detected; no framework receives an unsupported performance advantage without device measurement.',
      fields: ['project.description'],
    });
  if (
    winner &&
    scenario.budget.monthly_infra_usd === 0 &&
    [
      winner.plan.frontend,
      winner.plan.backend,
      winner.plan.database,
      winner.plan.hosting,
    ].some((entry) => entry.cost_class > 0)
  )
    warnings.push({
      code: 'ZERO_BUDGET_UNVERIFIED',
      severity: 'warning',
      message:
        'This core architecture has nonzero relative resource burden; no zero-cost deployment is established. Cost estimation remains pending.',
      fields: ['budget.monthly_infra_usd'],
    });
  const approved = Boolean(winner) && blockers.length === 0;
  const coreStack = approved
    ? (Object.fromEntries(
        layers.map((layer) => [
          layer,
          describeCoreSelection(
            layer,
            winner!,
            search.ranked,
            catalog,
            scenario,
            features,
          ),
        ]),
      ) as Record<Layer, Selection>)
    : null;
  const report: CorePlanningReport = {
    ...invalidCoreReport([], catalog.version),
    status: approved ? 'core_plan' : 'blocked',
    summary: approved
      ? `Provisional ${winner!.plan.style} core plan ranked from ${search.ranked.length} compatible core combinations; full recommendations are pending Phase 3.`
      : 'Core plan is blocked by missing catalog/control evidence; inspect warnings and rejection trace.',
    core_stack: coreStack,
    architecture_style: approved ? winner!.plan.style : null,
    primary_region: approved ? winner!.plan.primary_region : null,
    database_deployment: approved ? winner!.plan.database_deployment : null,
    database_region: approved ? winner!.plan.database_region : null,
    score: approved ? winner!.score : null,
    score_breakdown: approved ? winner!.breakdown : [],
    feasible_core_plans: search.ranked.length,
    features: features.evidence,
    pending_requirements: pending(scenario),
    warnings: warnings.sort(
      (a, b) =>
        ({ critical: 0, warning: 1, info: 2 })[a.severity] -
          { critical: 0, warning: 1, info: 2 }[b.severity] ||
        compare(a.code, b.code) ||
        compare(a.fields.join('|'), b.fields.join('|')),
    ),
    assumptions: [
      ...validation.assumptions,
      ...features.assumptions,
      'Fit scores and cost classes are explicit ordinal engineering heuristics, not measured performance, prices or probabilities.',
      'When SSR frontend and backend need different runtimes, the host profile implies separate application services; their cost and networking remain pending.',
    ].sort(compare),
    trace: {
      explored_assignments: search.explored,
      rejections: search.rejections.slice(0, 200),
      shortlist: search.ranked.slice(0, 5).map((candidate) => ({
        id: candidate.plan.id,
        score: candidate.score,
      })),
    },
  };
  if (typeof scenario.scenario_id === 'string')
    report.scenario_id = scenario.scenario_id;
  assertCoreReport(report);
  return report;
}
export { recommend, invalidRecommendation } from './recommend.js';
export type {
  FinalRecommendation,
  RecommendationContext,
} from './complete-types.js';
