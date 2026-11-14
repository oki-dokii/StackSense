import { setTimeout as pause } from 'node:timers/promises';
export function validateProfile(p) {
  const int = (x, min, max) => Number.isInteger(x) && x >= min && x <= max;
  if (
    p?.recipe !== 'fastify-postgres-catalog-v1' ||
    p.postgres_version !== '18.1' ||
    !int(p.duration_ms, 100, 30000) ||
    !Array.isArray(p.rates_per_second) ||
    p.rates_per_second.length < 1 ||
    p.rates_per_second.length > 5 ||
    !p.rates_per_second.every((r) => int(r, 1, 1000)) ||
    !int(p.repetitions, 1, 5) ||
    !int(p.warmup_requests, 0, 100) ||
    !int(p.max_inflight, 1, 64) ||
    !int(p.timeout_ms, 1, 5000) ||
    !int(p.max_start_lag_ms, 1, 1000) ||
    !Number.isFinite(p.thresholds?.p95_end_to_end_ms) ||
    p.thresholds.p95_end_to_end_ms < 0 ||
    ![p.thresholds.error_rate, p.thresholds.drop_rate].every(
      (x) => Number.isFinite(x) && x >= 0 && x <= 1,
    )
  )
    throw Error('Invalid or unbounded database profile');
  return p;
}
export async function schedule({
  rate,
  profile,
  request,
  now = () => performance.now(),
  sleep = pause,
  signal,
}) {
  const planned = Math.floor((rate * profile.duration_ms) / 1000);
  const start = now();
  const samples = [];
  const pending = new Set();
  for (let index = 0; index < planned; index++) {
    signal?.throwIfAborted();
    const scheduled_ms = (index * 1000) / rate;
    while (now() - start < scheduled_ms)
      await sleep(Math.max(0.1, scheduled_ms - (now() - start)));
    const start_ms = now() - start;
    const lag_ms = start_ms - scheduled_ms;
    const dropped =
      lag_ms > profile.max_start_lag_ms
        ? 'scheduler_lag'
        : pending.size >= profile.max_inflight
          ? 'inflight_limit'
          : null;
    if (dropped) {
      samples.push({ index, scheduled_ms, start_ms, lag_ms, dropped });
      continue;
    }
    const promise = (async () => {
      let result;
      try {
        result = await request(index);
      } catch (e) {
        result = { ok: false, error: e.name, status: 0 };
      }
      const completed_ms = now() - start;
      samples.push({
        index,
        scheduled_ms,
        start_ms,
        lag_ms,
        dropped: null,
        ...result,
        latency_ms: completed_ms - start_ms,
        end_to_end_ms: completed_ms - scheduled_ms,
      });
    })();
    pending.add(promise);
    promise.finally(() => pending.delete(promise));
  }
  if (now() - start < profile.duration_ms)
    await sleep(profile.duration_ms - (now() - start));
  await Promise.all(pending);
  const elapsed_ms = now() - start;
  return { samples: samples.sort((a, b) => a.index - b.index), elapsed_ms };
}
export function summarize(samples, elapsed_ms, profile) {
  const issued = samples.filter((s) => !s.dropped);
  const times = issued.map((s) => s.end_to_end_ms).sort((a, b) => a - b);
  const errors = issued.filter((s) => !s.ok).length;
  const dropped = samples.length - issued.length;
  const p95_end_to_end_ms = times.length
    ? times[Math.ceil(times.length * 0.95) - 1]
    : null;
  const error_rate = issued.length ? errors / issued.length : 1;
  const drop_rate = dropped / samples.length;
  const checks = {
    p95:
      p95_end_to_end_ms !== null &&
      p95_end_to_end_ms <= profile.thresholds.p95_end_to_end_ms,
    error_rate: error_rate <= profile.thresholds.error_rate,
    drop_rate: drop_rate <= profile.thresholds.drop_rate,
  };
  return {
    planned: samples.length,
    issued: issued.length,
    dropped,
    errors,
    error_rate,
    drop_rate,
    p95_end_to_end_ms,
    elapsed_ms,
    completed_per_second: issued.length / (elapsed_ms / 1000),
    checks,
    passed: Object.values(checks).every(Boolean),
  };
}
