import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { recommend } from '../dist/packages/engine/src/index.js';
import {
  serialize,
  validateOutput,
} from '../dist/packages/contracts/src/index.js';
const read = async (p) =>
  JSON.parse(await readFile(new URL(`../${p}`, import.meta.url), 'utf8'));
const cases = await read('fixtures/stress-cases.json');
const catalog = await read('packages/catalog/data/catalog.json');
const byId = new Map(catalog.entries.map((e) => [e.id, e]));
const hash = (data) =>
  createHash('sha256').update(serialize(data)).digest('hex');
const temporary = await mkdtemp(path.join(os.tmpdir(), 'stacksense-stress-'));
let cli;
try {
  const inputFile = path.join(temporary, 'inputs.json');
  await writeFile(inputFile, JSON.stringify(cases.map((c) => c.scenario)));
  const run = spawnSync(
    process.execPath,
    [
      'dist/apps/cli/src/main.js',
      '--recommend',
      '--batch',
      '--no-llm',
      '--input',
      inputFile,
    ],
    { encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 },
  );
  if (run.error || ![0, 3].includes(run.status))
    throw Error(`Stress CLI failed: ${run.error ?? run.stderr}`);
  cli = JSON.parse(run.stdout);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
const records = cases.map((c, index) => {
  const r = recommend(c.scenario),
    ids = r.decision_trace.selected_plan_id?.split('|');
  const checks = {
    valid_output: validateOutput(r).length === 0,
    deterministic_repeat: serialize(r) === serialize(recommend(c.scenario)),
    no_llm_cli_parity: serialize(r) === serialize(cli[index]),
    expected_critical_warning:
      !c.expect.critical_code ||
      r.warnings.some(
        (w) => w.code === c.expect.critical_code && w.severity === 'critical',
      ),
    expected_blocker:
      c.expect.usable ||
      r.warnings.some((w) =>
        (c.expect.blocker_codes ?? ['ML_DEPLOYMENT_COVERAGE_GAP']).includes(
          w.code,
        ),
      ),
    expected_usability: Boolean(r.stack) === c.expect.usable,
    provider:
      !ids ||
      !c.expect.provider ||
      byId.get(ids[4]).provider === c.expect.provider,
    known_backend_language:
      !ids ||
      ids[2] === 'backend-none' ||
      byId
        .get(ids[2])
        .languages.some((l) => c.scenario.team.languages.includes(l)),
    persistence: !ids || !c.expect.persistent || ids[3] !== 'database-none',
    api_only_omits_ui:
      !ids ||
      c.scenario.project.platforms.join(',') !== 'api_only' ||
      ids[1] === 'frontend-none',
    budget_warning:
      !ids ||
      r.estimated_monthly_cost_usd.min <= c.scenario.budget.monthly_infra_usd ||
      r.warnings.some((w) => w.code === 'BUDGET_EXCEEDED'),
  };
  return {
    id: c.id,
    title: c.title,
    project_type: c.scenario.project.type,
    input_sha256: hash(c.scenario),
    status: r.status,
    plan_id: r.decision_trace.selected_plan_id,
    provider: ids ? byId.get(ids[4]).provider : null,
    infrastructure_usd: {
      min: r.estimated_monthly_cost_usd.min,
      max: r.estimated_monthly_cost_usd.max,
    },
    band_ratio: r.estimated_monthly_cost_usd.min
      ? Number(
          (
            r.estimated_monthly_cost_usd.max / r.estimated_monthly_cost_usd.min
          ).toFixed(2),
        )
      : null,
    budget_usd: c.scenario.budget.monthly_infra_usd,
    over_budget_at_lower_bound: Boolean(
      ids &&
      r.estimated_monthly_cost_usd.min > c.scenario.budget.monthly_infra_usd,
    ),
    critical_warnings: r.warnings
      .filter((w) => w.severity === 'critical')
      .map((w) => w.code),
    checks,
  };
});
const counts = {
  scenarios: records.length,
  concrete_types: new Set(records.map((r) => r.project_type)).size,
  usable: records.filter((r) => r.plan_id).length,
  infeasible: records.filter((r) => !r.plan_id).length,
  failed_checks: records.flatMap((r) =>
    Object.entries(r.checks)
      .filter(([, ok]) => !ok)
      .map(([check]) => `${r.id}:${check}`),
  ),
  over_budget_at_lower_bound: records.filter(
    (r) => r.over_budget_at_lower_bound,
  ).length,
  bands_over_5x: records.filter((r) => r.band_ratio > 5).length,
  selected_providers: Object.fromEntries(
    [...new Set(records.map((r) => r.provider).filter(Boolean))]
      .sort()
      .map((p) => [p, records.filter((r) => r.provider === p).length]),
  ),
};
const report = {
  scope:
    'Author-designed functional stress evaluation; not organiser hidden tests, independent quality grading or production sizing validation.',
  engine_version: '0.9.0',
  case_set_sha256: hash(cases),
  catalog_sha256: hash(catalog),
  counts,
  records,
};
const target = new URL('../evaluation/stress-results.json', import.meta.url);
if (process.argv.includes('--check')) {
  if (
    serialize(await read('evaluation/stress-results.json')) !==
    serialize(report)
  )
    throw Error('Stale stress evaluation');
} else await writeFile(target, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(counts, null, 2));
if (counts.failed_checks.length) process.exitCode = 1;
