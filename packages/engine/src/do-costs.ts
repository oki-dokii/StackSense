import type { NormalizedScenario } from '../../contracts/src/index.js';
import type { CorePlan } from './types.js';
import type { CostLine, SupportResult } from './complete-types.js';
import { priceLine } from './costs.js';
export function appPlatformCost(
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
) {
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
  const count = Math.max(
    ['99', '99.9'].includes(s.requirements.availability) ? 1 : 2,
    Math.ceil(q.requests / 50),
    Math.ceil(q.peak / 1000),
  );
  const servers = count * (plan.frontend.runtime === 'node' ? 2 : 1);
  const background = support.components
    .filter((c) => c.placement === 'host' || c.service_id === 'outbox')
    .reduce((sum, c) => sum + c.incremental_compute_units, 0);
  const workers = Math.ceil(background * 2); // one GiB per packed reference container
  const rate = count === 1 ? 10 : 12;
  add(
    'do-application-containers',
    'compute',
    servers,
    servers,
    rate,
    'do-app-price',
    `One-GiB shared-CPU application/SSR containers. ${count === 1 ? 'USD10 fixed SKU, one instance per component, no horizontal scaling' : 'USD12 manually scalable SKU; no automatic scaling assumption'}. Reference 50 RPS/1000 peak users is unvalidated; database/realtime are external.`,
  );
  add(
    'do-background-containers',
    'compute',
    workers,
    workers,
    10,
    'do-app-price',
    'Always-on one-GiB fixed worker containers; packed transactional outbox and telemetry reference footprint charged once. Memory/startup/batch headroom and restart recovery require validation.',
  );
  const backup = {
    min: s.requirements.file_media_storage
      ? q.totalData * 0.5 * q.retention
      : 0,
    max: s.requirements.file_media_storage ? q.totalData * 2 * q.retention : 0,
  };
  const logs = {
    min: ((q.requests * 86400 * 30 * 1024) / 2 ** 30) * q.retention,
    max: ((q.requests * 86400 * 30 * 4096) / 2 ** 30) * q.retention,
  };
  const archive = {
    min: backup.min / 1.073741824 + logs.min,
    max: backup.max / 1.073741824 + logs.max,
  };
  add(
    'do-regional-archive',
    'backup',
    1,
    1,
    5,
    'do-spaces-price',
    'One Spaces subscription bundles regional redacted logs and file backup storage; 250 GiB storage and 1024 GiB outbound included once. Not an extra Supabase database backup or unlimited log index.',
  );
  add(
    'do-archive-storage-overage',
    'backup',
    Math.max(0, archive.min - 250),
    Math.max(0, archive.max - 250),
    0.02,
    'do-spaces-price',
    'Stored archive bytes above the single 250-GiB allowance; includes authored 1–4 KiB redacted log events per API request plus retained file snapshots.',
  );
  add(
    'do-archive-restore-egress',
    'egress',
    0,
    Math.max(0, archive.max - 1024),
    0.01,
    'do-spaces-price',
    'One full archive restore/download per month at upper bound; 1024-GiB Spaces outbound allowance once. Additional restore cycles need an explicit quote.',
  );
  const included = servers * (count === 1 ? 100 : 150) + workers * 100;
  add(
    'network-egress',
    'egress',
    Math.max(0, (q.egress + backup.min) / 1.073741824 + logs.min - included),
    Math.max(
      0,
      (q.egress * 2 + backup.max) / 1.073741824 + logs.max - included,
    ),
    0.02,
    'do-app-price',
    'App Platform team transfer allowances pooled once, decimal GB converted to GiB. Conservatively charges full app traffic plus archive uploads here; source Supabase backup download is separately charged there. No Spaces/Droplet allowance is mixed into app transfer.',
  );
  assumptions.push(
    `App Platform reference profile: ${servers} application/SSR and ${workers} background one-GiB shared-CPU containers, USD${rate}/application container and USD10/background container monthly. Fixed USD10 SKU is never scaled horizontally; if multiple instances are required use the USD12 SKU. A 99/99.9 target proposes single managed component instances relying on provider recovery, not application HA; higher targets add at least two instances. The component SLA does not establish complete-app availability, database failover or measured capacity. Shared CPU, memory, connection limits and failover require load/restore tests before production.`,
  );
  assumptions.push(
    'App Platform builds/tests run in the native build stage within published build limits; no separately paid hosted CI or private container registry is enabled. Regional app, Supabase and Spaces are separate configured boundaries. Redacted logs are exported in batches with retries to the region-pinned S3-compatible Spaces bucket; ephemeral disk is only a bounded temporary buffer, never the durable archive. Authored 1–4 KiB/request log payload and one monthly full restore are scenarios, not measured retention/volume. Archive is a single USD5 Spaces subscription; DB seven-day backups remain the Supabase tier policy.',
  );
  return backup;
}
