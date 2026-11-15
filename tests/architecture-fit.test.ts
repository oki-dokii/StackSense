import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { recommend, planCore } from '../packages/engine/src/index.js';
import {
  defaultCatalog,
  assertCatalog,
} from '../packages/catalog/src/index.js';
import { serialize } from '../packages/contracts/src/index.js';
const scenarios = JSON.parse(
  readFileSync(
    new URL('../fixtures/public/scenarios.json', import.meta.url),
    'utf8',
  ),
);
const ids = (r: ReturnType<typeof recommend>) =>
  r.decision_trace.selected_plan_id!.split('|');
describe('authored acceptable/known-bad public rubric', () => {
  it('keeps a static portfolio free of server/database complexity', () => {
    const r = recommend(scenarios[0]);
    expect(ids(r).slice(2, 4)).toEqual(['backend-none', 'database-none']);
    expect(r.estimated_monthly_cost_usd.max).toBe(0);
  });
  it.each([1, 5])(
    'retains actual phone delivery and complete application capability for P%s',
    (i) => {
      const r = recommend(scenarios[i]);
      expect(r.stack).not.toBeNull();
      expect(r.stack!.supporting!.some((c) => c.service_id === 'msg91')).toBe(
        true,
      );
      expect(
        r.warnings.some(
          (w) =>
            w.code === 'EXTERNAL_RESIDENCY_UNVERIFIED' &&
            w.severity === 'critical',
        ),
      ).toBe(true);
      if (i === 1) {
        for (const layer of [
          'payments',
          'search',
          'realtime',
          'queue',
          'storage',
        ])
          expect(r.stack!.supporting!.some((c) => c.layer === layer)).toBe(
            true,
          );
      } else {
        expect(r.stack!.supporting!.some((c) => c.service_id === 'expo')).toBe(
          true,
        );
        expect(r.stack!.supporting!.some((c) => c.layer === 'queue')).toBe(
          true,
        );
      }
    },
  );
  it('considers Go for the TS/Go whiteboard without claiming a latency benchmark', () => {
    const seen: any[] = [];
    const r = recommend(scenarios[2], {
      onCompletePlans: (p) => seen.push(...p),
    });
    expect(seen.some((p) => p.plan_id.split('|')[2] === 'go-http')).toBe(true);
    expect(['go-http', 'fastify', 'express', 'nestjs']).toContain(ids(r)[2]);
    expect(r.stack!.supporting!.some((c) => c.service_id === 'yjs')).toBe(true);
    expect(r.warnings.some((w) => w.code.includes('LATENCY'))).toBe(true);
  });
  it.each(['original', 'renamed'])(
    'favors supported JVM depth for a senior Java/Kotlin team: %s',
    (name) => {
      const s = structuredClone(scenarios[3]);
      if (name === 'renamed') {
        s.scenario_id = 'private-audit';
        s.project.name = 'Different lender';
      }
      expect(ids(recommend(s))[2]).toBe('spring');
    },
  );
  it('retains existing SQL Server and Entra without inventing geography or license entitlement', () => {
    const r = recommend(scenarios[4]);
    expect(ids(r).slice(2, 4)).toEqual(['aspnet', 'sqlserver']);
    expect(r.database_region).toBeNull();
    expect(
      r.data_flows.find((f) => f.component === 'primary-database')!.location,
    ).toContain('unverified');
    expect(r.stack!.supporting!.some((c) => c.service_id === 'entra')).toBe(
      true,
    );
    expect(
      r.warnings.some(
        (w) =>
          w.code === 'EXISTING_DATABASE_SCOPE_UNVERIFIED' &&
          w.severity === 'critical',
      ),
    ).toBe(true);
    expect(
      r.cost_breakdown.some((l) => l.id === 'existing-database-operations'),
    ).toBe(true);
    expect(
      r.cost_breakdown.some(
        (l) => l.id === 'database-cpu' || l.id === 'sqlserver-license',
      ),
    ).toBe(false);
  });
  it('makes reuse depend on the system inventory, not project identity', () => {
    const s = structuredClone(scenarios[4]);
    s.scenario_id = 'unknown';
    s.project.name = 'New title';
    s.infrastructure.existing_systems =
      s.infrastructure.existing_systems.filter(
        (v: string) => !/sql\s+server/i.test(v),
      );
    expect(ids(recommend(s))[3]).not.toBe('sqlserver');
  });
});
describe('bounded managed alternatives and honest budget ranking', () => {
  it('rejects invalid/cyclic/self-hostable managed database lineage', () => {
    const c = structuredClone(defaultCatalog);
    c.entries.find((e) => e.id === 'supabase-pg')!.upstream_database_id =
      'supabase-pg';
    expect(() => assertCatalog(c)).toThrow(/lineage/);
  });
  it('keeps managed-storage review tasks scoped to storage rather than card checkout', () => {
    const r = recommend(scenarios[5]);
    const a = r.review_actions.find(
      (a) =>
        a.fields.includes('requirements.file_media_storage') &&
        a.code === 'EXTERNAL_RESIDENCY_UNVERIFIED',
    )!;
    expect(a.references.some((s) => s.id === 'supabase-storage')).toBe(true);
    expect(a.evidence_required.join(' ')).not.toContain('card networks');
  });
  it('does not buy a database for a stateless managed-host plan', () => {
    const s = {
      project: { type: 'api_platform', platforms: ['api_only'] },
      scale: { users_at_launch: 1, users_12_months: 10 },
      team: {
        size: 1,
        experience: 'intermediate',
        languages: ['go'],
        has_devops: true,
      },
      budget: { monthly_infra_usd: 1000 },
      timeline: { mvp_weeks: 4 },
    };
    const reports: any[] = [];
    recommend(s, { onCompletePlans: (p) => reports.push(...p) });
    expect(reports.some((p) => p.plan_id.includes('|database-none|fly|'))).toBe(
      true,
    );
    const r = recommend(s);
    expect(ids(r)[3]).toBe('database-none');
    expect(
      r.cost_breakdown.some(
        (l) => l.id.startsWith('neon') || l.id.startsWith('supabase'),
      ),
    ).toBe(false);
  });
  it('never places a persistent collaborative server in bounded functions', () => {
    const s = structuredClone(scenarios[2]);
    s.project.description = '';
    s.requirements.payments = false;
    const r = recommend(s);
    expect(ids(r)[4]).not.toBe('vercel');
    expect(r.stack!.supporting!.some((c) => c.service_id === 'yjs')).toBe(true);
  });
  it('does not invent Fly/Neon India mappings', () => {
    for (const id of ['fly'])
      expect(
        defaultCatalog.entries
          .find((e) => e.id === id)!
          .regions!.some((r) => r.residency === 'india'),
      ).toBe(false);
    const r = planCore(scenarios[5], {
      catalog: {
        ...defaultCatalog,
        entries: defaultCatalog.entries.filter(
          (e) => e.layer !== 'hosting' || e.id === 'fly',
        ),
      },
    });
    expect(r.status).toBe('blocked');
  });
  it('prices seats, one project credit, file backups, telemetry and unquoted delivery separately', () => {
    const catalog = {
      ...defaultCatalog,
      entries: defaultCatalog.entries.filter((e) => e.id !== 'do-app'),
    };
    const r = recommend(scenarios[5], { catalog });
    expect(ids(r)[4]).toBe('vercel');
    const line = (id: string) => r.cost_breakdown.find((l) => l.id === id)!;
    expect(line('vercel-platform-seats').monthly_usd).toEqual({
      min: 40,
      max: 40,
    });
    expect(line('supabase-pro-project').monthly_usd.min).toBe(25);
    expect(line('file-backup-allowance').monthly_usd.max).toBeGreaterThan(0);
    expect(line('otp-delivery').monthly_usd.max).toBeGreaterThan(0);
    expect(r.estimated_total_monthly_cost_usd!.max).toBeGreaterThan(
      r.estimated_monthly_cost_usd.max,
    );
    expect(r.estimated_monthly_cost_usd.max).toBeGreaterThan(100);
    expect(r.warnings.some((w) => w.code.includes('BUDGET'))).toBe(true);
  });
  it('puts an affordable known-language plan ahead of an unaffordable higher heuristic score', () => {
    const s = structuredClone(scenarios[5]);
    s.budget.monthly_infra_usd = 150;
    const seen: any[] = [];
    const r = recommend(s, { onCompletePlans: (p) => seen.push(...p) });
    expect(seen.some((p) => p.monthly_usd.max <= 150)).toBe(true);
    expect(r.estimated_monthly_cost_usd.max).toBeLessThanOrEqual(150);
  });
  it('does not let a cheap functions runtime replace a JVM-only team with JavaScript', () => {
    const s = structuredClone(scenarios[5]);
    s.team.languages = ['java', 'kotlin'];
    s.team.experience = 'beginner';
    expect(ids(recommend(s))[2]).toBe('spring');
  });
  it('excludes known ineligible Pro tiers for HIPAA rather than just flagging a missing BAA', () => {
    const s = structuredClone(scenarios[5]);
    s.infrastructure.data_residency = 'us';
    s.compliance = ['hipaa'];
    const r = recommend(s);
    expect(r.stack).not.toBeNull();
    expect(['supabase-pg', 'neon-pg']).not.toContain(ids(r)[3]);
    expect(r.warnings.some((w) => w.code === 'BAA_EVIDENCE_REQUIRED')).toBe(
      true,
    );
  });
  it('preserves an explicit 24-month backup requirement instead of accepting a seven-day bundle', () => {
    const s = structuredClone(scenarios[5]);
    s.extensions = { retention_months: 24 };
    expect(ids(recommend(s))[3]).not.toBe('supabase-pg');
  });
  it('distinguishes registered users from daily activity and honors explicit RPS', () => {
    const s = structuredClone(scenarios[5]);
    s.extensions = { daily_active_user_fraction: 0.1 };
    const a = recommend(s);
    s.extensions.daily_active_user_fraction = 1;
    const b = recommend(s);
    expect(b.estimated_monthly_cost_usd.max).toBeGreaterThan(
      a.estimated_monthly_cost_usd.max,
    );
    s.extensions.expected_requests_per_second = 5;
    const c = recommend(s);
    s.extensions.daily_active_user_fraction = 0.05;
    const d = recommend(s);
    expect(c.estimated_monthly_cost_usd).toEqual(d.estimated_monthly_cost_usd);
    expect(d.applied_extensions).not.toContain('daily_active_user_fraction');
    expect(
      d.warnings.some(
        (w) =>
          w.code === 'EXTENSION_NOT_APPLIED' &&
          w.fields.includes('extensions.daily_active_user_fraction'),
      ),
    ).toBe(true);
  });
  it('keeps payment/OTP volume changes local to activity costs and preserves stack and infra', () => {
    for (const [field, requirements] of [
      ['monthly_otp_count', { auth: 'phone_otp' }],
      ['monthly_payment_transactions', { payments: true }],
    ] as const) {
      const s = structuredClone(scenarios[1]);
      Object.assign(s.requirements, requirements);
      s.extensions = { [field]: 100 };
      const a = recommend(s);
      s.extensions[field] = 10000;
      const b = recommend(s);
      expect(ids(b)).toEqual(ids(a));
      expect([
        b.estimated_monthly_cost_usd.min,
        b.estimated_monthly_cost_usd.max,
      ]).toEqual([
        a.estimated_monthly_cost_usd.min,
        a.estimated_monthly_cost_usd.max,
      ]);
      expect(b.estimated_total_monthly_cost_usd!.max).toBeGreaterThan(
        a.estimated_total_monthly_cost_usd!.max,
      );
    }
  });
  it('keeps name-only edits outside architecture, costs and supporting services', () => {
    const s = structuredClone(scenarios[5]);
    const a = recommend(s);
    s.project.name = 'Renamed';
    s.scenario_id = 'hidden';
    const b = recommend(s);
    expect(b.stack).toEqual(a.stack);
    expect(b.estimated_monthly_cost_usd).toEqual(a.estimated_monthly_cost_usd);
    expect(serialize(recommend(s))).toBe(serialize(b));
  });
});
