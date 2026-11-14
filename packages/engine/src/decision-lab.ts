import { Ajv } from 'ajv';
import {
  readSchema,
  recommendationSchema,
} from '../../contracts/src/schemas.js';
import { createHash } from 'node:crypto';
import { normalizeScenario, serialize } from '../../contracts/src/index.js';
import { defaultCatalog, type Source } from '../../catalog/src/index.js';
import { defaultPolicies } from '../../catalog/src/services.js';
import { recommend } from './recommend.js';
import type {
  FinalRecommendation,
  RecommendationContext,
  EvaluatedPlanSnapshot,
} from './complete-types.js';
import type { Criterion } from './types.js';

const labValidator = new Ajv({ allErrors: true, strict: false })
  .addSchema(recommendationSchema)
  .compile(readSchema('decision-lab.schema.json'));
export function assertDecisionLab(
  value: unknown,
): asserts value is DecisionLab {
  if (!labValidator(value))
    throw new Error(
      `Decision Lab contract failure: ${JSON.stringify(labValidator.errors)}`,
    );
  const r = value as DecisionLab,
    p = r.priority_analysis,
    f = r.functional_experiments;
  if (r.engine_evaluations !== 1 + p.trials.length + f.trials.length)
    throw Error('Decision Lab evaluation count mismatch.');
  if (
    p.status === 'evaluated' &&
    (p.tested_settings !== 25 ||
      p.trials.length !== 24 ||
      p.retained_winner_settings !==
        1 + p.trials.filter((t) => !t.changed_winner).length ||
      p.evaluated_plans.length !==
        r.baseline.decision_trace.complete_candidates)
  )
    throw Error('Decision Lab priority coverage mismatch.');
  if (
    f.tested_variants !== f.trials.length ||
    f.trials.some((t) => t.edits.length < 1 || t.edits.length > 2)
  )
    throw Error('Decision Lab functional coverage mismatch.');
}

