import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, appendFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  run,
  summarize,
  validateProfile,
  correctBody,
} from '../../benchmarks/reference/run.mjs';
import { verify } from '../../benchmarks/reference/verify.mjs';
import { products } from '../../benchmarks/reference/workload.mjs';
const profile = JSON.parse(
  await readFile(
    new URL('../../benchmarks/reference/profile.json', import.meta.url),
  ),
);
test('nearest-rank percentiles include failed requests and enforce each threshold', () => {
  const samples = Array.from({ length: 100 }, (_, i) => ({
    latency_ms: i + 1,
    ok: i !== 0,
  }));
  const result = summarize(samples, 2000, {
    p95_ms: 94,
    error_rate: 0,
    min_requests: 101,
  });
  assert.equal(result.p95_ms, 95);
  assert.equal(result.p99_ms, 99);
  assert.equal(result.requests_per_second, 50);
  assert.deepEqual(result.checks, {
    p95: false,
    error_rate: false,
    min_requests: false,
  });
  assert.equal(result.passed, false);
});
test('threshold boundaries pass and empty samples fail', () => {
  assert.equal(
    summarize([{ latency_ms: 5, ok: true }], 1000, {
      p95_ms: 5,
      error_rate: 0,
      min_requests: 1,
    }).passed,
    true,
  );
  assert.throws(() => summarize([], 1, {}));
});
test('unbounded profiles are rejected before any workload starts', () => {
  for (const change of [
    { duration_ms: Infinity },
    { concurrency: [65] },
    { concurrency: [] },
    { timeout_ms: 0 },
    { thresholds: { ...profile.thresholds, error_rate: NaN } },
  ])
    assert.throws(() => validateProfile({ ...profile, ...change }));
});
test('response validation detects corrupt and incomplete catalog data', () => {
  assert.deepEqual(products[42], {
    id: 42,
    name: 'Product 42',
    category: 42,
    price_cents: 142,
  });
  assert.equal(correctBody('read', 42, products[42]), true);
  assert.equal(
    correctBody('read', 42, { ...products[42], price_cents: 1 }),
    false,
  );
  assert.equal(
    correctBody('search', 2, { category: 2, items: [products[2]] }),
    false,
  );
});
test('real child HTTP run writes verifiable raw evidence and a deliberate failed gate', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'stacksense-calibration-'));
  try {
    const output = path.join(root, 'run');
    const report = await run(
      {
        ...profile,
        warmup_requests: 2,
        duration_ms: 100,
        concurrency: [2],
        max_samples_per_stage: 20,
        thresholds: { ...profile.thresholds, min_requests: 21 },
      },
      output,
    );
    assert.equal(report.passed, false);
    assert.equal(report.stages[0].checks.min_requests, false);
    assert.equal(report.stages[0].errors, 0);
    const raw = await readFile(path.join(output, report.stages[0].raw));
    assert.equal(
      createHash('sha256').update(raw).digest('hex'),
      report.stages[0].raw_sha256,
    );
    const samples = raw.toString().trim().split('\n').map(JSON.parse);
    assert.equal(samples.length, report.stages[0].requests);
    assert.equal(
      samples.filter((s) => s.kind === 'search').length,
      Math.ceil(samples.length / 5),
    );
    assert.deepEqual(
      JSON.parse(await readFile(path.join(output, 'summary.json'))),
      report,
    );
    await assert.rejects(run(profile, output), /EEXIST/);
    await verify(output);
    await appendFile(path.join(output, report.stages[0].raw), '\n');
    await assert.rejects(verify(output), /Raw sample hash mismatch/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
