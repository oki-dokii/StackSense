import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { recommend } from '../dist/packages/engine/src/index.js';
import {
  serialize,
  validateOutput,
} from '../dist/packages/contracts/src/index.js';
const cases = JSON.parse(
  fs.readFileSync(new URL('../fixtures/stress-cases.json', import.meta.url)),
);
const records = cases.map((c) => {
  const r = recommend(c.scenario);
  if (validateOutput(r).length) throw Error(`Invalid ${c.id}`);
  return {
    id: c.id,
    primary_infrastructure:
      r.estimate_status === 'estimated'
        ? {
            min: r.estimated_monthly_cost_usd.min,
            max: r.estimated_monthly_cost_usd.max,
          }
        : null,
    options: r.budget_planning.options.map((o) => ({
      plan_id: o.plan_id,
      infrastructure: o.monthly_infrastructure_usd,
      total: o.monthly_total_usd,
      budget_fit: o.budget_fit,
      changes: o.changes,
      requires_acceptance: o.requires_acceptance,
      critical_conditions: o.warnings
        .filter((w) => w.severity === 'critical')
        .map((w) => w.code),
    })),
  };
});
const data = {
  scope:
    'Cash-cost scenarios and explicitly changed-requirement proposals; not workload, SLA or compliance validation.',
  case_set_sha256: createHash('sha256').update(serialize(cases)).digest('hex'),
  records,
  counts: {
    scenarios: records.length,
    proposals: records.filter((r) => r.options.length).length,
    proposal_upper_fits: records.filter((r) =>
      r.options.some((o) => o.budget_fit === 'within_upper'),
    ).length,
    proposal_range_risk: records.filter((r) =>
      r.options.some((o) => o.budget_fit === 'range_risk'),
    ).length,
    proposal_still_over: records.filter((r) =>
      r.options.some((o) => o.budget_fit === 'over_budget'),
    ).length,
  },
};
const target = new URL('../evaluation/budget-results.json', import.meta.url);
if (process.argv.includes('--check')) {
  if (serialize(JSON.parse(fs.readFileSync(target))) !== serialize(data))
    throw Error('Stale budget evaluation');
} else fs.writeFileSync(target, JSON.stringify(data, null, 2) + '\n');
console.log(JSON.stringify(data.counts));
