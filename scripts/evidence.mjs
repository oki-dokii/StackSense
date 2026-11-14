import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import {
  audit,
  proposal,
  capture,
  compareCaptures,
  loadBundle,
  json,
  markdown,
  root,
} from './evidence/core.mjs';
export async function main(args) {
  const command = args.shift();
  const allowed = {
    audit: ['as-of', 'out', 'fail-on-due'],
    compare: ['base', 'candidate', 'as-of', 'out'],
    capture: ['keys', 'out'],
    'compare-captures': ['base', 'candidate', 'out'],
  };
  if (!allowed[command])
    throw Error(
      'Usage: node scripts/evidence.mjs audit|compare|capture|compare-captures --out <new-directory> [options]; see docs/PHASE_10.md',
    );
  const options = {};
  while (args.length) {
    const option = args.shift();
    if (!option.startsWith('--')) throw Error('Options must start with --');
    const key = option.slice(2);
    if (!allowed[command].includes(key) || key in options)
      throw Error(`Unknown or duplicate option ${key}`);
    if (key === 'fail-on-due') options[key] = true;
    else {
      const value = args.shift();
      if (!value || value.startsWith('--'))
        throw Error(`Missing value for ${key}`);
      options[key] = value;
    }
  }
  for (const required of allowed[command].filter((k) => k !== 'fail-on-due'))
    if (!options[required]) throw Error(`Missing --${required}`);
  const policy = await json(path.join(root, 'scripts/evidence/policy.json'));
  let report;
  if (command === 'audit') {
    const outputs = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        json(path.join(root, `outputs/P${i + 1}_output.json`)),
      ),
    );
    report = audit(
      await loadBundle(path.join(root, 'packages/catalog/data')),
      options['as-of'],
      policy,
      outputs,
    );
  } else if (command === 'compare') {
    report = proposal(
      await loadBundle(path.resolve(options.base)),
      await loadBundle(path.resolve(options.candidate)),
      options['as-of'],
      policy,
    );
  } else if (command === 'capture') {
    report = await capture(
      await loadBundle(path.join(root, 'packages/catalog/data')),
      options.keys.split(','),
    );
  } else
    report = compareCaptures(
      await json(path.resolve(options.base)),
      await json(path.resolve(options.candidate)),
    );
  const output = path.resolve(options.out);
  await mkdir(path.dirname(output), { recursive: true });
  await mkdir(output);
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(report, null, 2) + '\n',
    { flag: 'wx' },
  );
  await writeFile(path.join(output, 'report.md'), markdown(report), {
    flag: 'wx',
  });
  console.log(
    JSON.stringify(
      {
        command,
        output,
        counts: report.counts ?? {
          changes: report.changes?.length,
          snapshots: report.snapshots?.length,
        },
        status: report.status ?? 'offline_audit',
      },
      null,
      2,
    ),
  );
  return command === 'audit' &&
    options['fail-on-due'] &&
    (report.counts.review_due || report.counts.future_review_dates)
    ? 2
    : command === 'capture' &&
        report.snapshots.some((s) => s.retrieval === 'failed')
      ? 2
      : 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    });
