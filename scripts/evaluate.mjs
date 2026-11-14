import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { recommend } from '../dist/packages/engine/src/index.js';
import {
  validateOutput,
  serialize,
} from '../dist/packages/contracts/src/index.js';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cases = JSON.parse(
  await readFile(join(root, 'evaluation/cases.json'), 'utf8'),
);
await mkdir(join(root, 'evaluation/outputs'), { recursive: true });
const records = [];
for (const item of cases) {
  const result = recommend(item.scenario);
  const errors = validateOutput(result);
  if (errors.length || result.status !== item.expect.status)
    throw new Error(
      `Evaluation invariant failed for ${item.id}: ${JSON.stringify(errors)} ${result.status}`,
    );
  await writeFile(
    join(root, `evaluation/outputs/${item.id}_output.json`),
    serialize(result, true),
  );
  records.push({
    id: item.id,
    category: item.category,
    status: result.status,
    selected_plan_id: result.decision_trace.selected_plan_id,
    cost:
      result.estimate_status === 'estimated'
        ? {
            min: result.estimated_monthly_cost_usd.min,
            max: result.estimated_monthly_cost_usd.max,
          }
        : null,
    warnings: result.warnings.map((item) => item.code),
  });
}
const base = structuredClone(cases.find((item) => item.id === 'E08').scenario);
base.team.languages = ['javascript'];
base.budget.monthly_infra_usd = 10000;
const changes = [
  ['expected_requests_per_second', 1, 1000, {}],
  ['monthly_egress_gb', 1, 10000, {}],
  ['retention_months', 1, 24, {}],
  ['monthly_otp_count', 100, 10000, { auth: 'phone_otp' }],
  ['monthly_payment_transactions', 100, 10000, { payments: true }],
  ['average_payment_value_usd', 10, 100, { payments: true }],
];
const sensitivity = [];
for (const [field, low, high, requirements] of changes) {
  const input = structuredClone(base);
  input.requirements = requirements;
  input.extensions = { monthly_payment_transactions: 100, [field]: low };
  const first = recommend(input);
  input.extensions[field] = high;
  const second = recommend(input);
  const category = [
    'monthly_otp_count',
    'monthly_payment_transactions',
    'average_payment_value_usd',
  ].includes(field)
    ? 'payment_and_message_activity'
    : 'infrastructure_and_operations';
  const firstCost = first.cost_groups.find((g) => g.category === category);
  const secondCost = second.cost_groups.find((g) => g.category === category);
  if (!first.stack || !second.stack || firstCost?.max === secondCost?.max)
    throw new Error(`No demonstrated cost effect for ${field}`);
  sensitivity.push({
    field,
    cost_category: category,
    values: [low, high],
    low_cost: {
      min: firstCost.min,
      max: firstCost.max,
    },
    high_cost: {
      min: secondCost.min,
      max: secondCost.max,
    },
    low_plan: first.decision_trace.selected_plan_id,
    high_plan: second.decision_trace.selected_plan_id,
  });
}
const publicCases = JSON.parse(
  await readFile(join(root, 'fixtures/public/scenarios.json'), 'utf8'),
);
await writeFile(
  join(root, 'evaluation/ui-scenarios.json'),
  serialize(
    [...publicCases, ...cases.slice(0, 9).map((item) => item.scenario)],
    true,
  ),
);
await writeFile(
  join(root, 'evaluation/results.json'),
  serialize(
    {
      engine_version: recommend(publicCases[0]).engine_version,
      case_set_sha256: createHash('sha256')
        .update(await readFile(join(root, 'evaluation/cases.json')))
        .digest('hex'),
      scope:
        'Author-designed unseen-style invariants; not organizer hidden tests or independent expert review.',
      records,
    },
    true,
  ),
);
await writeFile(
  join(root, 'evaluation/sensitivity.json'),
  serialize(sensitivity, true),
);
console.log(
  `PASS: ${records.length} actual evaluations, six usage-input sensitivity experiments, and UI evidence inputs.`,
);
