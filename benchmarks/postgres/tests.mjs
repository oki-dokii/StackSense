import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, cp, appendFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { verify } from './verify.mjs';
import { setTimeout as pause } from 'node:timers/promises';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { schedule, summarize, validateProfile } from './load.mjs';
import { createWorkload, correctBody, operation } from './workload.mjs';
const profile = JSON.parse(
  await readFile(new URL('./profile.json', import.meta.url)),
);
test('arrival schedule keeps offering load while a bounded request is busy', async () => {
  const p = {
    ...profile,
    duration_ms: 100,
    max_inflight: 1,
    max_start_lag_ms: 1000,
  };
  const result = await schedule({
    rate: 200,
    profile: p,
    request: async () => {
      await pause(40);
      return { ok: true };
    },
  });
  assert.equal(result.samples.length, 20);
  assert.ok(result.samples.some((s) => s.dropped === 'inflight_limit'));
  assert.ok(result.samples.filter((s) => !s.dropped).length < 20);
  assert.equal(summarize(result.samples, result.elapsed_ms, p).passed, false);
});
test('late generator records scheduler drops without catch-up requests', async () => {
  let calls = 0;
  const p = { ...profile, duration_ms: 100 };
  const result = await schedule({
    rate: 10,
    profile: p,
    now: () => (calls++ === 0 ? 0 : 100),
    sleep: async () => {},
    request: () => {
      throw Error('Must not be issued');
    },
  });
  assert.equal(result.samples[0].dropped, 'scheduler_lag');
  assert.equal(
    summarize(result.samples, result.elapsed_ms, p).p95_end_to_end_ms,
    null,
  );
});
test('p95 includes scheduling delay and errors; dropped slots have a separate denominator', () => {
  const samples = [
    { dropped: null, ok: true, end_to_end_ms: 10 },
    { dropped: null, ok: false, end_to_end_ms: 110 },
    { dropped: 'inflight_limit' },
  ];
  const result = summarize(samples, 1000, profile);
  assert.equal(result.p95_end_to_end_ms, 110);
  assert.equal(result.error_rate, 0.5);
  assert.equal(result.drop_rate, 1 / 3);
  assert.deepEqual(result.checks, {
    p95: false,
    error_rate: false,
    drop_rate: false,
  });
});
test('unsafe and oversized profiles are rejected', () => {
  for (const change of [
    { repetitions: 0 },
    { duration_ms: Infinity },
    { rates_per_second: [1001] },
    { rates_per_second: [] },
    { max_inflight: 1000 },
    { thresholds: { ...profile.thresholds, drop_rate: -1 } },
  ])
    assert.throws(() => validateProfile({ ...profile, ...change }));
});
test('operations and full product payload validation are deterministic', () => {
  assert.equal(
    Array.from({ length: 10 }, (_, i) => operation(i)).filter(
      (s) => s.kind === 'read',
    ).length,
    8,
  );
  const p = {
    id: 42,
    name: 'Product 42',
    category: 42,
    price_cents: 142,
    description: 'x'.repeat(256),
  };
  assert.equal(correctBody('read', 42, 0, p), true);
  assert.equal(
    correctBody('read', 42, 0, { ...p, description: 'short' }),
    false,
  );
  assert.equal(correctBody('write', 42, 17, { id: 17, product_id: 42 }), true);
  assert.equal(correctBody('write', 42, 17, { id: 18, product_id: 42 }), false);
  assert.equal(
    correctBody('search', 42, 0, { category: 42, items: [] }),
    false,
  );
});
test('invalid HTTP parameters are rejected before database access', async () => {
  const app = await createWorkload({
    host: '/nonexistent-test-socket',
    user: 'unused',
    database: 'unused',
  });
  try {
    assert.equal(
      (await app.inject({ method: 'GET', url: '/product/bad' })).statusCode,
      400,
    );
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: '/events',
          payload: { id: -1, product_id: 42 },
        })
      ).statusCode,
      400,
    );
  } finally {
    await app.close();
  }
});
test(
  'real PostgreSQL supports seeded reads, indexed search and committed writes',
  { skip: process.env.STACKSENSE_TEST_DATABASE !== '1' },
  async () => {
    const schema = `ssbench_${randomBytes(8).toString('hex')}`;
    const admin = new pg.Client();
    await admin.connect();
    let app, client;
    try {
      await admin.query(`CREATE SCHEMA ${schema}`);
      const config = { options: `-c search_path=${schema}` };
      client = new pg.Client(config);
      await client.connect();
      await client.query(
        await readFile(new URL('./seed.sql', import.meta.url), 'utf8'),
      );
      app = await createWorkload(config);
      const read = await app.inject({ method: 'GET', url: '/product/42' });
      assert.equal(read.statusCode, 200);
      assert.equal(correctBody('read', 42, 0, read.json()), true);
      const search = await app.inject({ method: 'GET', url: '/search/22' });
      assert.equal(search.statusCode, 200);
      assert.equal(correctBody('search', 22, 0, search.json()), true);
      const write = await app.inject({
        method: 'POST',
        url: '/events',
        payload: { id: 12, product_id: 42 },
      });
      assert.equal(write.statusCode, 200);
      assert.equal(correctBody('write', 42, 12, write.json()), true);
      const duplicate = await app.inject({
        method: 'POST',
        url: '/events',
        payload: { id: 12, product_id: 42 },
      });
      assert.equal(duplicate.statusCode, 500);
      assert.equal(
        (await client.query('SELECT count(*)::integer AS n FROM events'))
          .rows[0].n,
        1,
      );
    } finally {
      await app?.close();
      await client?.end();
      await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await admin.end();
    }
  },
);

test('saved SQL workload evidence verifies and detects raw tampering', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'sspg-evidence-'));
  try {
    const source = new URL(
      '../../evaluation/calibration/postgres-run-1/',
      import.meta.url,
    );
    await cp(source, temp, { recursive: true });
    const report = await verify(temp);
    assert.equal(report.stages.length, 6);
    await appendFile(path.join(temp, report.stages[0].raw), '\n');
    await assert.rejects(verify(temp), /Raw sample hash mismatch/);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
