import type { Catalog, Layer } from '../../catalog/src/index.js';
import { compare } from '../../contracts/src/index.js';
import type { NormalizedScenario } from '../../contracts/src/index.js';
import type { RankedPlan, Selection, Features } from './types.js';
export function describeCoreSelection(
  layer: Layer,
  winner: RankedPlan,
  ranked: RankedPlan[],
  catalog: Catalog,
  scenario: NormalizedScenario,
  features: Features,
): Selection {
  const entry = winner.plan[layer];
  const other = ranked.find(
    (candidate) => candidate.plan[layer].id !== entry.id,
  );
  let alternatives: { choice: string; why_not: string }[];
  if (other)
    alternatives = [
      {
        choice: other.plan[layer].name,
        why_not:
          other.score < winner.score
            ? `Best compatible core plan using this option scored ${other.score}, below ${winner.score}; other layers may also differ.`
            : 'A compatible plan tied on score; the published operated-component/identifier tie-break selected the primary plan, not intrinsic product superiority.',
      },
    ];
  else {
    const rejected = catalog.entries
      .filter(
        (candidate) => candidate.layer === layer && candidate.id !== entry.id,
      )
      .sort((a, b) => compare(a.id, b.id))[0];
    // This is explicitly a catalog alternative, not a fabricated ranked feasible plan.
    alternatives = [
      {
        choice: rejected?.name ?? 'No other reviewed catalog option',
        why_not:
          'No compatible complete core plan with this different layer option survived the current reviewed constraints/edges. See candidate rejection trace; this is not proof that the product is inherently unsuitable.',
      },
    ];
  }
  const drivers: Record<Layer, string[]> = {
    frontend: [
      'project.platforms',
      'project.type',
      'requirements.seo_critical',
      'team.languages',
      ...(features.markdown || features.lowMemory
        ? ['project.description']
        : []),
    ],
    backend: [
      'project.type',
      'team.languages',
      'timeline.mvp_weeks',
      'requirements.auth',
      'requirements.realtime',
    ],
    database: [
      'project.type',
      'requirements.auth',
      'requirements.offline_support',
      'infrastructure.existing_systems',
      ...(features.ledger ? ['project.description'] : []),
    ],
    hosting: [
      'infrastructure.cloud_preference',
      'infrastructure.deployment_model',
      'infrastructure.data_residency',
      'team.has_devops',
    ],
  };
  const explanations: Record<Layer, string> = {
    frontend: `Covers requested targets ${scenario.project.platforms.join(', ')} with ${entry.rendering} rendering. Team languages: ${scenario.team.languages.join(', ') || 'unspecified'}. ${features.markdown ? 'Markdown content authoring was explicitly considered.' : ''}`,
    backend:
      entry.runtime === 'none'
        ? 'Static content has no inferred dynamic server requirement; omitting the backend avoids an unnecessary operated application.'
        : `Provides a ${entry.runtime} application runtime for the ${scenario.project.type} profile. Language familiarity and delivery complexity were compared across compatible whole plans.`,
    database:
      entry.model === 'none'
        ? 'No server persistence need was inferred; a database is omitted from this core plan.'
        : `${entry.model} persistence via ${winner.plan.database_deployment}. ${features.ledger ? 'The described ledger requires a reviewed relational profile.' : ''} Database drivers and host deployment were checked as a combination.`,
    hosting: `Matches ${scenario.infrastructure.deployment_model} with provider ${entry.provider}; ${winner.plan.primary_region ? `reviewed primary compute region ${winner.plan.primary_region}` : 'no country/region assurance was requested or inferred'}. Required runtimes and separate database deployment were checked.`,
  };
  const managed =
    layer === 'database'
      ? winner.plan.hosting.managed_databases?.find(
          (item) => item.database_id === entry.id,
        )
      : undefined;
  const sourceIds = [
    ...new Set([
      ...entry.source_ids,
      ...(managed?.source_ids ?? []),
      ...(managed?.regions.find(
        (item) => item.region === winner.plan.database_region,
      )?.source_ids ?? []),
      ...(layer === 'hosting'
        ? (winner.plan.hosting.regions?.find(
            (item) => item.region === winner.plan.primary_region,
          )?.source_ids ?? [])
        : []),
    ]),
  ].sort(compare);
  return {
    layer,
    id: entry.id,
    choice: entry.name,
    source_ids: sourceIds,
    justification: explanations[layer].trim(),
    driven_by: drivers[layer],
    alternatives,
    tradeoffs: [...entry.tradeoffs],
  };
}
