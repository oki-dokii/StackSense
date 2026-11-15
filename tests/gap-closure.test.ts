import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { recommend } from '../packages/engine/src/index.js';
import { defaultCatalog } from '../packages/catalog/src/index.js';
import { normalizeScenario } from '../packages/contracts/src/index.js';
import { appPlatformCost } from '../packages/engine/src/do-costs.js';
const pub = JSON.parse(
  readFileSync(
    new URL('../fixtures/public/scenarios.json', import.meta.url),
    'utf8',
  ),
);
const ids = (r: ReturnType<typeof recommend>) =>
  r.decision_trace.selected_plan_id!.split('|');
const line = (r: ReturnType<typeof recommend>, id: string) =>
  r.cost_breakdown.find((x) => x.id === id)!;
describe('remaining engineering gaps: qualified budgets without scope edits', () => {
  it.each([4, 5])(
    'puts public case index %s inside infrastructure budget with original fields',
    (index) => {
      const s = structuredClone(pub[index]),
        before = structuredClone(s),
        r = recommend(s);
      expect(s).toEqual(before);
      expect(r.estimated_monthly_cost_usd.max).toBeLessThanOrEqual(
        s.budget.monthly_infra_usd,
      );
      expect(r.warnings.some((w) => w.severity === 'critical')).toBe(true);
      expect(r.budget_planning!.options).toEqual([]);
    },
  );
  it('retains the P2 upper-bound overrun instead of clipping or silently lowering availability', () => {
    const r = recommend(pub[1]);
    expect(ids(r)[4]).toBe('do-app');
    expect(r.estimated_monthly_cost_usd.min).toBeLessThan(150);
    expect(r.estimated_monthly_cost_usd.max).toBeGreaterThan(150);
    expect(r.estimated_monthly_cost_usd.max).toBeLessThan(160);
    expect(r.warnings.some((w) => w.code.includes('BUDGET'))).toBe(true);
    expect(
      r.warnings.some((w) => w.code === 'ARCHIVE_INTEGRATION_UNVERIFIED'),
    ).toBe(true);
  });
  it('uses a separately evidenced B1 tariff and preserves private SQL/metadata conditions', () => {
    const r = recommend(pub[4]);
    expect(ids(r).slice(2, 5)).toEqual([
      'aspnet',
      'sqlserver',
      'appservice-india',
    ]);
    expect(line(r, 'application-compute').unit_rate_usd).toEqual({
      min: 0.018,
      max: 0.018,
    });
    expect(line(r, 'application-compute').quantity.min).toBe(3 * 730);
    expect(
      r.warnings.some((w) => w.code === 'AZURE_STANDARD_SCOPE_UNVERIFIED'),
    ).toBe(true);
    expect(
      r.warnings.some((w) => w.code === 'EXISTING_DATABASE_SCOPE_UNVERIFIED'),
    ).toBe(true);
  });
  it.each(['aws', 'gcp', 'azure'])(
    'keeps explicit %s preference strict despite cheaper DigitalOcean plans',
    (provider) => {
      const s = structuredClone(pub[5]);
      s.infrastructure.cloud_preference = provider;
      expect(ids(recommend(s))[4]).not.toBe('do-app');
    },
  );
  it('does not place collaborative or inference work on an unreviewed cheap profile', () => {
    for (const s of [pub[2], pub[3]])
      expect(ids(recommend(s))[4]).not.toBe('do-app');
  });
  it('retains paid memory tiers, continuous worker and one regional archive subscription', () => {
    const r = recommend(pub[1]);
    expect(line(r, 'do-application-containers').monthly_usd).toEqual({
      min: 20,
      max: 20,
    });
    expect(line(r, 'do-background-containers').monthly_usd).toEqual({
      min: 10,
      max: 10,
    });
    expect(line(r, 'do-regional-archive').monthly_usd).toEqual({
      min: 5,
      max: 5,
    });
    expect(
      r.cost_breakdown.some((l) =>
        ['hosted-ci', 'telemetry-headroom', 'file-backup-allowance'].includes(
          l.id,
        ),
      ),
    ).toBe(false);
    expect(line(r, 'supabase-egress').quantity.max).toBe(450);
  });
  it('uses a scalable paid SKU above one instance rather than horizontally scaling the fixed SKU', () => {
    const s = structuredClone(pub[5]);
    s.scale.peak_concurrent_users = 1500;
    s.budget.monthly_infra_usd = 10000;
    s.requirements.availability = '99.99';
    const r = recommend(s, {
      catalog: {
        ...defaultCatalog,
        entries: defaultCatalog.entries.filter(
          (e) => e.layer !== 'hosting' || e.id === 'do-app',
        ),
      },
    });
    expect(r.stack).not.toBeNull();
    expect(line(r, 'do-application-containers').unit_rate_usd).toEqual({
      min: 12,
      max: 12,
    });
    expect(line(r, 'do-application-containers').quantity.min).toBe(2);
  });
  it('prices archive/transfer above included allowances with a hand-calculated boundary', () => {
    const s = normalizeScenario(pub[5]).normalized_input!;
    const plan: any = { frontend: { runtime: 'none' } };
    const support: any = {
      components: [
        {
          placement: 'host',
          service_id: 'do-archive',
          incremental_compute_units: 0.25,
        },
      ],
    };
    const lines: any[] = [];
    appPlatformCost(
      plan,
      s,
      support,
      {
        requests: 0,
        peak: 1,
        totalData: 300 * 1.073741824,
        egress: 0,
        retention: 1,
      },
      lines,
      [],
    );
    expect(
      lines.find((l) => l.id === 'do-archive-storage-overage').monthly_usd,
    ).toEqual({ min: 0, max: 7 });
    expect(lines.find((l) => l.id === 'network-egress').monthly_usd.max).toBe(
      8,
    );
  });
  it('retains raw official regional tariff evidence without inferring quote eligibility', () => {
    const evidence = JSON.parse(
      readFileSync(
        new URL('../evaluation/azure-b1-price.json', import.meta.url),
        'utf8',
      ),
    );
    expect(
      evidence.items.some(
        (i: any) =>
          i.currencyCode === 'USD' &&
          i.armRegionName === 'centralindia' &&
          i.skuName === 'B1' &&
          i.retailPrice === 0.018,
      ),
    ).toBe(true);
  });
  it('charges metered realtime only when that service is selected, not for self-hosted Yjs', () => {
    const r = recommend(pub[2]);
    expect(r.stack!.supporting!.some((c) => c.service_id === 'yjs')).toBe(true);
    expect(
      r.cost_breakdown.some((l) => l.id.startsWith('supabase-realtime')),
    ).toBe(false);
  });
  it('uses supplied billed message volume to narrow P2 without editing requirements', () => {
    const s = structuredClone(pub[1]);
    s.extensions = { monthly_realtime_messages: 9_000_000 };
    const r = recommend(s);
    expect(r.estimated_monthly_cost_usd.max).toBeLessThanOrEqual(150);
    expect(s.requirements).toEqual(pub[1].requirements);
    expect(r.applied_extensions).toContain('monthly_realtime_messages');
    expect(
      r.warnings.some((w) => w.code === 'MANAGED_TIER_CAPACITY_REVIEW'),
    ).toBe(true);
  });
  it('preserves an inactive message extension as unapplied on self-hosted transport', () => {
    const s = structuredClone(pub[2]);
    s.extensions = { monthly_realtime_messages: 0 };
    const r = recommend(s);
    expect(r.applied_extensions).not.toContain('monthly_realtime_messages');
    expect(
      r.warnings.some(
        (w) =>
          w.code === 'EXTENSION_NOT_APPLIED' &&
          w.fields.includes('extensions.monthly_realtime_messages'),
      ),
    ).toBe(true);
  });
});
