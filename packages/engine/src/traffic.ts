import type { NormalizedScenario } from '../../contracts/src/index.js';
export function traffic(s: NormalizedScenario) {
  const fraction =
    typeof s.extensions?.daily_active_user_fraction === 'number'
      ? s.extensions.daily_active_user_fraction
      : 0.2;
  const active = Math.max(
    s.scale.users_12_months * fraction,
    s.scale.peak_concurrent_users ?? 0,
  );
  const rps =
    typeof s.extensions?.expected_requests_per_second === 'number'
      ? s.extensions.expected_requests_per_second
      : (active * 50) / 86400;
  return { fraction, active, rps };
}
