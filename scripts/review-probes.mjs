import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { recommend } from '../dist/packages/engine/src/index.js';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicCases = JSON.parse(
  await readFile(join(root, 'fixtures/public/scenarios.json'), 'utf8'),
);
const probes = [
  { id: 'P2-baseline', index: 1, patches: [] },
  {
    id: 'P2-auth-only-debug',
    index: 1,
    patches: [['requirements.auth', 'email_password']],
  },
  {
    id: 'P2-payments-only-debug',
    index: 1,
    patches: [['requirements.payments', false]],
  },
  {
    id: 'P6-auth-debug',
    index: 5,
    patches: [['requirements.auth', 'email_password']],
  },
  {
    id: 'P5-provider-debug',
    index: 4,
    patches: [['infrastructure.cloud_preference', 'any']],
  },
  {
    id: 'P3-zero-payment-volume-experiment',
    index: 2,
    patches: [['extensions.monthly_payment_transactions', 0]],
  },
];
const records = probes.map((probe) => {
  const raw = structuredClone(publicCases[probe.index]);
  for (const [path, value] of probe.patches) {
    const keys = path.split('.');
    let target = raw;
    for (const key of keys.slice(0, -1)) target = target[key] ??= {};
    target[keys.at(-1)] = value;
  }
  const result = recommend(raw);
  return {
    id: probe.id,
    source_scenario_id: publicCases[probe.index].scenario_id,
    patches: probe.patches.map(([field, value]) => ({ field, value })),
    status: result.status,
    estimate_status: result.estimate_status,
    cost:
      result.estimate_status === 'estimated'
        ? {
            min: result.estimated_monthly_cost_usd.min,
            max: result.estimated_monthly_cost_usd.max,
          }
        : null,
    critical_diagnostics: result.warnings
      .filter((warning) => warning.severity === 'critical')
      .map(({ code, fields, message }) => ({ code, fields, message })),
    selected_plan_id: result.decision_trace.selected_plan_id,
  };
});
await writeFile(
  join(root, 'docs/research/comparison/our-probes.json'),
  JSON.stringify(
    {
      engine_version: '0.5.0',
      scope:
        'Controlled diagnostics on our engine only. Changed inputs are not solutions satisfying the original public scenarios; hard constraints/features must not be silently revised.',
      records,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  JSON.stringify(
    records.map(({ id, status, cost, critical_diagnostics }) => ({
      id,
      status,
      cost,
      critical_codes: critical_diagnostics.map((item) => item.code),
    })),
    null,
    2,
  ),
);
