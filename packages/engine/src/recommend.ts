import {
  defaultCatalog,
  assertCatalog,
  type Layer,
} from '../../catalog/src/index.js';
import { defaultPolicies, assertPolicies } from '../../catalog/src/services.js';
import {
  normalizeScenario,
  validateOutput,
  compare,
} from '../../contracts/src/index.js';
import type {
  ValidationIssue,
  Warning,
  NormalizedScenario,
} from '../../contracts/src/index.js';
import type {
  Stack,
  Component,
} from '../../contracts/src/recommendation.generated.js';
import type { RankedPlan } from './types.js';
import { deriveFeatures } from './features.js';
import { searchCorePlans } from './planner.js';
import { selectSupporting } from './supporting.js';
import { controlPlan, existingLifecycleWarnings } from './controls.js';
import { estimateCost, budgetWarnings, CostModelLimitError } from './costs.js';
import { reviewActions, integrationReviews } from './guidance.js';
import { costGroups, costSensitivity } from './exploration.js';
import { describeCoreSelection } from './explanations.js';
import type {
  FinalRecommendation,
  RecommendationContext,
  CompleteCandidate,
} from './complete-types.js';
export type {
  FinalRecommendation,
  RecommendationContext,
} from './complete-types.js';

export function invalidRecommendation(
  errors: ValidationIssue[],
  catalogVersion = defaultCatalog.version,
): FinalRecommendation {
  return {
    engine_version: '0.8.0',
    catalog_version: catalogVersion,
    rules_version: '0.8.0',
    services_version: defaultPolicies.version,
    status: 'invalid_input',
    summary:
      'Input is invalid; no recommendation or cost estimate was produced.',
    architecture_style: 'other',
    stack: null,
    estimated_monthly_cost_usd: {
      min: 0,
      max: 0,
      assumptions: [
        'No estimate: 0–0 is a required serialization placeholder, not a zero-cost deployment.',
      ],
    },
    estimate_status: 'not_estimated',
    estimated_cost_scope: 'infrastructure_and_operations',
    warnings: [],
    assumptions: [],
    validation_errors: errors,
    review_actions: [],
    integration_reviews: [],
    cost_groups: [],
    cost_sensitivity: [],
    plan_comparison: [],
    cost_breakdown: [],
    control_plan: null,
    data_flows: [],
    decision_trace: {
      core_candidates: 0,
      complete_candidates: 0,
      selected_plan_id: null,
      score: null,
      rejected: [],
    },
  };
}
const severity = { critical: 0, warning: 1, info: 2 };
function warnings(values: Warning[]): Warning[] {
  const distinct = new Map(
    values.map((item) => [
      `${item.code}|${item.fields.join('|')}|${item.message}`,
      item,
    ]),
  );
  return [...distinct.values()].sort(
    (a, b) =>
      severity[a.severity] - severity[b.severity] ||
      compare(a.code, b.code) ||
      compare(a.message, b.message),
  );
}
function assertFinal(
  report: FinalRecommendation,
  s?: NormalizedScenario,
): void {
  const errors = validateOutput(report);
  if (errors.length)
    throw new Error(
      `Internal recommendation contract failure: ${JSON.stringify(errors)}`,
    );
  if (report.stack && s)
    for (const component of [
      report.stack.frontend,
      report.stack.backend,
      report.stack.database,
      report.stack.hosting,
      ...(report.stack.supporting ?? []),
    ])
      for (const path of component.driven_by) {
        let value: unknown = s;
        for (const key of path.split('.'))
          value =
            value && typeof value === 'object'
              ? (value as Record<string, unknown>)[key]
              : undefined;
        if (value === undefined)
          throw new Error(`Unresolved component driver ${path}`);
      }
}
export function recommend(
  raw: unknown,
  context: RecommendationContext = {},
): FinalRecommendation {
  const validation = normalizeScenario(raw);
  const catalog = context.catalog ?? defaultCatalog;
  const policies = context.policies ?? defaultPolicies;
  if (validation.status === 'invalid_input') {
    const report = invalidRecommendation(
      validation.validation_errors,
      catalog.version,
    );
    assertFinal(report);
    return report;
  }
  assertCatalog(catalog);
  assertPolicies(policies);
  for (const profile of policies.services)
    for (const [layer, ids] of [
      ['frontend', profile.frontend_ids],
      ['database', profile.database_ids],
    ] as const)
      for (const id of ids)
        if (
          !catalog.entries.some(
            (entry) => entry.id === id && entry.layer === layer,
          )
        )
          throw new Error(`Unknown service ${layer} reference ${id}`);
  const s = validation.normalized_input!;
  const extraAssumptions: string[] = [];
  if (
    s.compliance.includes('rbi_localisation') &&
    s.infrastructure.data_residency === 'none'
  ) {
    s.infrastructure.data_residency = 'india';
    extraAssumptions.push(
      'RBI localisation explicitly requested: effective payment-data residency is India; no country requirement was inferred from project text.',
    );
  }
  const lifecycleNotices = existingLifecycleWarnings(s, policies);
  const f = deriveFeatures(s);
  const search = searchCorePlans(catalog, s, f, context.maxAssignments);
  const candidates: CompleteCandidate[] = [];
  const rejected: FinalRecommendation['decision_trace']['rejected'] = [];
  const blockers: Warning[] = [];
  // Every compatible core is completed and priced before ranking: no top-k truncation.
  for (const ranked of search.ranked) {
    const support = selectSupporting(ranked.plan, s, f, policies);
    const control = controlPlan(s, ranked.plan, support, policies);
    const failures = [...support.blockers, ...control.blockers];
    if (failures.length) {
      blockers.push(...failures);
      rejected.push({
        plan_id: ranked.plan.id,
        codes: [...new Set(failures.map((item) => item.code))].sort(compare),
      });
      continue;
    }
    let cost;
    try {
      cost = estimateCost(ranked.plan, s, support, policies);
    } catch (error) {
      if (!(error instanceof CostModelLimitError)) throw error;
      const failure: Warning = {
        code: 'COST_MODEL_COVERAGE_GAP',
        severity: 'critical',
        message: error.message,
        fields: ['scale', 'extensions'],
      };
      blockers.push(failure);
      rejected.push({ plan_id: ranked.plan.id, codes: [failure.code] });
      continue;
    }
    const budget = s.budget.monthly_infra_usd;
    const costFit =
      cost.max <= budget
        ? 5
        : cost.min <= budget
          ? 3
          : cost.min <= budget * 2
            ? 1
            : 0;
    // Coverage of configured controls, never legal certification or an unverified product claim.
    const securityFit = s.requirements.multi_tenant ? 4 : 3;
    const units = support.components.reduce(
      (sum, item) => sum + item.incremental_compute_units,
      0,
    );
    const operationPenalty = units >= 3 && !s.team.has_devops ? 1 : 0;
    const breakdown = ranked.breakdown.map((part) => {
      const fit =
        part.criterion === 'cost'
          ? costFit
          : part.criterion === 'security'
            ? securityFit
            : part.criterion === 'maintainability'
              ? Math.max(0, part.fit - operationPenalty)
              : part.fit;
      const reason =
        part.criterion === 'cost'
          ? `USD ${cost.min}–${cost.max}/month versus budget ${budget}: fit 5 when upper bound fits, 3 when only lower fits, 1 within twice budget, otherwise 0. All selected services are included under disclosed assumptions.`
          : part.criterion === 'security'
            ? 'Baseline configured controls: 3; explicit reviewed tenant isolation: 4. No certification/audit credit is assigned.'
            : part.criterion === 'maintainability'
              ? `${part.reason} Additional service operating penalty ${operationPenalty}.`
              : part.reason;
      return { ...part, fit, contribution: fit * part.weight, reason };
    });
    const score = breakdown.reduce((sum, part) => sum + part.contribution, 0);
    candidates.push({
      ranked: {
        ...ranked,
        score,
        breakdown,
        operated_components: ranked.operated_components + units,
      },
      plan: ranked.plan,
      support,
      cost,
      control,
      score,
      cost_fit: costFit,
      security_fit: securityFit,
      operation_penalty: operationPenalty,
    });
  }
  // Prefer a narrower reviewed client variant only after score, cost and operating burden tie.
  const unusedClientTargets = (candidate: CompleteCandidate) =>
    candidate.plan.frontend.platforms!.filter(
      (target) => !s.project.platforms.some((requested) => requested === target),
    ).length;
  candidates.sort(
    (a, b) =>
      b.score - a.score ||
      a.cost.max - b.cost.max ||
      a.ranked.operated_components - b.ranked.operated_components ||
      unusedClientTargets(a) - unusedClientTargets(b) ||
      compare(a.plan.id, b.plan.id),
  );
  context.onCompletePlans?.(
    candidates.map((candidate) => ({
      plan_id: candidate.plan.id,
      core: {
        frontend: candidate.plan.frontend.name,
        backend: candidate.plan.backend.name,
        database: candidate.plan.database.name,
        hosting: candidate.plan.hosting.name,
      },
      monthly_usd: { min: candidate.cost.min, max: candidate.cost.max },
      operated_components: candidate.ranked.operated_components,
      score: candidate.score,
      fits: candidate.ranked.breakdown.map((part) => ({
        criterion: part.criterion,
        fit: part.fit,
      })),
    })),
  );
  const base = invalidRecommendation([], catalog.version);
  base.services_version = policies.version;
  if (typeof s.scenario_id === 'string') base.scenario_id = s.scenario_id;
  base.assumptions = [
    ...validation.assumptions,
    ...f.assumptions,
    ...extraAssumptions,
  ];
  base.integration_reviews = integrationReviews(s, policies);
  base.decision_trace = {
    core_candidates: search.ranked.length,
    complete_candidates: candidates.length,
    selected_plan_id: null,
    score: null,
    rejected: rejected.slice(0, 20),
  };
  const selected = candidates[0];
  if (!selected) {
    base.status = 'infeasible';
    base.summary =
      'No complete recommendation satisfies the reviewed catalog and service/control evidence. This is a catalog coverage result, not proof of real-world impossibility.';
    const useful = warnings(blockers);
    const byCode = new Map(
      useful.map((item) => [`${item.code}|${item.fields.join('|')}`, item]),
    );
    base.warnings = warnings([
      ...validation.warnings,
      ...lifecycleNotices,
      ...f.warnings,
      ...byCode.values(),
      {
        code: search.ranked.length
          ? 'COMPLETE_PLAN_COVERAGE_GAP'
          : 'CORE_CATALOG_COVERAGE_GAP',
        severity: 'critical',
        message: search.ranked.length
          ? 'Resolve the listed service/contract/model evidence gaps or explicitly revise requirements; no constraint was silently relaxed.'
          : 'No reviewed core combination matches platform, deployment, database and region constraints. Add source-backed regional/provider profiles before recommending a deployment.',
        fields: ['infrastructure', 'requirements', 'compliance'],
      },
    ]);
    base.review_actions = reviewActions(base.warnings, s, policies);
    base.core_rejections = search.rejections.slice(0, 30);
    base.assumptions.sort(compare);
    assertFinal(base, s);
    return base;
  }
  const { plan, support, cost, control } = selected;
  const eligible = candidates.map((item) => item.ranked);
  const stack = {} as Stack;
  for (const layer of [
    'frontend',
    'backend',
    'database',
    'hosting',
  ] as Layer[]) {
    const component = describeCoreSelection(
      layer,
      selected.ranked,
      eligible,
      catalog,
      s,
      f,
    );
    component.justification +=
      ' Selected after supporting-service compatibility and whole-plan infrastructure cost scoring. Explicit critical warnings identify provisional data-flow/control exceptions.';
    component.alternatives.forEach((alternative) => {
      alternative.why_not = alternative.why_not
        .replace('complete core plan', 'complete plan')
        .replace('core plan', 'complete plan')
        .replace(
          'operated-component/identifier',
          'cost-upper-bound/operated-component/identifier',
        );
    });
    // Generated schema tuples are guaranteed by catalog assertion and explanation construction.
    stack[layer] = {
      ...component,
      driven_by: [component.driven_by[0]!, ...component.driven_by.slice(1)],
      alternatives: [
        component.alternatives[0]!,
        ...component.alternatives.slice(1),
      ],
      tradeoffs: [component.tradeoffs[0]!, ...component.tradeoffs.slice(1)],
    };
  }
  stack.supporting = support.components;
  const applied = new Set([
    'expected_requests_per_second',
    'monthly_egress_gb',
    'retention_months',
    ...(s.requirements.auth === 'phone_otp' ? ['monthly_otp_count'] : []),
    ...(s.requirements.payments
      ? ['monthly_payment_transactions', 'average_payment_value_usd']
      : []),
  ]);
  const notices = validation.warnings.filter(
    (item) =>
      !(
        item.code === 'EXTENSION_NOT_APPLIED' &&
        item.fields.every((field) =>
          applied.has(field.replace('extensions.', '')),
        )
      ),
  );
  base.status = 'ok';
  base.summary = `${plan.style} recommendation selected from ${candidates.length} complete compatible plans; month-12 infrastructure planning band USD ${cost.min}–${cost.max}/month.`;
  base.architecture_style = plan.style;
  base.stack = stack;
  base.estimate_status = 'estimated';
  base.estimated_monthly_cost_usd = {
    min: cost.min,
    max: cost.max,
    assumptions: cost.assumptions,
  };
  base.cost_breakdown = cost.line_items;
  base.cost_groups = costGroups(cost.line_items);
  base.cost_sensitivity = costSensitivity(selected, s, policies);
  base.plan_comparison = candidates.slice(0, 3).map((candidate) => ({
    plan_id: candidate.plan.id,
    selected: candidate === selected,
    architecture_style: candidate.plan.style,
    core: Object.fromEntries(
      (['frontend', 'backend', 'database', 'hosting'] as const).map((layer) => [
        layer,
        candidate.plan[layer].name,
      ]),
    ) as Record<Layer, string>,
    supporting_services: candidate.support.components.map(
      (component) => component.choice,
    ),
    primary_region: candidate.plan.primary_region,
    database_region: candidate.plan.database_region,
    score: candidate.score,
    score_delta: candidate.score - selected.score,
    tied_on_score: candidate !== selected && candidate.score === selected.score,
    monthly_usd: { min: candidate.cost.min, max: candidate.cost.max },
    operated_components: candidate.ranked.operated_components,
    budget_fit:
      candidate.cost.max <= s.budget.monthly_infra_usd
        ? 'within_upper'
        : candidate.cost.min <= s.budget.monthly_infra_usd
          ? 'range_risk'
          : 'over_budget',
    warning_codes: [
      ...new Set(
        [
          ...candidate.support.warnings,
          ...candidate.control.warnings,
          ...budgetWarnings(candidate.cost, s.budget.monthly_infra_usd),
        ].map((w) => w.code),
      ),
    ].sort(compare),
    cost_assumptions: candidate.cost.assumptions,
    retained_constraints: [
      `platforms=${s.project.platforms.join(',')}`,
      `cloud_preference=${s.infrastructure.cloud_preference}`,
      `deployment_model=${s.infrastructure.deployment_model}`,
      `data_residency=${s.infrastructure.data_residency}`,
      `compliance=${s.compliance.join(',') || 'none'}`,
      'Requested features are included. Critical warnings explicitly identify provisional external-boundary or contractual exceptions; no verified compliance or residency approval is implied.',
    ],
  }));
  base.control_plan = {
    frameworks: control.frameworks,
    deployment_controls: control.deployment_controls,
  };
  base.data_flows = [
    {
      component: 'primary-compute',
      location:
        plan.primary_region ?? 'Choose deployment location before provisioning',
      scope:
        'Application processing; configure region, private access, logging and replicas explicitly.',
      verification: 'configuration_required',
    },
    ...(plan.database.model === 'none'
      ? []
      : [
          {
            component: 'primary-database',
            location:
              plan.database_region ??
              plan.primary_region ??
              'Choose database location before provisioning',
            scope:
              'Application/auth/search/outbox data and backups; verify retention, restore and deletion.',
            verification: 'configuration_required' as const,
          },
        ]),
    ...support.data_flows,
  ];
  base.warnings = warnings([
    ...notices,
    ...lifecycleNotices,
    ...f.warnings,
    ...support.warnings,
    ...control.warnings,
    ...budgetWarnings(cost, s.budget.monthly_infra_usd),
    ...(plan.style === 'static'
      ? []
      : [
          {
            code: 'PRICE_AND_CAPACITY_ASSUMPTIONS',
            severity: 'warning' as const,
            message:
              'Planning bands combine published reference rates and explicitly authored allowances; they are not regional provider quotes or measured workload capacity. Validate sizing, merchant/SMS eligibility, storage, requests and current tariffs before purchase.',
            fields: ['scale', 'budget.monthly_infra_usd', 'requirements'],
          },
        ]),
    ...(f.lowMemory
      ? [
          {
            code: 'DEVICE_BENCHMARK_PENDING',
            severity: 'warning' as const,
            message:
              'Low-memory device suitability requires an actual device benchmark; no framework is credited with unmeasured RAM/latency performance.',
            fields: ['project.description'],
          },
        ]
      : []),
  ]);
  base.status = base.warnings.some((item) => item.severity !== 'info')
    ? 'ok_with_warnings'
    : 'ok';
  if (base.warnings.some((w) => w.severity === 'critical'))
    base.summary =
      'PROVISIONAL STACK — unresolved critical constraints require review before production. ' +
      base.summary;
  base.assumptions = [
    ...new Set([
      ...(base.warnings.some((w) => w.severity === 'critical')
        ? [
            'Reduced scope of assurance: the proposed architecture includes the requested features, but constraints identified by critical warnings are unverified or unmet. This is not a production approval.',
          ]
        : []),
      ...base.assumptions,
      ...support.assumptions,
      'Scores and sizing are published engineering heuristics; output is a deployment design requiring configuration and validation.',
    ]),
  ].sort(compare);
  base.decision_trace.selected_plan_id = plan.id;
  base.decision_trace.score = selected.score;
  base.score_breakdown = selected.ranked.breakdown;
  base.primary_region = plan.primary_region;
  base.database_region = plan.database_region;
  base.applied_extensions = Object.keys(s.extensions ?? {})
    .filter((key) => applied.has(key))
    .sort(compare);
  base.review_actions = reviewActions(base.warnings, s, policies);
  assertFinal(base, s);
  return base;
}
