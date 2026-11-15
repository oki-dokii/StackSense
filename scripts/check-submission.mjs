import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { recommend } from '../dist/packages/engine/src/index.js';
import {
  serialize,
  validateOutput,
} from '../dist/packages/contracts/src/index.js';
const root = fileURLToPath(new URL('../', import.meta.url));
const inputs = JSON.parse(
  await readFile(
    new URL('../fixtures/public/scenarios.json', import.meta.url),
    'utf8',
  ),
);
const results = [];
for (const input of inputs) {
  const base = recommend(input),
    changed = structuredClone(input);
  changed.scenario_id = 'unrelated-id';
  changed.project.name = 'Unrelated project';
  changed.project.platforms.reverse();
  changed.team.languages.reverse();
  if (
    !base.stack ||
    serialize(base.stack) !== serialize(recommend(changed).stack) ||
    validateOutput(base).length
  )
    throw Error(`Recommendation/metamorphic failure ${input.scenario_id}`);
  const args = [
    'dist/apps/cli/src/main.js',
    '--recommend',
    '--input',
    `fixtures/public/${input.scenario_id}.json`,
  ];
  const plain = execFileSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
  });
  const disabled = execFileSync(process.execPath, [...args, '--no-llm'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (plain !== disabled || serialize(JSON.parse(disabled)) !== serialize(base))
    throw Error(`LLM-off CLI mismatch ${input.scenario_id}`);
  results.push({
    scenario_id: input.scenario_id,
    status: base.status,
    stack_present: true,
    critical_warnings: base.warnings
      .filter((w) => w.severity === 'critical')
      .map((w) => w.code),
    infrastructure_usd: {
      min: base.estimated_monthly_cost_usd.min,
      max: base.estimated_monthly_cost_usd.max,
    },
    llm_off_exact_match: true,
    identifier_and_order_invariance: true,
  });
}
const history = execFileSync('git', ['log', '--format=%H%x09%aI%x09%cI'], {
  cwd: root,
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .map((row) => {
    const [sha, author, committer] = row.split('\t');
    return { sha, author, committer };
  });
const release = Date.parse('2026-11-10T10:00:00+05:30');
const record = {
  engine_version: '0.9.0',
  public_results: results,
  history: {
    available_commits: history.length,
    earliest_author_date: history.map((r) => r.author).sort()[0],
    earliest_committer_date: history.map((r) => r.committer).sort()[0],
    commits_with_author_or_committer_date_before_release: history.filter(
      (r) =>
        Date.parse(r.author) < release || Date.parse(r.committer) < release,
    ).length,
    scope:
      'Available repository history only. Timestamps support a timeline; they do not establish original authorship or rule compliance.',
  },
};
await writeFile(
  new URL('../evaluation/submission-checks.json', import.meta.url),
  JSON.stringify(record, null, 2) + '\n',
);
console.log(
  'PASS: all six public stacks; exact LLM-off parity; identifier/order invariance; repository history dates recorded.',
);