export const criteria: Criterion[] = [
  'cost',
  'time_to_market',
  'scalability',
  'performance',
  'maintainability',
  'security',
];
export interface LabPlan {
  plan_id: string;
  core: Record<'frontend' | 'backend' | 'database' | 'hosting', string>;
  monthly_usd: { min: number; max: number };
  operated_components: number;
  original_priority_score: number;
  fit: Record<Criterion, number>;
}
export interface PriorityTrial {
  criterion: Criterion;
  original_weight: number;
  trial_weight: number;
  selected_plan_id: string;
  changed_winner: boolean;
  displayed_equal_score_alternatives: number;
}
export interface FunctionalTrial {
  edits: { field: string; before: unknown; after: unknown }[];
  status: FinalRecommendation['status'];
  selected_plan_id: string | null;
  remaining_blocker_codes: string[];
  warning_codes: string[];
  monthly_usd: { min: number; max: number } | null;
}
export interface DecisionLab {
  analysis_version: '0.2.0';
  input_sha256: string | null;
  baseline: FinalRecommendation;
  priority_analysis: {
    status: 'evaluated' | 'not_applicable';
    tested_settings: number;
    retained_winner_settings: number;
    distinct_winners: number;
    trials: PriorityTrial[];
    evaluated_plans: LabPlan[];
    frontier_plan_ids: string[];
  };
  functional_experiments: {
    status: 'evaluated' | 'not_applicable';
    max_edits: 2;
    protected_fields: string[];
    tested_variants: number;
    smallest_successful_edit_count: number | null;
    successful_variants: FunctionalTrial[];
    trials: FunctionalTrial[];
  };
  evidence: Source[];
  engine_evaluations: number;
  limitations: string[];
  adr_markdown: string;
}
const protectedFields = [
  'compliance',
  'infrastructure',
  'requirements.multi_tenant',
  'requirements.availability',
  'budget',
  'team',
  'timeline',
];
const isUsable = (result: FinalRecommendation) => Boolean(result.stack);
/** Weakly better on every declared objective, strictly better on at least one. */
export function dominates(a: LabPlan, b: LabPlan): boolean {
  return (
    a.monthly_usd.max <= b.monthly_usd.max &&
    a.operated_components <= b.operated_components &&
    a.original_priority_score >= b.original_priority_score &&
    (a.monthly_usd.max < b.monthly_usd.max ||
      a.operated_components < b.operated_components ||
      a.original_priority_score > b.original_priority_score)
  );
}
export function analyzeDecision(
  raw: unknown,
  context: RecommendationContext = {},
): DecisionLab {
  let evaluatedPlans: EvaluatedPlanSnapshot[] = [];
  const baseline = recommend(raw, {
    ...context,
    onCompletePlans: (plans) => {
      evaluatedPlans = plans;
    },
  });
  const report: DecisionLab = {
    analysis_version: '0.2.0',
    input_sha256: null,
    baseline,
    priority_analysis: {
      status: 'not_applicable',
      tested_settings: 0,
      retained_winner_settings: 0,
      distinct_winners: 0,
      trials: [],
      evaluated_plans: [],
      frontier_plan_ids: [],
    },
    functional_experiments: {
      status: 'not_applicable',
      max_edits: 2,
      protected_fields: [...protectedFields],
      tested_variants: 0,
      smallest_successful_edit_count: null,
      successful_variants: [],
      trials: [],
    },
    evidence: [],
    engine_evaluations: 1,
    limitations: [
      'Exploratory analysis only. The original recommendation and original requirements are unchanged.',
      'Priority stability counts a finite one-at-a-time sweep; it is not a probability, confidence score or exhaustive sensitivity analysis.',
      'The tradeoff front covers all complete candidates in this finite reviewed catalog, minimizing cost upper bound and operated components while maximizing the ORIGINAL-priority heuristic score. It does not establish real-world optimality or measured architecture quality.',
      'Functional experiments try eligible single/pair edits only: phone login to email/password, payments off, offline support off, full-text search off, or unsupported ML off. They are changed projects, never solutions satisfying the original brief.',
      'Within Decision Lab functional experiments, compliance, infrastructure/residency/provider, tenant isolation, availability, budget, team and timeline are never relaxed. A usable hypothetical result is not legal, security or production approval.',
      'No user assertion authenticates vendor/tenant evidence. Missing contracts, capacity calibration and independent review remain unresolved.',
      'engine_evaluations counts top-level scenario trials; the baseline recommendation may additionally evaluate one separately labeled budget proposal. Budget proposals are outside the functional-experiment sweep and never change the baseline brief.',
      'The generated ADR is Proposed; no stakeholder acceptance, implementation or deployment is inferred.',
    ],
    adr_markdown: '',
  };
  if (baseline.status === 'invalid_input') {
    report.adr_markdown = decisionMarkdown(report);
    assertDecisionLab(report);
    return report;
  }
  report.input_sha256 = createHash('sha256')
    .update(serialize(raw))
    .digest('hex');
  const s = normalizeScenario(raw).normalized_input!;
  const input = raw as Record<string, unknown>;
  if (isUsable(baseline)) {
    const analysis = report.priority_analysis;
    analysis.status = 'evaluated';
    const winners = new Set<string>([
      baseline.decision_trace.selected_plan_id!,
    ]);
    analysis.evaluated_plans = evaluatedPlans.map((plan) => ({
      plan_id: plan.plan_id,
      core: plan.core,
      monthly_usd: plan.monthly_usd,
      operated_components: plan.operated_components,
      original_priority_score: plan.score,
      fit: Object.fromEntries(
        plan.fits.map((part) => [part.criterion, part.fit]),
      ) as Record<Criterion, number>,
    }));
    analysis.tested_settings = 1;
    analysis.retained_winner_settings = 1;
    for (const criterion of criteria) {
      for (let weight = 1; weight <= 5; weight++) {
        if (weight === s.priorities[criterion]) continue;
        const changed = structuredClone(input);
        changed.priorities = { ...s.priorities, [criterion]: weight };
        const result = recommend(changed, {
          ...context,
          budgetPlanning: false,
        });
        report.engine_evaluations++;
        if (!result.stack)
          throw new Error(
            'Priority-only edit changed feasibility; analysis invariant failed.',
          );
        winners.add(result.decision_trace.selected_plan_id!);
        const same =
          result.decision_trace.selected_plan_id ===
          baseline.decision_trace.selected_plan_id;
        analysis.tested_settings++;
        if (same) analysis.retained_winner_settings++;
        analysis.trials.push({
          criterion,
          original_weight: s.priorities[criterion],
          trial_weight: weight,
          selected_plan_id: result.decision_trace.selected_plan_id!,
          changed_winner: !same,
          displayed_equal_score_alternatives: result.plan_comparison.filter(
            (plan) => plan.tied_on_score,
          ).length,
        });
      }
    }
    analysis.distinct_winners = winners.size;
    analysis.frontier_plan_ids = analysis.evaluated_plans
      .filter(
        (plan) =>
          !analysis.evaluated_plans.some((other) => dominates(other, plan)),
      )
      .map((plan) => plan.plan_id);
  } else {
    const analysis = report.functional_experiments;
    analysis.status = 'evaluated';
    const options: { key: string; before: unknown; after: unknown }[] = [];
    if (s.requirements.auth === 'phone_otp')
      options.push({
        key: 'auth',
        before: 'phone_otp',
        after: 'email_password',
      });
    for (const key of [
      'payments',
      'offline_support',
      'full_text_search',
    ] as const)
      if (s.requirements[key])
        options.push({ key, before: true, after: false });
    if (
      s.requirements.ml_features !== 'none' &&
      s.requirements.ml_features !== 'inference_api'
    )
      options.push({
        key: 'ml_features',
        before: s.requirements.ml_features,
        after: 'none',
      });
    const combinations = options.map((option) => [option]);
    for (let i = 0; i < options.length; i++)
      for (let j = i + 1; j < options.length; j++)
        combinations.push([options[i]!, options[j]!]);
    for (const combination of combinations) {
      const changed = structuredClone(input);
      changed.requirements = {
        ...(changed.requirements as Record<string, unknown>),
      };
      for (const edit of combination)
        (changed.requirements as Record<string, unknown>)[edit.key] =
          edit.after;
      const result = recommend(changed, { ...context, budgetPlanning: false });
      report.engine_evaluations++;
      const trial: FunctionalTrial = {
        edits: combination.map((edit) => ({
          field: `requirements.${edit.key}`,
          before: edit.before,
          after: edit.after,
        })),
        status: result.status,
        selected_plan_id: result.decision_trace.selected_plan_id,
        warning_codes: [
          ...new Set(
            result.warnings
              .filter((w) => w.severity !== 'info')
              .map((w) => w.code),
          ),
        ].sort(),
        remaining_blocker_codes: [
          ...new Set(
            result.warnings
              .filter((w) => w.severity === 'critical')
              .map((w) => w.code),
          ),
        ].sort(),
        monthly_usd: result.stack
          ? {
              min: result.estimated_monthly_cost_usd.min,
              max: result.estimated_monthly_cost_usd.max,
            }
          : null,
      };
      analysis.trials.push(trial);
    }
    analysis.tested_variants = analysis.trials.length;
    const success = analysis.trials.filter(
      (trial) => trial.selected_plan_id !== null,
    );
    analysis.smallest_successful_edit_count = success.length
      ? Math.min(...success.map((trial) => trial.edits.length))
      : null;
    analysis.successful_variants = success.filter(
      (trial) => trial.edits.length === analysis.smallest_successful_edit_count,
    );
  }
  const coreIds = new Set<string>(),
    serviceIds = new Set<string>();
  if (baseline.stack) {
    for (const layer of ['frontend', 'backend', 'database', 'hosting'] as const)
      for (const id of (baseline.stack[layer].source_ids as string[]) ?? [])
        coreIds.add(id);
    for (const component of baseline.stack.supporting ?? [])
      for (const id of (component.source_ids as string[]) ?? [])
        serviceIds.add(id);
    for (const line of baseline.cost_breakdown)
      for (const id of line.source_ids) serviceIds.add(id);
  }
  const sources = new Map<string, Source>();
  for (const source of (context.catalog ?? defaultCatalog).sources)
    if (coreIds.has(source.id))
      sources.set(`core:${source.id}`, { ...source, id: `core:${source.id}` });
  for (const source of (context.policies ?? defaultPolicies).sources)
    if (serviceIds.has(source.id))
      sources.set(`services:${source.id}`, {
        ...source,
        id: `services:${source.id}`,
      });
  for (const action of baseline.review_actions)
    for (const source of action.references)
      sources.set(`services:${source.id}`, {
        ...source,
        id: `services:${source.id}`,
      });
  report.evidence = [...sources.values()].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  );
  report.adr_markdown = decisionMarkdown(report);
  assertDecisionLab(report);
  return report;
}
// Quote untrusted brief/diagnostic text as data, so it cannot introduce headings or HTML.
const md = (value: unknown) =>
  String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)
    .replace(/([\\`*_{}\[\]()#+.!|~-])/g, '\\$1');
export function decisionMarkdown(report: DecisionLab): string {
  const r = report.baseline,
    p = report.priority_analysis,
    f = report.functional_experiments;
  const lines = [
    '# Proposed architecture decision',
    '',
    '**Status: Proposed — project acceptance required.**',
    '',
    `Engine ${r.engine_version}; catalog ${r.catalog_version}; services ${r.services_version}; analysis ${report.analysis_version}.`,
    `Input SHA-256: ${report.input_sha256 ?? 'Not recorded for invalid input'}.`,
    '',
    '## Original result',
    '',
    md(r.summary),
    `Result: ${r.status}.`,
    '',
  ];
  if (r.stack) {
    for (const layer of ['frontend', 'backend', 'database', 'hosting'] as const)
      lines.push(
        `- ${layer}: ${md(r.stack[layer].choice)} — ${md(r.stack[layer].justification)}`,
      );
    lines.push(
      '',
      `Monthly infrastructure/operations band (activity fees additional): USD ${r.estimated_monthly_cost_usd.min}–${r.estimated_monthly_cost_usd.max}.`,
      '',
      '## Complete alternatives',
      '',
    );
    for (const plan of r.plan_comparison)
      lines.push(
        `- ${md(plan.plan_id)}; score ${plan.score}; USD ${plan.monthly_usd.min}–${plan.monthly_usd.max}; ${plan.selected ? 'selected' : 'alternative'}.`,
      );
    lines.push(
      '',
      '## Preference stability',
      '',
      `Original winner retained in ${p.retained_winner_settings}/${p.tested_settings} tested settings; ${p.distinct_winners} observed winners. Counts are not confidence probabilities.`,
      '',
      '## Cost assumptions',
      '',
      ...r.estimated_monthly_cost_usd.assumptions.map((a) => `- ${md(a)}`),
    );
  } else
    lines.push(
      'No approved stack or cost estimate is available for the original brief.',
    );
  lines.push(
    '',
    '## Blockers, validation and owner actions',
    '',
    ...r.validation_errors.map((e) => `- ${md(e.field)}: ${md(e.message)}`),
    ...r.warnings.map((w) => `- ${w.severity}: ${md(w.message)}`),
  );
  for (const action of r.review_actions)
    lines.push(`- ${md(action.fields.join(', '))}: ${md(action.next_action)}`);
  if (f.status === 'evaluated')
    lines.push(
      '',
      '## Changed-project experiments',
      '',
      `Checked ${f.tested_variants} eligible single/pair functional variants. Smallest successful edit count within this bounded set: ${f.smallest_successful_edit_count ?? 'none found'}. These do not satisfy the original requirements. No change is applied.`,
    );
  lines.push(
    '',
    '## Evidence register',
    '',
    ...report.evidence.map(
      (source) =>
        `- ${md(source.id)}: [${md(source.title)}](${source.url}); checked ${md(source.checked_on)}; ${md(source.scope)}`,
    ),
    '',
    '## Limits and acceptance',
    '',
    ...report.limitations.map((limit) => `- ${limit}`),
    '',
    'Acceptance, independent review, vendor eligibility, implementation and deployment remain owner tasks. No acceptance is recorded.',
    '',
  );
  return lines.join('\n');
}
