import { spawn, fork, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import {
  readFile,
  writeFile,
  mkdir,
  mkdtemp,
  rm,
  chmod,
} from 'node:fs/promises';
import { openSync, closeSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as pause } from 'node:timers/promises';
import pg from 'pg';
import { operation, correctBody } from './workload.mjs';
import { schedule, summarize, validateProfile } from './load.mjs';
const directory = path.dirname(fileURLToPath(import.meta.url));
export const sha = (data) => createHash('sha256').update(data).digest('hex');
export async function sourceHashes() {
  const result = {};
  for (const file of [
    'package.json',
    'package-lock.json',
    'profile.json',
    'seed.sql',
    'load.mjs',
    'workload.mjs',
    'run.mjs',
  ])
    result[file] = sha(await readFile(path.join(directory, file)));
  return result;
}
async function terminate(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exit = once(child, 'exit');
  child.kill('SIGTERM');
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
  try {
    await exit;
  } finally {
    clearTimeout(timer);
  }
}
export async function run(
  profile,
  output,
  bin = process.env.STACKSENSE_PG_BIN ?? '',
) {
  validateProfile(profile);
  const binary = (name) => (bin ? path.join(bin, name) : name);
  const postgresVersion = execFileSync(binary('postgres'), ['--version'], {
    encoding: 'utf8',
  }).trim();
  if (!postgresVersion.match(/PostgreSQL\) 18\.1(?:\s|$)/))
    throw Error(
      'Recipe requires PostgreSQL 18.1; use STACKSENSE_PG_BIN to select binaries',
    );
  await mkdir(path.dirname(output), { recursive: true });
  await mkdir(output);
  const temp = await mkdtemp(
    path.join(
      process.platform === 'darwin' ? '/private/tmp' : os.tmpdir(),
      'sspg-',
    ),
  );
  await chmod(temp, 0o700);
  let database, http, client, log;
  const controller = new AbortController();
  const interrupt = () => controller.abort(Error('Benchmark interrupted'));
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    const data = path.join(temp, 'data');
    execFileSync(
      binary('initdb'),
      [
        '-D',
        data,
        '-A',
        'trust',
        '-U',
        'stacksense',
        '--encoding=UTF8',
        '--locale=C',
      ],
      { stdio: 'pipe' },
    );
    log = openSync(path.join(temp, 'postgres.log'), 'w');
    database = spawn(
      binary('postgres'),
      [
        '-D',
        data,
        '-k',
        temp,
        '-c',
        'listen_addresses=',
        '-c',
        'shared_buffers=32MB',
        '-c',
        'max_connections=20',
        '-c',
        'fsync=on',
        '-c',
        'synchronous_commit=on',
        '-c',
        'full_page_writes=on',
      ],
      { stdio: ['ignore', log, log] },
    );
    const config = {
      host: temp,
      user: 'stacksense',
      database: 'postgres',
      connectionTimeoutMillis: 500,
    };
    for (let attempt = 0; ; attempt++) {
      controller.signal.throwIfAborted();
      client = new pg.Client(config);
      try {
        await client.connect();
        break;
      } catch (e) {
        await client.end().catch(() => {});
        if (attempt >= 50 || database.exitCode !== null)
          throw Error('Temporary PostgreSQL failed readiness');
        await pause(100);
      }
    }
    await client.query(
      await readFile(path.join(directory, 'seed.sql'), 'utf8'),
    );
    const settings = (
      await client.query(
        "SELECT name, setting, unit FROM pg_settings WHERE name IN ('server_version','shared_buffers','max_connections','fsync','synchronous_commit','full_page_writes','listen_addresses','unix_socket_permissions') ORDER BY name",
      )
    ).rows;
    const databaseBefore = (
      await client.query(
        "SELECT pg_database_size(current_database())::text AS database_bytes, pg_total_relation_size('products')::text AS products_bytes, (SELECT count(*)::integer FROM products) AS products",
      )
    ).rows[0];
    http = fork(path.join(directory, 'workload.mjs'), [], {
      env: { ...process.env, STACKSENSE_BENCH_SOCKET: temp },
      stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
    });
    const [ready] = await Promise.race([
      once(http, 'message'),
      once(http, 'exit').then(() => {
        throw Error('HTTP workload exited before readiness');
      }),
      pause(5000).then(() => {
        throw Error('HTTP readiness timeout');
      }),
    ]);
    let nextEvent = 0,
      expectedWrites = 0;
    async function request(index) {
      const { kind, id } = operation(index);
      const eventId = nextEvent++;
      let status = 0;
      try {
        const response = await fetch(
          `http://127.0.0.1:${ready.port}/${kind === 'write' ? 'events' : kind === 'search' ? 'search/' + id : 'product/' + id}`,
          {
            method: kind === 'write' ? 'POST' : 'GET',
            headers:
              kind === 'write'
                ? { 'content-type': 'application/json' }
                : undefined,
            body:
              kind === 'write'
                ? JSON.stringify({ id: eventId, product_id: id })
                : undefined,
            signal: AbortSignal.timeout(profile.timeout_ms),
          },
        );
        status = response.status;
        const ok =
          status === 200 &&
          correctBody(kind, id, eventId, await response.json());
        if (ok && kind === 'write') expectedWrites++;
        return {
          kind,
          id,
          event_id: eventId,
          status,
          ok,
          error: ok ? null : 'status_or_body_mismatch',
        };
      } catch (e) {
        return {
          kind,
          id,
          event_id: eventId,
          status,
          ok: false,
          error: e.name,
        };
      }
    }
    const stages = [];
    for (let repetition = 1; repetition <= profile.repetitions; repetition++) {
      for (const rate of profile.rates_per_second) {
        for (let i = 0; i < profile.warmup_requests; i++) {
          controller.signal.throwIfAborted();
          if (!(await request(i)).ok) throw Error('Warmup response failed');
        }
        const { samples, elapsed_ms } = await schedule({
          rate,
          profile,
          request,
          signal: controller.signal,
        });
        const raw = `samples-${stages.length + 1}.jsonl`;
        const bytes = samples.map((s) => JSON.stringify(s)).join('\n') + '\n';
        await writeFile(path.join(output, raw), bytes, { flag: 'wx' });
        stages.push({
          repetition,
          rate_per_second: rate,
          ...summarize(samples, elapsed_ms, profile),
          raw,
          raw_sha256: sha(bytes),
        });
      }
    }
    // Fresh connection verifies committed writes independently of the HTTP pool.
    await client.end();
    client = new pg.Client(config);
    await client.connect();
    const persistence = (
      await client.query(
        'SELECT count(*)::integer AS committed_events FROM events',
      )
    ).rows[0];
    persistence.matches_acknowledged_writes =
      persistence.committed_events === expectedWrites;
    const databaseAfter = (
      await client.query(
        "SELECT pg_database_size(current_database())::text AS database_bytes, pg_total_relation_size('events')::text AS events_bytes",
      )
    ).rows[0];
    const report = {
      schema_version: '1.0.0',
      measured_at: new Date().toISOString(),
      recipe: profile.recipe,
      profile,
      profile_sha256: sha(JSON.stringify(profile)),
      sources: await sourceHashes(),
      environment: {
        node: process.version,
        postgres: postgresVersion,
        fastify: '5.12.8',
        pg: '8.23.1',
        platform: process.platform,
        architecture: process.arch,
        os_release: os.release(),
        cpu_model: os.cpus()[0]?.model,
        logical_cpus: os.cpus().length,
        total_memory_bytes: os.totalmem(),
        topology:
          'generator, separate HTTP process and separate PostgreSQL process on one host; Unix socket database; loopback HTTP',
      },
      database: {
        settings,
        before: databaseBefore,
        after: databaseAfter,
        acknowledged_writes_including_warmup: expectedWrites,
        ...persistence,
      },
      model:
        'scheduled arrivals; deterministic 80% read / 10% indexed search / 10% committed insert; warmup excluded; all lag and inflight drops retained; no retries; drain included',
      stages,
      passed:
        stages.every((s) => s.passed) &&
        persistence.matches_acknowledged_writes,
      scope:
        'Local Fastify/PostgreSQL reference only; no browser, TLS, external network, cloud deployment, resource isolation, billing, monthly cost calibration or production SLA. Same-host generator can cause scheduler lag. PostgreSQL 18.1 is the installed test version, not a recommendation to deploy that patch. Fresh-connection visibility verifies commit acknowledgement, not crash recovery.',
    };
    await writeFile(
      path.join(output, 'summary.json'),
      JSON.stringify(report, null, 2) + '\n',
      { flag: 'wx' },
    );
    return report;
  } finally {
    await terminate(http);
    await client?.end().catch(() => {});
    await terminate(database);
    if (log !== undefined) closeSync(log);
    await rm(temp, { recursive: true, force: true });
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
}
async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--out')
    throw Error(
      'Usage: node benchmarks/postgres/run.mjs --out <new-directory>',
    );
  const profile = JSON.parse(
    await readFile(path.join(directory, 'profile.json'), 'utf8'),
  );
  const report = await run(profile, path.resolve(args[1]));
  console.log(
    JSON.stringify(
      {
        passed: report.passed,
        stages: report.stages,
        database: report.database,
      },
      null,
      2,
    ),
  );
  if (!report.passed) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
