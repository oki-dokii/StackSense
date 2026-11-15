import type { NormalizedScenario } from '../../contracts/src/index.js';
import type { CorePlan } from './types.js';

/** A scoped preference, not a claim that GDPR mandates EU-only hosting. */
export function prefersEuForGdpr(s: NormalizedScenario): boolean {
  return s.compliance.includes('gdpr') && s.infrastructure.data_residency === 'none';
}

/** Only explicit catalog mappings count; unknown/on-prem/global is not EU. */
export function hasReviewedEuLocations(plan: CorePlan): boolean {
  const compute = plan.hosting.regions?.some((region) =>
    region.residency === 'eu' && region.region === plan.primary_region);
  if (!compute) return false;
  if (plan.database.model === 'none') return true;
  if (plan.database_existing) return false;
  const managed = plan.hosting.managed_databases?.find((item) =>
    item.database_id === plan.database.id);
  return managed
    ? managed.regions.some((region) =>
        region.residency === 'eu' && region.region === plan.database_region)
    : plan.database_region === plan.primary_region;
}
