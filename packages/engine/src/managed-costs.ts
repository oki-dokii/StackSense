import type { NormalizedScenario } from '../../contracts/src/index.js';
import type { CorePlan } from './types.js';
import type { CostLine, SupportResult } from './complete-types.js';
import { priceLine } from './costs.js';
import { appPlatformCost } from './do-costs.js';

/** Bounded paid tiers. Quantities and workload hypotheses are explicit; no free-tier or SLA claims. */
export function managedCost(
  plan: CorePlan,
  s: NormalizedScenario,
  support: SupportResult,
  q: {
    requests: number;
    peak: number;
    totalData: number;
    egress: number;
    retention: number;
  },
  lines: CostLine[],
  assumptions: string[],
): void {
  const add = (
    id: string,
    category: string,
    min: number,
    max: number,
    rate: number,
    source: string,
    basis: string,
  ) =>
    lines.push(
      priceLine(
        id,
        category,
        { min, max },
        { min: rate, max: rate, source_ids: [source], basis },
      ),
    );
  const { requests, peak, totalData, egress, retention } = q;
  const functions = plan.hosting.id === 'vercel';
  const digitalOcean = plan.hosting.id === 'do-app';
  let backup = { min: 0, max: 0 };
  if (functions) {
    const months = requests * 86400 * 30;
    // Scheduled drain is charged as invocations plus bounded CPU/wall-time batches.
    const cron = support.components.some(
      (c) => c.service_id === 'vercel-outbox',
    )
      ? 43200
      : 0;
    const region = plan.primary_region;
    const cpu = region === 'bom1' ? 0.14 : region === 'fra1' ? 0.184 : 0.128;
    const mem =
      region === 'bom1' ? 0.0116 : region === 'fra1' ? 0.0152 : 0.0106;
    const usage = (
      cpuMs: number,
      wallMs: number,
      buildMinutes: number,
      upper: boolean,
    ) =>
      ((months * cpuMs) / 3_600_000) * cpu +
      ((months * wallMs) / 3_600_000) * mem +
      ((months + cron) / 1e6) * 0.6 +
      ((cron * (upper ? 100 : 20)) / 3_600_000) * cpu +
      ((cron * (upper ? 1000 : 100)) / 3_600_000) * mem +
      (upper ? egress * 2 : egress) * 0.2 +
      ((months + cron) / 1e6) * 2.2 +
      // Origin transfer is separately metered; conservatively use full egress as function-to-CDN bytes.
      (upper ? egress * 2 : egress) * 0.25 +
      buildMinutes * 0.014;
    add(
      'vercel-platform-seats',
      'hosting',
      Math.max(1, s.team.size),
      Math.max(1, s.team.size),
      20,
      'vercel-pro',
      'USD 20 platform fee includes one deploying seat; every team member assumed a deploying seat. Exactly one USD 20 team usage credit is applied below.',
    );
    add(
      'vercel-net-usage',
      'compute',
      Math.max(0, usage(10, 100, 100, false) - 20),
      Math.max(0, usage(30, 300, 500, true) - 20),
      1,
      'vercel-fluid',
      'Authored 10–30 ms active CPU/request, 100–300 ms wall/request at 1 GiB; additive memory is conservative under concurrency. Includes invocations, bounded Cron, on-demand CDN/transfer/origin and 100–500 standard concurrent build minutes; deduct single USD 20 team credit once. Regional tariff references are attached in assumptions.',
    );
    lines[lines.length - 1]!.source_ids = [
      'vercel-fluid',
      'vercel-bom-price',
      'vercel-build',
      'vercel-cron',
      'vercel-pro',
      'vercel-network',
    ];
    assumptions.push(
      'Vercel Pro: regional Node/Python/Go function adapters; 10–30 ms CPU and 100–300 ms wall time are authored hypotheses, not measurements. All team members are paid deploying seats. No Hobby commercial/free allowance. On-demand CDN profile uses no unverified Pro transfer/request allowance; current docs refer to opt-in Flat Rate CDN, which is not modeled. Mumbai rates USD .20/GB, 2.20/M CDN requests, .25/GB origin are conservatively reused as a non-India planning proxy. CPU/memory rates use bom1/fra1/iad1 exactly. Function invocations USD .60/M have no Pro free-million deduction. Source IDs: vercel-pro, vercel-fluid, vercel-bom-price, vercel-build, vercel-cron. Cache/ISR/image transformations are not enabled; quote them separately if added.',
    );
    assumptions.push(
      'Cron drains are minute-scale bounded batches, not resident workers; 43,200 monthly invocations plus 20–100 ms CPU/100–1000 ms wall time each are included. Direct signed media upload avoids function payload limits. Pool database connections and load-test cold starts, timeouts, batch sizes and concurrency.',
    );
  } else if (digitalOcean) {
    backup = appPlatformCost(plan, s, support, q, lines, assumptions);
  } else {
    const replicas = Math.max(
      s.requirements.availability === '99' ? 1 : 2,
      Math.ceil(requests / 50),
      Math.ceil(peak / (s.requirements.realtime ? 500 : 1000)),
    );
    const units =
      replicas +
      (plan.frontend.runtime === 'node' ? 1 : 0) +
      Math.ceil(
        support.components
          .filter((c) => c.placement === 'host' || c.service_id === 'outbox')
          .reduce((n, c) => n + c.incremental_compute_units, 0),
      );
    add(
      'application-compute',
      'compute',
      units * 730,
      units * 730 * (plan.primary_region === 'fra' ? 1.5 : 1),
      13.39 / 720,
      'fly-price',
      'Always-on shared-cpu-2x/2GiB reference Machines USD 13.39 per 30 days in US; 730-hour month. Frankfurt upper adds an authored 50% regional allowance, not an exact quote. Shared CPU is not dedicated CPU.',
    );
    add(
      'network-egress',
      'egress',
      egress,
      egress * 2,
      0.02,
      'fly-price',
      'US/EU public outbound; cross-provider database traffic is charged separately by its service. Private inter-region traffic and dedicated addresses need deployment-specific quote.',
    );
    assumptions.push(
      `Fly: ${units} always-on shared-CPU/2GiB reference Machines, no first-month/free-credit assumption. Reference sizing 50 RPS or 500 realtime/1000 other peak users per allocation is authored and unvalidated. No India region mapping; no guarantee of p95/HA. Select a dedicated class after CPU testing if necessary.`,
    );
  }
  if (plan.database.service_bundle === 'supabase_pro') {
    const compute = peak >= 1000 ? 0.0822 : 0.01344;
    add(
      'supabase-pro-project',
      'database',
      1,
      1,
      25 + Math.max(0, compute * 730 - 10),
      'supabase-compute',
      'One USD 25 Pro organization/project; charge 730 hours of Micro (.01344/h), or Medium (.0822/h) when peak >=1000, minus one USD 10 compute credit. Tier threshold is an unvalidated capacity hypothesis.',
    );
    add(
      'supabase-database-storage',
      'database',
      Math.max(0, totalData * 0.5 - 8),
      Math.max(0, totalData - 8),
      0.125,
      'supabase-price',
      '8 GB included once; application data distribution between DB/files unknown, database uses 50–100% total data.',
    );
    if (s.requirements.auth !== 'none')
      add(
        'supabase-mau',
        'auth',
        Math.max(0, s.scale.users_12_months - 100000),
        Math.max(0, s.scale.users_12_months - 100000),
        0.00325,
        'supabase-price',
        'All month-12 users conservatively treated as monthly active auth users; 100k included once.',
      );
    add(
      'supabase-egress',
      'egress',
      Math.max(0, egress + backup.min - 250),
      Math.max(0, egress * 2 + backup.max - 250),
      0.09,
      'supabase-price',
      '250 GB uncached allowance once; no additional cached allowance assumed. Includes database-to-application plus direct client traffic within authored envelope; actual routing must be measured.',
    );
    if (s.requirements.file_media_storage) {
      add(
        'supabase-object-storage',
        'storage',
        Math.max(0, totalData * 0.5 - 100),
        Math.max(0, totalData - 100),
        0.0213,
        'supabase-price',
        '100 GB file storage included once, then USD .0213/GB.',
      );
      if (!digitalOcean)
        add(
          'file-backup-allowance',
          'backup',
          Math.max(10, totalData * 0.5) * retention,
          Math.max(10, totalData) * retention * 2,
          0.05,
          'supabase-storage',
          'Authored separately stored file backup allowance at USD .05/GB-month; provider/database backup does not protect object bytes. Destination geography, transfer and restore implementation require review.',
        );
    }
    if (support.components.some((c) => c.service_id === 'supabase-realtime')) {
      add(
        'supabase-realtime-connections',
        'realtime',
        Math.ceil(Math.max(0, peak - 500) / 1000),
        Math.ceil(Math.max(0, peak - 500) / 1000),
        10,
        'supabase-price',
        '500 included peak connections; USD 10 per additional 1000-connection package.',
      );
      const suppliedMessages =
        typeof s.extensions?.monthly_realtime_messages === 'number'
          ? s.extensions.monthly_realtime_messages
          : null;
      add(
        'supabase-realtime-messages',
        'realtime',
        Math.ceil(
          Math.max(0, (suppliedMessages ?? requests * 86400 * 30) - 5e6) / 1e6,
        ),
        Math.ceil(
          Math.max(0, (suppliedMessages ?? requests * 86400 * 30 * 2) - 5e6) /
            1e6,
        ),
        2.5,
        'supabase-price',
        suppliedMessages === null
          ? 'Authored 1–2 vendor-billed realtime messages per API request, 5M included then USD 2.50 per started million. Only used for actual Supabase Realtime, never for self-hosted Yjs/ws. Broadcast fan-out may cost more; supply monthly_realtime_messages after measurement.'
          : `Supplied ${suppliedMessages} monthly vendor-billed realtime messages including fan-out; first 5M included, then USD2.50 per started million. This quantity is supplied, not independently measured.`,
      );
    }
    assumptions.push(
      'Supabase Pro is one specific regional project, not a self-hosted PostgreSQL alias. Micro/Medium connection pools and CPU/RAM require validation; limit application pools and prefer transaction pooling. Default DB backups are daily/seven days (provider assumption overriding generic one-month backup assumption for DB only); no explicit month-retention extension is accepted by this profile. Object backup is separately charged. No HIPAA Pro eligibility or contractual SLA is claimed.',
    );
  } else if (plan.database.service_bundle === 'neon_launch') {
    add(
      'neon-compute',
      'database',
      730 * 0.25,
      730 * Math.max(1, Math.ceil(requests / 50)),
      0.106,
      'neon-price',
      'Launch .106/CU-hour; full-month .25-CU lower and >=1-CU upper. No auto-suspend discount assumed for long-lived connections; sizing is authored.',
    );
    add(
      'neon-storage',
      'database',
      Math.max(10, totalData * 0.5),
      Math.max(10, totalData),
      0.35,
      'neon-price',
      'Launch database storage; no free database-tier allowance assumed.',
    );
    add(
      'neon-history',
      'backup',
      Math.max(10, totalData * 0.25),
      Math.max(10, totalData),
      0.2,
      'neon-price',
      'Authored 25–100% dataset WAL history/month, billed separately from database storage. Default history one day; backup exports/restore testing still required.',
    );
    add(
      'backup-export-storage',
      'backup',
      Math.max(10, totalData) * retention,
      Math.max(10, totalData) * retention * 2,
      0.05,
      'neon-price',
      'Authored external backup allowance USD .05/GB-month; configure regional exports and review job/transfer/storage charges.',
    );
    assumptions.push(
      'Neon Launch: US/EU only; paid compute/storage/history modeled without a flat USD 15 assertion or a free Auth/Storage bundle. Explicit backup exports remain implementation work. No SLA, HIPAA agreement or capacity validation is inferred.',
    );
  }
  if (digitalOcean) return; // worker and regional archive already charged; no duplicate logs allowance
  add(
    'telemetry-operations',
    'observability',
    1,
    1,
    5,
    'vercel-logs',
    'Authored minimum USD 5/month regional logs/metrics archive allowance, separate from included runtime logs.',
  );
  add(
    'telemetry-headroom',
    'observability',
    0,
    Math.max(15, s.scale.users_12_months * 0.002 - 5),
    1,
    'vercel-logs',
    'Authored extra operations/retention headroom, not unlimited native log storage.',
  );
}
