import type { NormalizedScenario, Warning } from '../../contracts/src/index.js';
import type { Policies, Rate } from '../../catalog/src/services.js';
import type { CorePlan } from './types.js';
import {
  CostModelLimitError,
  type CostEstimate,
  type CostLine,
  type SupportResult,
} from './complete-types.js';
export { CostModelLimitError } from './complete-types.js';
const H = 730;
export function priceLine(
  id: string,
  category: string,
  quantity: { min: number; max: number },
  rate: Rate,
): CostLine {
  for (const value of [quantity.min, quantity.max, rate.min, rate.max])
    if (!Number.isFinite(value) || value < 0 || value > 1e9)
      throw new CostModelLimitError(
        'Quantity/rate exceeds the safe pricing-model range, not a technology capacity limit.',
      );
  if (quantity.min > quantity.max || rate.min > rate.max)
    throw new Error('Reversed price/quantity interval.');
  const cents = (q: number, r: number, upper: boolean) => {
    const round = upper ? Math.ceil : Math.floor;
    const product = BigInt(round(q * 1e6)) * BigInt(round(r * 1e6));
    const divisor = 10_000_000_000n;
    const value = (product + (upper ? divisor - 1n : 0n)) / divisor;
    if (value > BigInt(Number.MAX_SAFE_INTEGER))
      throw new CostModelLimitError('Cost exceeds safely representable cents.');
    return Number(value) / 100;
  };
  return {
    id,
    category,
    quantity,
    unit_rate_usd: { min: rate.min, max: rate.max },
    monthly_usd: {
      min: cents(quantity.min, rate.min, false),
      max: cents(quantity.max, rate.max, true),
    },
    source_ids: [...rate.source_ids],
    basis: rate.basis,
  };
}
export function estimateCost(
  plan: CorePlan,
  s: NormalizedScenario,
  support: SupportResult,
  p: Policies,
): CostEstimate {
  const lines: CostLine[] = [];
  const assumptions: string[] = [];
  const ext = s.extensions ?? {};
  const get = (key: string) => {
    const rate = p.pricing[key];
    if (!rate) throw new Error(`Missing pricing model ${key}`);
    return rate;
  };
  const add = (
    id: string,
    category: string,
    min: number,
    max: number,
    key: string,
  ) => lines.push(priceLine(id, category, { min, max }, get(key)));
  const users = s.scale.users_12_months;
  const peak =
    s.scale.peak_concurrent_users ?? Math.max(1, Math.ceil(users * 0.02));
  const requests =
    typeof ext.expected_requests_per_second === 'number'
      ? ext.expected_requests_per_second
      : (users * 50) / 86400;
  const totalData = s.scale.data_volume_gb_12_months ?? 10;
  const egress =
    typeof ext.monthly_egress_gb === 'number'
      ? ext.monthly_egress_gb
      : Math.max(1, users * 0.01);
  const retention =
    typeof ext.retention_months === 'number' ? ext.retention_months : 1;
  for (const [name, value] of Object.entries({
    users,
    peak,
    requests,
    totalData,
    egress,
    retention,
  }))
    if (value > 1e9)
      throw new CostModelLimitError(
        `${name} is outside the reviewed pricing envelope; no estimate is fabricated.`,
      );
  assumptions.push(
    `Horizon: expected month-12 footprint; ${H} hours/month. No tax, development/on-call labor, domain registration or new on-prem hardware procurement is included.`,
  );
  assumptions.push(
    s.scale.peak_concurrent_users === undefined
      ? `Peak concurrency absent: assumed 2% of month-12 users (${peak}); this is a usage hypothesis, not measured traffic.`
      : `Peak concurrency supplied: ${peak}; not equated directly with requests/second.`,
  );
  assumptions.push(
    typeof ext.expected_requests_per_second === 'number'
      ? `Expected RPS supplied: ${requests}.`
      : `RPS absent: assumed 50 requests/user/day averaged across the day (${requests.toFixed(3)} RPS); peak capacity still uses the concurrency hypothesis.`,
  );
  assumptions.push(
    `Data volume ${totalData} GB ${s.scale.data_volume_gb_12_months === undefined ? 'assumed because absent' : 'supplied'}; egress ${egress} GB/month ${typeof ext.monthly_egress_gb === 'number' ? 'supplied' : 'assumed at 0.01 GB per year-12 user, minimum 1 GB'}; backup retention ${retention} months ${typeof ext.retention_months === 'number' ? 'supplied' : 'assumed'}.`,
  );
  if (plan.hosting.id === 'pages') {
    lines.push(
      priceLine(
        'static-hosting',
        'hosting',
        { min: 1, max: 1 },
        {
          min: 0,
          max: 0,
          source_ids: ['pages-price'],
          basis:
            'Static assets only; no Functions or paid add-ons. Build/file limits apply.',
        },
      ),
    );
    assumptions.push(
      'Static hosting/CDN is one bundled resource. Use local builds within current build/file limits; no Functions, paid CI overages, custom domain or dynamic database is assumed.',
    );
  } else {
    const replicas = Math.max(
      s.requirements.availability === '99' ? 1 : 2,
      Math.ceil(requests / 50),
      Math.ceil(peak / (s.requirements.realtime ? 500 : 1000)),
    );
    const background = support.components
      .filter(
        (item) => item.placement === 'host' || item.service_id === 'outbox',
      )
      .reduce((sum, item) => sum + item.incremental_compute_units, 0);
    const databaseUnits =
      plan.database.model !== 'none' &&
      s.infrastructure.deployment_model !== 'managed_cloud'
        ? plan.hosting.id === 'lightsail'
          ? peak >= 1000
            ? 4
            : 2
          : 1
        : 0;
    const units =
      databaseUnits +
      replicas +
      (plan.frontend.runtime === 'node' ? 1 : 0) +
      background;
    const hourKey =
      plan.hosting.id === 'cloudrun'
        ? 'cloudrun_hour'
        : plan.hosting.id === 'ecs'
          ? 'ecs_hour'
          : plan.hosting.id === 'appservice'
            ? 'appservice_hour'
            : plan.hosting.provider === 'none'
              ? 'local_hour'
              : 'ec2_hour';
    const lowDuty = s.requirements.realtime
      ? 0.25
      : s.scale.traffic_pattern === 'steady'
        ? 0.15
        : 0.08;
    const duty =
      plan.hosting.id === 'cloudrun'
        ? { min: lowDuty, max: s.requirements.realtime ? 1 : 0.8 }
        : { min: 1, max: 1 };
    const ase = plan.hosting.id === 'ase-india';
    const billedUnits = ase ? Math.max(replicas, Math.ceil(units / 2)) : units;
    const lightsail = plan.hosting.id === 'lightsail';
    const bundles = Math.max(1, Math.ceil(units / 2));
    if (lightsail) {
      add(
        'application-compute',
        'compute',
        bundles,
        bundles,
        'lightsail_bundle_month',
      );
      const extraDisk = Math.max(0, Math.ceil((totalData - 60) / 8) * 8);
      if (extraDisk)
        add(
          'database-extra-disk',
          'database',
          extraDisk,
          extraDisk,
          'lightsail_disk_gb',
        );
      assumptions.push(
        `Lightsail: ${bundles} full-month Linux IPv4 4-GiB/2-vCPU/80-GB-SSD bundles at USD 24 each. Reference service allocations are packed into these bundles; reserve 20 GB OS space on the database host and add block disk above 60 GB application data. Database and identity are self-operated. Burstable CPU baselines, memory, inter-node routing, recovery and the requested throughput/latency are NOT validated by this cash-cost estimate.`,
      );
    } else if (plan.hosting.id === 'cloudrun') {
      const requestUnits =
        replicas + (plan.frontend.runtime === 'node' ? 1 : 0);
      const alwaysOnUnits = Math.ceil(background);
      add(
        'application-compute',
        'compute',
        requestUnits * H * duty.min,
        requestUnits * H * duty.max,
        hourKey,
      );
      if (alwaysOnUnits)
        add(
          'background-compute',
          'compute',
          alwaysOnUnits * H,
          alwaysOnUnits * H,
          'cloudrun_instance_hour',
        );
      assumptions.push(
        `Cloud Run billing separates ${requestUnits} request-driven allocations from ${alwaysOnUnits} always-on reference allocations (support footprint rounded up). Identity/background workers/inference/telemetry use instance-based CPU with minimum instances and are charged for the full month; they do not inherit a request-only duty discount. Service packing, startup, concurrency and exact regional billing require validation.`,
      );
    } else
      add(
        'application-compute',
        'compute',
        billedUnits * H * duty.min,
        billedUnits * H * duty.max,
        ase ? 'ase_i1v2_hour' : hourKey,
      );
    assumptions.push(
      `Compute provisioning hypothesis: 50 RPS or ${s.requirements.realtime ? 500 : 1000} active users per reference allocation; WebSocket capacity is included in the peak-concurrency replica floor, not charged again as per-connection sidecars. ${units} vCPU/2-GiB-equivalent units include frontend/backend, auth, workers, inference and telemetry once. These are sizing assumptions requiring load tests, not capacity guarantees.`,
    );
    assumptions.push(
      `Billed duty ${duty.min}–${duty.max}; run polling workers with allocated CPU/minimum instances. Higher availability adds at least two application allocations and in-region database copies, but does not guarantee an SLA. Rate bands include headroom; do not interpret reference regions/proxies as exact local provider quotes.`,
    );
    if (ase)
      assumptions.push(
        `Azure ASE: ${billedUnits} whole Linux I1 v2 instances (2 vCPU each), rounding the reference CPU footprint up and retaining the availability replica floor. Published consumption meter is region/SKU-specific; database/storage/network/operations lines remain planning proxies, not a calibrated Azure quote. Configure in-region PostgreSQL backups, Blob LRS, log retention and internal access; no dedicated physical hosts or cross-region copies assumed.`,
      );
    if (plan.hosting.id === 'ecs')
      lines.push(
        priceLine(
          'network-fixed',
          'network',
          { min: 1, max: 1 },
          {
            min: 25,
            max: 100,
            source_ids: ['fargate-price'],
            basis:
              'Authored load-balancer/NAT/request allowance; subnet/routing/SKU quote required.',
          },
        ),
      );
    if (
      plan.database.model !== 'none' &&
      s.infrastructure.deployment_model === 'managed_cloud'
    ) {
      const copies = s.requirements.availability === '99' ? 1 : 2;
      const cpus = peak >= 1000 ? 2 : 1;
      const memory = cpus * 4;
      add(
        'database-cpu',
        'database',
        cpus * H * copies,
        cpus * H * copies,
        'database_cpu_hour',
      );
      add(
        'database-memory',
        'database',
        memory * H * copies,
        memory * H * copies,
        'database_memory_gb_hour',
      );
      add(
        'database-storage',
        'database',
        Math.max(10, totalData * 0.5) * copies,
        Math.max(10, totalData) * copies,
        'database_storage_gb',
      );
      assumptions.push(
        `Managed database: ${cpus} vCPU/${memory} GiB reference primary and ${copies - 1} failover copies in-region; no SLA is guaranteed. Auth/search/outbox share logical database capacity and are not billed as duplicate databases.`,
      );
      if (plan.database.id === 'sqlserver')
        lines.push(
          priceLine(
            'sqlserver-license',
            'license',
            { min: 1, max: 1 },
            {
              min: 100,
              max: 500,
              source_ids: ['azure-price'],
              basis:
                'Authored SQL Server license/service premium allowance pending an edition/provider quote; not Azure SQL MI pricing.',
            },
          ),
        );
    } else if (plan.database.model !== 'none')
      assumptions.push(
        'Self-hosted database CPU/disk shares the provisioned host allocation; no second managed database bill is added. Capacity and license review still required.',
      );
    add(
      'backup-storage',
      'backup',
      Math.max(10, totalData) * retention,
      Math.max(10, totalData) * retention * 2,
      lightsail ? 'lightsail_snapshot_gb' : 'backup_gb',
    );
    if (s.requirements.file_media_storage)
      add(
        'object-storage',
        'storage',
        totalData * 0.5,
        totalData,
        'object_storage_gb',
      );
    if (
      !['on_premise', 'air_gapped'].includes(s.infrastructure.deployment_model)
    ) {
      // Reserve half one VM's transfer quota for inbound/inter-node traffic; never pool every VM's quota.
      const included = lightsail
        ? plan.primary_region === 'ap-south-1'
          ? 1000
          : 2000
        : 0;
      add(
        'network-egress',
        'egress',
        Math.max(0, egress - included),
        Math.max(0, egress * 2 - included),
        'egress_gb',
      );
      if (lightsail)
        assumptions.push(
          `Transfer model reserves half one bundle's quota for inbound/other traffic: ${included} GB outbound allowance remains (Mumbai quota is halved). Additional VMs' quotas are not pooled. External S3 delivery, cross-region/private network routes or inbound above this reservation can create extra charges; verify actual routing and tariffs.`,
        );
    } else
      assumptions.push(
        'Intranet/local-device traffic has no public-cloud egress tariff in this estimate; WAN/carrier contracts are not inferred.',
      );
    lines.push(
      priceLine(
        'telemetry-operations',
        'observability',
        { min: 1, max: 1 },
        {
          min: 5,
          max: Math.max(20, users * 0.002),
          source_ids: ['storage-price'],
          basis:
            'Authored logs/metrics/request-operations allowance; redact data and set regional retention/quotas.',
        },
      ),
    );
  }
  if (support.components.some((item) => item.service_id === 'actions'))
    lines.push(
      priceLine(
        'hosted-ci',
        'ci_cd',
        { min: 1, max: 1 },
        {
          min: 0,
          max: 30,
          source_ids: ['ci'],
          basis:
            'Authored hosted build-minute allowance, assuming included quota at the lower bound. Paid runners/minutes/artifacts require a repository-specific quote and spending cap.',
        },
      ),
    );
  if (s.requirements.auth === 'phone_otp') {
    const otp =
      typeof ext.monthly_otp_count === 'number'
        ? ext.monthly_otp_count
        : users * 2;
    add(
      'otp-delivery',
      'auth',
      typeof ext.monthly_otp_count === 'number' ? otp : 0,
      otp,
      'otp_message',
    );
    assumptions.push(
      `OTP volume ${typeof ext.monthly_otp_count === 'number' ? 'supplied' : 'unknown, assumed range 0 to twice the year-12 users'}: upper ${otp} messages/month. SMS rate is an explicit unquoted planning envelope; DLT, taxes and country routing may add fees.`,
    );
  }
  if (s.requirements.payments) {
    const count =
      typeof ext.monthly_payment_transactions === 'number'
        ? ext.monthly_payment_transactions
        : Math.ceil(users * 0.02);
    const ticket =
      typeof ext.average_payment_value_usd === 'number'
        ? ext.average_payment_value_usd
        : 50;
    const minCount =
      typeof ext.monthly_payment_transactions === 'number' ? count : 0;
    add(
      'payment-variable',
      'payments',
      minCount * ticket,
      count * ticket,
      support.components.some((c) => c.service_id === 'razorpay')
        ? 'razorpay_fraction'
        : 'payment_fraction',
    );
    add(
      'payment-fixed',
      'payments',
      minCount,
      count,
      support.components.some((c) => c.service_id === 'razorpay')
        ? 'razorpay_fixed'
        : 'payment_fixed',
    );
    assumptions.push(
      `Payment assumptions: ${minCount}–${count} transactions/month, average USD ${ticket}; missing count assumes up to 2% of year-12 users and missing ticket assumes USD 50. Percentage/fixed rates are declared envelopes, not verified merchant pricing. Payout, FX, tax, refunds and chargebacks require separate quotes.`,
    );
  }
  const infrastructureLines = lines.filter(
    (line) => line.category !== 'payments' && line.id !== 'otp-delivery',
  );
  assumptions.push(
    'Headline estimate and budget fit cover infrastructure/operations only. Payment and SMS activity fees are separately itemized scenarios and excluded from this total; missing volumes are assumptions, not measured expenditure.',
  );
  const minCents = infrastructureLines.reduce(
    (sum, line) => sum + Math.round(line.monthly_usd.min * 100),
    0,
  );
  const maxCents = infrastructureLines.reduce(
    (sum, line) => sum + Math.round(line.monthly_usd.max * 100),
    0,
  );
  if (!Number.isSafeInteger(minCents) || !Number.isSafeInteger(maxCents))
    throw new CostModelLimitError('Total exceeds safe cents representation.');
  assumptions.push(...[...new Set(lines.map((line) => line.basis))].sort());
  return {
    min: minCents / 100,
    max: maxCents / 100,
    assumptions,
    line_items: lines,
    horizon: 'month_12',
    confidence: 'planning_band_not_quote',
  };
}
export function budgetWarnings(cost: CostEstimate, budget: number): Warning[] {
  if (cost.min > budget)
    return [
      {
        code: 'BUDGET_EXCEEDED',
        severity: 'warning',
        message: `Infrastructure estimate USD ${cost.min}–${cost.max}/month exceeds the USD ${budget} budget at the lower bound; this is an explicitly over-budget plan, with no requirement silently relaxed.`,
        fields: ['budget.monthly_infra_usd'],
      },
    ];
  if (cost.max > budget)
    return [
      {
        code: 'BUDGET_RANGE_RISK',
        severity: 'warning',
        message: `Upper estimate USD ${cost.max}/month exceeds USD ${budget}; stated usage/price assumptions determine whether it fits.`,
        fields: ['budget.monthly_infra_usd'],
      },
    ];
  return [];
}
