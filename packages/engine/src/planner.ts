import type { Catalog, Entry, Layer } from '../../catalog/src/index.js';
import type { NormalizedScenario } from '../../contracts/src/index.js';
import { domains, compatiblePlan } from './constraints.js';
import { rankPlan, compareRanked } from './scoring.js';
import {
  SearchLimitError,
  type Features,
  type RankedPlan,
  type Rejection,
  type Style,
} from './types.js';
export function searchCorePlans(
  catalog: Catalog,
  scenario: NormalizedScenario,
  features: Features,
  maxAssignments = 100_000,
): { ranked: RankedPlan[]; rejections: Rejection[]; explored: number } {
  if (!Number.isSafeInteger(maxAssignments) || maxAssignments < 1)
    throw new Error('maxAssignments must be a positive safe integer.');
  const style: Style = features.staticEligible ? 'static' : 'modular_monolith';
  const { values, rejections } = domains(catalog, scenario, features, style);
  const ranked: RankedPlan[] = [];
  let explored = 0;
  // Smallest domains first; deterministic lexical ties. No top-K eligibility truncation.
  const layers = (Object.keys(values) as Layer[]).sort(
    (a, b) =>
      values[a].length - values[b].length || (a < b ? -1 : a > b ? 1 : 0),
  );
  const partial: Partial<Record<Layer, Entry>> = {};
  function visit(depth: number): void {
    if (depth === layers.length) {
      if (++explored > maxAssignments)
        throw new SearchLimitError(
          `Search exceeded ${maxAssignments} complete assignments; no feasibility conclusion is returned.`,
        );
      const result = compatiblePlan(
        partial.frontend!,
        partial.backend!,
        partial.database!,
        partial.hosting!,
        style,
        scenario,
      );
      if (result.plan) ranked.push(rankPlan(result.plan, scenario, features));
      else
        rejections.push({
          layer: 'plan',
          candidate_id: [
            partial.frontend!.id,
            partial.backend!.id,
            partial.database!.id,
            partial.hosting!.id,
          ].join('|'),
          code: 'COMBINATION_INCOMPATIBLE',
          message: result.reason,
          fields: [
            'infrastructure.deployment_model',
            'infrastructure.data_residency',
          ],
        });
      return;
    }
    const layer = layers[depth]!;
    for (const entry of values[layer]) {
      partial[layer] = entry;
      // Sound early pruning: a missing reviewed backend/database edge can never be repaired by another host.
      if (
        partial.backend &&
        partial.database &&
        !partial.backend.databases!.includes(partial.database.id)
      )
        continue;
      visit(depth + 1);
    }
    delete partial[layer];
  }
  visit(0);
  ranked.sort(compareRanked);
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
  return { ranked, rejections, explored };
}
