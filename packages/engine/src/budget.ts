import type { NormalizedScenario } from '../../contracts/src/index.js';
import type { Recommendation } from '../../contracts/src/recommendation.generated.js';
import type {
  CompleteCandidate,
  FinalRecommendation,
} from './complete-types.js';
type Planning = NonNullable<Recommendation['budget_planning']>;
export const emptyBudgetPlanning = (): Planning => ({
  scope: 'optional_proposals_original_result_unchanged',
  budget_usd: null,
  cheapest_same_scope: null,
  options: [],
  notes: [],
});
const fit = (cost: { min: number; max: number }, budget: number) =>
  cost.max <= budget
    ? ('within_upper' as const)
    : cost.min <= budget
      ? ('range_risk' as const)
      : ('over_budget' as const);
const amount = (cost: { min: number; max: number }) => ({
  min: cost.min,
  max: cost.max,
});
export function budgetPlanning(
  s: NormalizedScenario,
  candidates: CompleteCandidate[],
  evaluate: (scenario: NormalizedScenario) => FinalRecommendation,
): Planning {
  const result = emptyBudgetPlanning();
  const cheapest = [...candidates].sort(
    (a, b) =>
      a.cost.max - b.cost.max ||
      a.cost.min - b.cost.min ||
      (a.plan.id < b.plan.id ? -1 : a.plan.id > b.plan.id ? 1 : 0),
  )[0];
  if (!cheapest) return result;
  const budget = s.budget.monthly_infra_usd;
  result.budget_usd = budget;
  for (const line of [...candidates[0]!.cost.line_items]
    .filter((l) => l.category !== 'payments' && l.id !== 'otp-delivery')
    .sort(
      (a, b) =>
        b.monthly_usd.max -
        b.monthly_usd.min -
        (a.monthly_usd.max - a.monthly_usd.min),
    )
    .slice(0, 3)) {
    const spread =
      Math.round((line.monthly_usd.max - line.monthly_usd.min) * 100) / 100;
    if (spread > 0)
      result.notes.push(
        `Infrastructure uncertainty: ${line.id} contributes USD ${spread} of the selected band width. Resolve quantity/rate assumptions rather than clipping the range to budget.`,
      );
  }
  result.cheapest_same_scope = {
    plan_id: cheapest.plan.id,
    core: {
      frontend: cheapest.plan.frontend.name,
      backend: cheapest.plan.backend.name,
      database: cheapest.plan.database.name,
      hosting: cheapest.plan.hosting.name,
    },
    monthly_infrastructure_usd: amount(cheapest.cost),
    budget_fit: fit(cheapest.cost, budget),
  };
  result.notes.push(
    'Lowest upper estimate among complete catalog candidates under the unchanged brief; not a claim of lowest real-world price, verified performance, or clearance of critical vendor conditions.',
  );
  if (candidates[0]!.cost.max <= budget) return result;
  const changed = structuredClone(s);
  const changes: Planning['options'][number]['changes'][number][] = [];
  if (
    s.infrastructure.deployment_model === 'managed_cloud' &&
    ['any', 'aws'].includes(s.infrastructure.cloud_preference)
  ) {
    changes.push({
      field: 'infrastructure.deployment_model',
      from: s.infrastructure.deployment_model,
      to: 'self_hosted_cloud_vm',
      consequence:
        'Operate Linux, TLS, database backups/recovery, identity, security updates and capacity yourself; additional operating labor and new expertise are excluded from the cash estimate.',
    });
    changed.infrastructure.deployment_model = 'self_hosted_cloud_vm';
  }
  if (s.requirements.availability !== '99') {
    changes.push({
      field: 'requirements.availability',
      from: s.requirements.availability,
      to: '99',
      consequence:
        'Lower the target to 99%; this does not provide an SLA or equivalent resilience, and is not an automatic production or compliance approval.',
    });
    changed.requirements.availability = '99';
  }
  const [firstChange, ...otherChanges] = changes;
  if (!firstChange) return result;
  const proposal = evaluate(changed);
  if (
    !proposal.stack ||
    proposal.estimated_monthly_cost_usd.max >= candidates[0]!.cost.max
  ) {
    result.notes.push(
      'The bounded availability/self-managed experiment found no cheaper usable proposal. No feature, region, provider, team or compliance field was silently changed.',
    );
    return result;
  }
  result.options.push({
    id: 'explicit_budget_tradeoff',
    requires_acceptance: true,
    changes: [firstChange, ...otherChanges],
    core: {
      frontend: proposal.stack.frontend.choice,
      backend: proposal.stack.backend.choice,
      database: proposal.stack.database.choice,
      hosting: proposal.stack.hosting.choice,
    },
    supporting_services: proposal.stack.supporting?.map((c) => c.choice) ?? [],
    plan_id: proposal.decision_trace.selected_plan_id!,
    primary_region:
      typeof proposal.primary_region === 'string'
        ? proposal.primary_region
        : null,
    monthly_infrastructure_usd: amount(proposal.estimated_monthly_cost_usd),
    monthly_total_usd: amount(proposal.estimated_total_monthly_cost_usd!),
    budget_fit: fit(proposal.estimated_monthly_cost_usd, budget),
    warnings: [
      ...proposal.warnings,
      {
        code: 'BUDGET_REQUIREMENT_CHANGE',
        severity: 'critical',
        message:
          'Optional changed-requirement proposal only. Original recommendation is unchanged. Accept each listed edit explicitly and rerun; reduced availability/self-management is not an equivalent deployment or production approval.',
        fields: changes.map((c) => c.field),
      },
    ],
    assumptions: [
      ...proposal.assumptions,
      ...proposal.estimated_monthly_cost_usd.assumptions,
      'Original feature flags, platforms, scale, languages, provider preference, residency and compliance requests remain unchanged. All vendor/contract exceptions and capacity hypotheses still require review.',
    ],
  });
  return result;
}
