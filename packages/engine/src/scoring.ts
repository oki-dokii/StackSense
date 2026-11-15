import type { Entry } from '../../catalog/src/index.js';
import type { NormalizedScenario } from '../../contracts/src/index.js';
import type {
  CorePlan,
  Features,
  RankedPlan,
  ScorePart,
  Criterion,
} from './types.js';
const clamp = (value: number) => Math.max(0, Math.min(5, Math.round(value)));
const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 3;
export function rankPlan(
  plan: CorePlan,
  scenario: NormalizedScenario,
  features: Features,
): RankedPlan {
  const { frontend, backend, database, hosting } = plan;
  const products = [frontend, backend, database, hosting];
  const familiar = (entry: Entry) =>
    entry.languages.length === 0
      ? 3
      : entry.languages.some((language) =>
            scenario.team.languages.includes(language),
          )
        ? 5
        : 1;
  const clientServer = [frontend, backend].filter(
    (entry) => entry.languages.length > 0,
  );
  const skill = mean(clientServer.map(familiar));
  const serverDepth = backend.languages.filter((language) =>
    scenario.team.languages.includes(language),
  ).length;
  const ecosystemReuse =
    serverDepth >= 2 && ['senior', 'mixed'].includes(scenario.team.experience)
      ? 1
      : 0;
  const complexity = mean(products.map((entry) => entry.complexity));
  const operations =
    hosting.operations +
    (database.model !== 'none' &&
    scenario.infrastructure.deployment_model !== 'managed_cloud'
      ? 1
      : 0);
  const expectedGrowth =
    scenario.scale.users_12_months > scenario.scale.users_at_launch * 5;
  const concurrencyConcern =
    (scenario.scale.peak_concurrent_users ?? 0) >= 1000 ||
    scenario.scale.workload === 'write_heavy';
  const existingSql = scenario.infrastructure.existing_systems.some((system) =>
    /\bsql\s+server\b/i.test(system),
  );
  const relativeCost = mean(products.map((entry) => entry.cost_class));
  const fits: Record<
    Criterion,
    { fit: number; driven_by: string[]; reason: string }
  > = {
    cost: {
      fit:
        scenario.budget.monthly_infra_usd === 0 &&
        products.some((entry) => entry.cost_class > 0)
          ? 0
          : clamp(5 - relativeCost),
      driven_by: ['budget.monthly_infra_usd'],
      reason: `Relative resource-burden rubric ${relativeCost.toFixed(2)}; budget=${scenario.budget.monthly_infra_usd}. This is not a USD estimate or affordability verdict.`,
    },
    time_to_market: {
      fit: clamp(
        (skill + 6 - complexity) / 2 -
          (scenario.timeline.mvp_weeks <= 4 && complexity > 3 ? 1 : 0) -
          (scenario.team.experience === 'beginner' && complexity > 3 ? 1 : 0) -
          (features.markdown && frontend.id === 'html' ? 1 : 0) +
          ecosystemReuse,
      ),
      driven_by: [
        'team.languages',
        'team.experience',
        'timeline.mvp_weeks',
        ...(features.markdown ? ['project.description'] : []),
      ],
      reason: `Language familiarity ${skill.toFixed(2)}/5 and implementation-complexity rubric ${complexity.toFixed(2)}/5; short delivery/beginner-complexity and manual Markdown-conversion penalties are explicit heuristics; supported server-language depth ${serverDepth} gives ecosystem reuse bonus ${ecosystemReuse}.`,
    },
    scalability: {
      fit:
        plan.style === 'static'
          ? 5
          : clamp(
              3 +
                (hosting.provider !== 'none' &&
                scenario.infrastructure.deployment_model === 'managed_cloud' &&
                expectedGrowth
                  ? 1
                  : 0) -
                (database.model === 'embedded' && concurrencyConcern ? 2 : 0),
            ),
      driven_by: [
        'scale.users_at_launch',
        'scale.users_12_months',
        ...(scenario.scale.peak_concurrent_users !== undefined
          ? ['scale.peak_concurrent_users']
          : []),
        'scale.workload',
      ],
      reason:
        'Static delivery avoids application writes; embedded-writer and growth triggers are ordinal review heuristics, not published capacity limits.',
    },
    performance: {
      fit: clamp(
        (plan.style === 'static' ? 5 : 3) -
          (database.model === 'embedded' && concurrencyConcern ? 1 : 0),
      ),
      driven_by: [
        'scale.workload',
        ...(scenario.scale.peak_concurrent_users !== undefined
          ? ['scale.peak_concurrent_users']
          : []),
      ],
      reason:
        'No latency SLA or measured framework throughput is credited; embedded-write concurrency is a review heuristic. Low-memory clients require measurement, not an assumed framework benchmark.',
    },
    maintainability: {
      fit: clamp(
        (skill +
          5 -
          operations +
          (existingSql && database.id === 'sqlserver' ? 2 : 0)) /
          2 -
          (scenario.team.has_devops ? 0 : operations >= 4 ? 1 : 0) -
          (scenario.team.size <= 2 && operations >= 4 ? 1 : 0) +
          ecosystemReuse,
      ),
      driven_by: [
        'team.languages',
        'team.has_devops',
        'team.size',
        'infrastructure.existing_systems',
      ],
      reason: `Operational burden ${operations}/5+; ${existingSql && database.id === 'sqlserver' ? 'existing SQL Server integration receives a reuse preference' : 'no existing-system reuse bonus'}. Server ecosystem reuse bonus ${ecosystemReuse}; fewer self-operated systems are favored without DevOps.`,
    },
    security: {
      fit: 3,
      driven_by: ['priorities.security'],
      reason:
        'Neutral baseline only: no product receives unreviewed security/compliance credit. Configured controls and tenant isolation are Phase 3 requirements.',
    },
  };
  // Ordinal anchors are explicit engineering heuristics, not benchmark or staffing measurements.
  const breakdown: ScorePart[] = (Object.keys(fits) as Criterion[]).map(
    (criterion) => ({
      criterion,
      fit: fits[criterion].fit,
      weight: scenario.priorities[criterion],
      contribution: fits[criterion].fit * scenario.priorities[criterion],
      driven_by: [
        ...new Set([...fits[criterion].driven_by, `priorities.${criterion}`]),
      ],
      reason: fits[criterion].reason,
    }),
  );
  return {
    plan,
    score: breakdown.reduce((sum, part) => sum + part.contribution, 0),
    breakdown,
    operated_components:
      (backend.runtime !== 'none' ? 1 : 0) +
      (frontend.runtime === 'node' ? 1 : 0) +
      (database.model !== 'none' &&
      scenario.infrastructure.deployment_model !== 'managed_cloud'
        ? 1
        : 0),
  };
}
export function compareRanked(a: RankedPlan, b: RankedPlan): number {
  return (
    b.score - a.score ||
    a.operated_components - b.operated_components ||
    (a.plan.id < b.plan.id ? -1 : a.plan.id > b.plan.id ? 1 : 0)
  );
}
