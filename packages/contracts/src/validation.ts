import { Ajv, type ErrorObject } from 'ajv';
import { scenarioSchema, recommendationSchema } from './schemas.js';
import { compare } from './canonical.js';
import type { Recommendation } from './recommendation.generated.js';
import type { ValidationIssue } from './types.js';

const ajv = new Ajv({
  allErrors: true,
  coerceTypes: false,
  useDefaults: false,
  removeAdditional: false,
  strict: false,
  strictNumbers: true,
});
const inputValidator = ajv.compile(scenarioSchema);
const outputValidator = ajv.compile(recommendationSchema);
export const MAX_INPUT_BYTES = 2 * 1024 * 1024;
export const MAX_BATCH_ITEMS = 100;
export const MAX_DEPTH = 32;
const unsafeKeys = new Set(['__proto__', 'prototype', 'constructor']);

function errorPath(error: ErrorObject): string {
  const segments = error.instancePath
    .split('/')
    .slice(1)
    .map((item) => item.replace(/~1/g, '/').replace(/~0/g, '~'));
  if (error.keyword === 'required')
    segments.push(String(error.params.missingProperty));
  return segments.join('.') || '$';
}
export function sortIssues(issues: ValidationIssue[]): ValidationIssue[] {
  const unique = new Map(
    issues.map((issue) => [`${issue.field}\0${issue.message}`, issue]),
  );
  return [...unique.values()].sort(
    (a, b) => compare(a.field, b.field) || compare(a.message, b.message),
  );
}
/** Guard even programmatic callers: finite JSON values, bounded nesting, no cycles/prototype keys. */
export function inspectJson(value: unknown): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  const ancestors = new Set<object>();
  let nodes = 0;
  function walk(item: unknown, path: string, depth: number): void {
    if (++nodes > 100_000) {
      if (nodes === 100_001)
        errors.push({
          field: '$',
          message: 'Input exceeds 100,000 JSON values.',
        });
      return;
    }
    if (depth > MAX_DEPTH) {
      errors.push({
        field: path,
        message: `Input nesting exceeds ${MAX_DEPTH} levels.`,
      });
      return;
    }
    if (typeof item === 'number' && !Number.isFinite(item))
      errors.push({ field: path, message: 'Must be a finite JSON number.' });
    if (['undefined', 'function', 'symbol', 'bigint'].includes(typeof item))
      errors.push({ field: path, message: 'Must be a JSON value.' });
    if (item === null || typeof item !== 'object') return;
    if (ancestors.has(item)) {
      errors.push({
        field: path,
        message: 'Circular references are not valid JSON.',
      });
      return;
    }
    if (
      !Array.isArray(item) &&
      ![Object.prototype, null].includes(Object.getPrototypeOf(item))
    ) {
      errors.push({ field: path, message: 'Must be a plain JSON object.' });
      return;
    }
    ancestors.add(item);
    for (const [key, child] of Object.entries(item)) {
      const childPath = path === '$' ? key : `${path}.${key}`;
      if (unsafeKeys.has(key))
        errors.push({
          field: childPath,
          message: 'Unsafe object key is not allowed.',
        });
      else walk(child, childPath, depth + 1);
    }
    ancestors.delete(item);
  }
  walk(value, '$', 0);
  return sortIssues(errors);
}
/** Parse only; validate each scenario separately so an unsafe batch item does not stop its siblings. */
export function parseJson(text: string): {
  value: unknown;
  errors: ValidationIssue[];
} {
  if (Buffer.byteLength(text, 'utf8') > MAX_INPUT_BYTES)
    return {
      value: null,
      errors: [{ field: '$', message: 'JSON input exceeds the 2 MiB limit.' }],
    };
  try {
    const value: unknown = JSON.parse(text);
    return { value, errors: [] };
  } catch {
    return {
      value: null,
      errors: [
        {
          field: '$',
          message: 'Invalid JSON. Check quotes, commas, and brackets.',
        },
      ],
    };
  }
}
export function validateInput(value: unknown): ValidationIssue[] {
  const safety = inspectJson(value);
  if (safety.length) return safety;
  if (inputValidator(value)) return [];
  return sortIssues(
    (inputValidator.errors ?? []).map((error) => ({
      field: errorPath(error),
      message: error.message ?? 'Invalid value.',
    })),
  );
}
export function validateOutput(value: unknown): ValidationIssue[] {
  const safety = inspectJson(value);
  if (safety.length) return safety;
  if (!outputValidator(value))
    return sortIssues(
      (outputValidator.errors ?? []).map((error) => ({
        field: errorPath(error),
        message: error.message ?? 'Invalid value.',
      })),
    );
  const result = value as {
    estimated_monthly_cost_usd: { min: number; max: number };
  };
  if (
    result.estimated_monthly_cost_usd.min >
    result.estimated_monthly_cost_usd.max
  )
    return [
      {
        field: 'estimated_monthly_cost_usd',
        message: 'min must not exceed max.',
      },
    ];
  const report = value as Recommendation;
  const errors: ValidationIssue[] = [];
  const issue = (field: string, message: string) =>
    errors.push({ field, message });
  if (report.estimated_total_monthly_cost_usd) {
    const total = report.estimated_total_monthly_cost_usd;
    if (total.min > total.max)
      issue('estimated_total_monthly_cost_usd', 'min must not exceed max.');
    if (report.cost_groups?.length)
      for (const bound of ['min', 'max'] as const) {
        const cents = report.cost_groups.reduce(
          (n, g) => n + Math.round(g[bound] * 100),
          0,
        );
        if (cents !== Math.round(total[bound] * 100))
          issue(
            'estimated_total_monthly_cost_usd',
            'Total must reconcile to every infrastructure and activity category.',
          );
      }
  }
  if (report.budget_planning) {
    const planning = report.budget_planning;
    if (planning.options.length > 1)
      issue(
        'budget_planning.options',
        'At most one explicitly changed-requirement proposal is supported.',
      );
    for (const option of planning.options) {
      const changes = option.changes;
      if (
        new Set(changes.map((c) => c.field)).size !== changes.length ||
        changes.some((c) => c.from === c.to)
      )
        issue(
          'budget_planning.options',
          'Changes must be distinct and must change a requirement.',
        );
      if (
        !option.warnings.some(
          (w) =>
            w.severity === 'critical' && w.code === 'BUDGET_REQUIREMENT_CHANGE',
        )
      )
        issue(
          'budget_planning.options',
          'Changed-requirement proposals must carry the critical scope-change condition.',
        );
      for (const amount of [
        option.monthly_infrastructure_usd,
        option.monthly_total_usd,
      ])
        if (amount.min > amount.max)
          issue('budget_planning.options', 'Cost bounds must be ordered.');
      if (
        option.monthly_total_usd.min < option.monthly_infrastructure_usd.min ||
        option.monthly_total_usd.max < option.monthly_infrastructure_usd.max
      )
        issue(
          'budget_planning.options',
          'Total cannot exclude infrastructure spend.',
        );
      const budget = planning.budget_usd;
      const fit =
        budget === null
          ? 'over_budget'
          : option.monthly_infrastructure_usd.max <= budget
            ? 'within_upper'
            : option.monthly_infrastructure_usd.min <= budget
              ? 'range_risk'
              : 'over_budget';
      if (option.budget_fit !== fit)
        issue(
          'budget_planning.options',
          'Budget fit must match the infrastructure band and declared budget.',
        );
    }
  }
  for (const [index, group] of (report.cost_groups ?? []).entries())
    if (group.min > group.max)
      issue(`cost_groups.${index}`, 'min must not exceed max.');
  if (report.cost_groups?.length) {
    const includedGroups =
      report.estimated_cost_scope === 'infrastructure_and_operations'
        ? report.cost_groups.filter(
            (g) => g.category === 'infrastructure_and_operations',
          )
        : report.cost_groups;
    const min = includedGroups.reduce((n, g) => n + Math.round(g.min * 100), 0);
    const max = includedGroups.reduce((n, g) => n + Math.round(g.max * 100), 0);
    if (
      min !== Math.round(result.estimated_monthly_cost_usd.min * 100) ||
      max !== Math.round(result.estimated_monthly_cost_usd.max * 100)
    )
      issue(
        'cost_groups',
        'Included category totals must reconcile to the declared monthly estimate scope.',
      );
  }
  for (const [i, sensitivity] of (report.cost_sensitivity ?? []).entries())
    for (const [j, sample] of sensitivity.samples.entries()) {
      if (
        sample.status === 'estimated'
          ? sample.min === null ||
            sample.max === null ||
            sample.upper_delta_usd === null ||
            sample.min < 0 ||
            sample.min > sample.max
          : sample.min !== null ||
            sample.max !== null ||
            sample.upper_delta_usd !== null
      )
        issue(
          `cost_sensitivity.${i}.samples.${j}`,
          'Estimated samples require an ordered nonnegative band and delta; model limits require null values.',
        );
      else if (
        sample.status === 'estimated' &&
        Math.round(sample.upper_delta_usd! * 100) !==
          Math.round(sample.max! * 100) -
            Math.round(
              (sensitivity.cost_category === 'payment_and_message_activity'
                ? (report.cost_groups?.find(
                    (g) => g.category === 'payment_and_message_activity',
                  )?.max ?? 0)
                : result.estimated_monthly_cost_usd.max) * 100,
            )
      )
        issue(
          `cost_sensitivity.${i}.samples.${j}`,
          'Delta must use the original selected-plan upper estimate.',
        );
    }
  const plans = report.plan_comparison ?? [];
  if (plans.length) {
    if (
      !report.stack ||
      plans.filter((plan) => plan.selected).length !== 1 ||
      !plans[0]!.selected
    )
      issue(
        'plan_comparison',
        'A feasible comparison must begin with exactly one selected plan.',
      );
    const selected = plans[0]!;
    if (
      selected.monthly_usd.min !== result.estimated_monthly_cost_usd.min ||
      selected.monthly_usd.max !== result.estimated_monthly_cost_usd.max
    )
      issue(
        'plan_comparison',
        'Selected comparison cost must match the result.',
      );
    if (new Set(plans.map((plan) => plan.plan_id)).size !== plans.length)
      issue('plan_comparison', 'Plan identifiers must be unique.');
    for (const [i, plan] of plans.entries())
      if (
        plan.monthly_usd.min > plan.monthly_usd.max ||
        plan.score_delta !== plan.score - selected.score ||
        plan.tied_on_score !== (!plan.selected && plan.score === selected.score)
      )
        issue(
          `plan_comparison.${i}`,
          'Cost interval, score difference or tie flag is inconsistent.',
        );
  }
  if (
    (report.status === 'infeasible' || report.status === 'invalid_input') &&
    ((report.cost_sensitivity?.length ?? 0) ||
      plans.length ||
      (report.cost_groups?.length ?? 0))
  )
    issue(
      'plan_comparison',
      'Unusable results cannot contain priced plans or sensitivity.',
    );
  if (
    report.review_actions &&
    new Set(report.review_actions.map((action) => action.id)).size !==
      report.review_actions.length
  )
    issue('review_actions', 'Review action identifiers must be unique.');
  return sortIssues(errors);
}
