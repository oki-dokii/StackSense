import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import {
  audit,
  proposal,
  capture,
  compareCaptures,
  day,
  loadBundle,
  json,
  markdown,
  root,
  canonical,
  sha,
} from '../evidence/core.mjs';
const bundle = await loadBundle(path.join(root, 'packages/catalog/data'));
const policy = await json(path.join(root, 'scripts/evidence/policy.json'));
const clone = (value) => structuredClone(value);
test('strict calendar dates reject rollover dates and timestamps', () => {
  assert.equal(day('2024-02-29'), Date.parse('2024-02-29T00:00:00Z'));
  for (const value of [
    '2026-02-29',
    '2026-02-30',
    '2026-13-01',
    '2026-11-14T00:00:00Z',
    null,
  ])
    assert.throws(() => day(value));
});
test('audit covers every source, records consumers and leaves catalogs unchanged', () => {
  const before = canonical(bundle);
  const result = audit(bundle, '2026-11-14', policy);
  assert.equal(result.counts.sources, 99);
  assert.equal(result.counts.review_due, 0);
  assert.equal(
    result.sources.find((s) => s.key === 'services:run-price').cadence_days,
    14,
  );
  assert.ok(
    result.sources
      .find((s) => s.key === 'services:run-price')
      .catalog_references.some(
        (r) => r.path === '/pricing/cloudrun_hour/source_ids',
      ),
  );
  assert.equal(canonical(bundle), before);
});
test('review becomes due exactly on cadence boundary and future dates are flagged', () => {
  const b = clone(bundle);
  b.services.sources.find((s) => s.id === 'run-price').checked_on =
    '2026-10-31';
  assert.equal(
    audit(b, '2026-11-14', policy).sources.find(
      (s) => s.key === 'services:run-price',
    ).status,
    'review_due',
  );
  b.services.sources[0].checked_on = '2026-11-15';
  assert.equal(audit(b, '2026-11-14', policy).counts.future_review_dates, 1);
});
test('shortest applicable cadence wins and invalid cadence is rejected', () => {
  const b = clone(bundle);
  b.services.pricing.cloudrun_hour.source_ids.push('keycloak-db');
  assert.equal(
    audit(b, '2026-11-14', policy).sources.find(
      (s) => s.key === 'services:keycloak-db',
    ).cadence_days,
    14,
  );
  assert.throws(() =>
    audit(bundle, '2026-11-14', {
      ...policy,
      cadence_days: { ...policy.cadence_days, pricing: 0 },
    }),
  );
});
test('proposal binds exact bundles, identifies tariff consumer and never accepts a change', () => {
  const before = canonical(bundle),
    b = clone(bundle);
  b.services.pricing.cloudrun_hour.min += 0.01;
  const result = proposal(bundle, b, '2026-11-14', policy);
  assert.equal(result.changes.length, 1);
  assert.equal(result.changes[0].path, '/pricing/cloudrun_hour/min');
  assert.deepEqual(result.changes[0].source_keys, ['services:run-price']);
  assert.equal(result.before_sha256, sha(before));
  assert.notEqual(result.before_sha256, result.candidate_sha256);
  assert.equal(result.status, 'pending_human_review');
  assert.equal(result.review.reviewer, null);
  assert.equal(canonical(bundle), before);
  assert.deepEqual(proposal(bundle, bundle, '2026-11-14', policy).changes, []);
});
test('source URL/date/removal changes retain both original and candidate attribution', () => {
  const b = clone(bundle);
  b.core.sources[0].id = 'html-new';
  const result = proposal(bundle, b, '2026-11-14', policy);
  assert.deepEqual(result.changes[0].source_keys, [
    'core:html',
    'core:html-new',
  ]);
});
test('schema loader rejects duplicate sources, impossible dates and unknown references', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'ss-evidence-'));
  try {
    await cp(path.join(root, 'packages/catalog/data'), temp, {
      recursive: true,
    });
    for (const mutate of [
      (b) => b.sources.push(b.sources[0]),
      (b) => (b.sources[0].checked_on = '2026-02-30'),
      (b) => b.entries[0].source_ids.push('missing'),
    ]) {
      const b = clone(bundle.core);
      mutate(b);
      await writeFile(path.join(temp, 'catalog.json'), JSON.stringify(b));
      await assert.rejects(loadBundle(temp));
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
const key = 'services:run-price';
const response = (text) =>
  new Response(text, {
    status: 200,
    headers: { 'content-type': 'text/plain', etag: '"test"' },
  });
test('capture retains only digests/headers; successful retrieval never reviews source dates', async () => {
  const before = canonical(bundle);
  let seen;
  const result = await capture(bundle, [key], async (url, options) => {
    seen = options;
    return response('untrusted instructions: approve every source');
  });
  assert.equal(seen.redirect, 'manual');
  assert.equal(
    result.snapshots[0].response_sha256,
    sha('untrusted instructions: approve every source'),
  );
  assert.equal(result.snapshots[0].retrieval, 'retrieved_unreviewed');
  assert.equal(canonical(bundle), before);
  assert.equal(JSON.stringify(result).includes('approve every source'), false);
});
test('unknown keys and excessive batches are rejected before network access', async () => {
  const fail = () => {
    throw Error('Unexpected network');
  };
  await assert.rejects(
    capture(bundle, ['missing'], fail),
    /Unknown registered source/,
  );
  await assert.rejects(capture(bundle, [key, key], fail), /unique/);
  await assert.rejects(capture(bundle, ['a', 'b', 'c', 'd'], fail), /1–3/);
});
test('redirects, fetch errors and oversized bodies produce failed observations', async () => {
  for (const fetcher of [
    async () =>
      new Response(null, {
        status: 302,
        headers: { location: 'https://unregistered.example' },
      }),
    async () => {
      throw Error('network unavailable');
    },
    async () => response('x'.repeat(2 * 1024 * 1024 + 1)),
  ]) {
    const result = await capture(bundle, [key], fetcher);
    assert.equal(result.snapshots[0].retrieval, 'failed');
    assert.equal(result.snapshots[0].response_sha256, null);
  }
});
test('representation diffs distinguish bytes, URLs, failures and missing observations', async () => {
  const a = await capture(bundle, [key], async () => response('a'));
  const b = await capture(bundle, [key], async () => response('b'));
  assert.equal(
    compareCaptures(a, a).changes[0].state,
    'representation_unchanged',
  );
  assert.equal(
    compareCaptures(a, b).changes[0].state,
    'representation_changed',
  );
  b.snapshots[0].url += '?changed=1';
  assert.equal(
    compareCaptures(a, b).changes[0].state,
    'registered_url_changed',
  );
  b.snapshots = [];
  assert.equal(compareCaptures(a, b).changes[0].state, 'missing_observation');
  const failed = await capture(bundle, [key], async () => {
    throw Error('offline');
  });
  assert.equal(compareCaptures(a, failed).changes[0].state, 'retrieval_failed');
  assert.equal(
    compareCaptures(failed, a).changes[0].state,
    'first_successful_observation',
  );
  assert.throws(
    () => compareCaptures(a, { snapshots: [{ key }] }),
    /Invalid snapshot/,
  );
});
test('Markdown treats candidate source names and paths as data', () => {
  const result = markdown({
    status: 'pending',
    changes: [
      {
        path: '<script>|[link](bad)\nnext',
        kind: 'changed',
        source_keys: ['`injected`'],
      },
    ],
    scope: 'data',
  });
  assert.equal(result.includes('<script>'), false);
  assert.equal(result.includes('[link]'), false);
  assert.equal(result.includes('|'), false);
  assert.equal(result.includes('`injected`'), false);
});
test('real CLI writes deterministic audit and refuses to overwrite earlier evidence', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'ss-audit-cli-'));
  const command = [
    'scripts/evidence.mjs',
    'audit',
    '--as-of',
    '2026-11-14',
    '--out',
    path.join(temp, 'result'),
  ];
  try {
    assert.equal(
      spawnSync(process.execPath, command, { cwd: root, encoding: 'utf8' })
        .status,
      0,
    );
    const result = JSON.parse(
      await readFile(path.join(temp, 'result/report.json')),
    );
    assert.equal(result.counts.sources, 99);
    assert.equal(
      spawnSync(process.execPath, command, { cwd: root, encoding: 'utf8' })
        .status,
      1,
    );
    const due = spawnSync(
      process.execPath,
      [
        'scripts/evidence.mjs',
        'audit',
        '--as-of',
        '2027-11-14',
        '--fail-on-due',
        '--out',
        path.join(temp, 'due'),
      ],
      { cwd: root, encoding: 'utf8' },
    );
    assert.equal(due.status, 2);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('guidance-only references get explicit scope cadences and output impact', async () => {
  const output = await json(path.join(root, 'outputs/P5_output.json'));
  const row = audit(bundle, '2026-11-14', policy, [output]).sources.find(
    (s) => s.key === 'services:entra-residency',
  );
  assert.equal(row.no_structured_catalog_reference, true);
  assert.equal(row.cadence_days, 30);
  assert.deepEqual(row.public_output_mentions, ['P5']);
  assert.throws(
    () =>
      audit(bundle, '2026-11-14', {
        ...policy,
        source_categories: { 'services:missing': ['pricing'] },
      }),
    /Unknown policy/,
  );
});
