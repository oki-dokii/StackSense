import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { recommend } from '../packages/engine/src/index.js';
import { serialize, validateOutput } from '../packages/contracts/src/index.js';
const publicCases = JSON.parse(
  readFileSync(
    new URL('../fixtures/public/scenarios.json', import.meta.url),
    'utf8',
  ),
);
const expensive = () => {
  const s = structuredClone(publicCases[1]);
  s.infrastructure.cloud_preference = 'aws';
  return s;
};
const smallVm = () => ({
  project: { type: 'api_platform', platforms: ['api_only'] },
  scale: {
    users_at_launch: 10,
    users_12_months: 100,
    peak_concurrent_users: 1,
    data_volume_gb_12_months: 10,
  },
  team: {
    size: 2,
    experience: 'intermediate',
    languages: ['go'],
    has_devops: true,
  },
  timeline: { mvp_weeks: 8 },
  budget: { monthly_infra_usd: 100 },
  infrastructure: {
    cloud_preference: 'aws',
    deployment_model: 'self_hosted_cloud_vm',
    data_residency: 'india',
  },
  requirements: { availability: '99' },
  extensions: { monthly_egress_gb: 0 },
});
const line = (r: ReturnType<typeof recommend>, id: string) =>
  r.cost_breakdown.find((l) => l.id === id)!;
describe('cost scope and explicit budget proposals', () => {
  it.each(publicCases.map((s: any) => [s.scenario_id, s]))(
    '%s reconciles total spend and retains critical conditions',
    (_, s) => {
      const before = serialize(s),
        r = recommend(s);
      expect(validateOutput(r)).toEqual([]);
      expect(serialize(s)).toBe(before);
      for (const bound of ['min', 'max'] as const)
        expect(
          Math.round(r.estimated_total_monthly_cost_usd![bound] * 100),
        ).toBe(
          r.cost_breakdown.reduce(
            (n, l) => n + Math.round(l.monthly_usd[bound] * 100),
            0,
          ),
        );
      for (const o of r.budget_planning!.options) {
        expect(o.requires_acceptance).toBe(true);
        expect(
          o.warnings.some(
            (w) =>
              w.code === 'BUDGET_REQUIREMENT_CHANGE' &&
              w.severity === 'critical',
          ),
        ).toBe(true);
        // A different managed/self-hosted vendor can change vendor-specific review codes; unchanged external delivery/payment scopes must remain qualified.
        for (const code of [
          'EXTERNAL_RESIDENCY_UNVERIFIED',
          'EXISTING_IDENTITY_SCOPE_UNVERIFIED',
        ])
          if (r.warnings.some((w) => w.code === code))
            expect(o.warnings.some((w) => w.code === code)).toBe(true);
      }
    },
  );
  it('charges continuous Cloud Run support for the full month, not request duty', () => {
    const input = structuredClone(publicCases[1]);
    input.infrastructure.cloud_preference = 'gcp';
    const r = recommend(input),
      bg = line(r, 'background-compute'),
      app = line(r, 'application-compute');
    expect(bg.quantity.min).toBe(bg.quantity.max);
    expect(bg.quantity.min % 730).toBe(0);
    expect(bg.quantity.min).toBeGreaterThan(0);
    expect(app.quantity.min).toBeLessThan(app.quantity.max);
    expect(r.estimated_monthly_cost_usd.assumptions.join(' ')).toContain(
      'instance-based CPU',
    );
  });
  it('reproduces an optional proposal by applying only its disclosed changes', () => {
    const s = expensive(),
      before = serialize(s),
      base = recommend(s),
      o = base.budget_planning!.options[0]!;
    expect(o.core.hosting).toContain('Lightsail');
    expect(o.monthly_infrastructure_usd.max).toBeLessThan(
      base.estimated_monthly_cost_usd.max,
    );
    expect(o.budget_fit).toBe('range_risk');
    expect(serialize(s)).toBe(before);
    const changed = structuredClone(s);
    for (const c of o.changes) {
      const [group, key] = c.field.split('.');
      expect(changed[group!][key!]).toBe(c.from);
      changed[group!][key!] = c.to;
    }
    const rerun = recommend(changed, { budgetPlanning: false });
    expect(rerun.decision_trace.selected_plan_id).toBe(o.plan_id);
    expect(rerun.estimated_monthly_cost_usd.min).toBe(
      o.monthly_infrastructure_usd.min,
    );
    expect(rerun.estimated_monthly_cost_usd.max).toBe(
      o.monthly_infrastructure_usd.max,
    );
    expect(changed.requirements.payments).toBe(s.requirements.payments);
    expect(changed.requirements.auth).toBe(s.requirements.auth);
    expect(changed.scale).toEqual(s.scale);
    expect(changed.compliance).toEqual(s.compliance);
  });
  it('preserves Azure preference even if a cheaper AWS VM exists', () => {
    const r = recommend(publicCases[4]);
    for (const o of r.budget_planning!.options) {
      expect(o.core.hosting).toContain('Azure');
      expect(
        o.changes.some((c) => c.field === 'infrastructure.deployment_model'),
      ).toBe(false);
      expect(['within_upper', 'range_risk', 'over_budget']).toContain(
        o.budget_fit,
      );
    }
  });
  it('avoids recursive proposal trees and callbacks from internal budget trials', () => {
    let count = 0;
    const r = recommend(expensive(), { onCompletePlans: () => count++ });
    expect(count).toBe(1);
    expect(r.budget_planning!.options.length).toBe(1);
    expect(
      recommend(expensive(), { budgetPlanning: false }).budget_planning!
        .options,
    ).toEqual([]);
  });
  it('uses published full-month bundles without duplicating SSD or transfer allowances', () => {
    const r = recommend(smallVm());
    expect(r.stack!.hosting.choice).toContain('Lightsail');
    expect(line(r, 'application-compute').monthly_usd).toEqual({
      min: 24,
      max: 24,
    });
    expect(line(r, 'network-egress').monthly_usd).toEqual({ min: 0, max: 0 });
    expect(r.cost_breakdown.some((l) => l.id === 'database-extra-disk')).toBe(
      false,
    );
    expect(r.cost_breakdown.some((l) => l.id === 'network-fixed')).toBe(false);
  });
  it('adds explicit block storage beyond the reserved database disk and charges snapshot retention', () => {
    const s: any = smallVm();
    s.project.type = 'web_app';
    s.requirements.auth = 'email_password';
    s.scale.data_volume_gb_12_months = 100;
    const r = recommend(s);
    expect(r.stack!.hosting.choice).toContain('Lightsail');
    expect(line(r, 'database-extra-disk').quantity).toEqual({
      min: 40,
      max: 40,
    });
    expect(line(r, 'database-extra-disk').monthly_usd).toEqual({
      min: 4,
      max: 4,
    });
    s.extensions.retention_months = 2;
    const changed = recommend(s);
    expect(line(changed, 'backup-storage').monthly_usd.max).toBe(
      line(r, 'backup-storage').monthly_usd.max * 2,
    );
  });
  it('shows phone delivery in total spend even with identical infrastructure', () => {
    const phone = structuredClone(publicCases[1]);
    phone.extensions = { monthly_otp_count: 10000 };
    const email = structuredClone(phone);
    email.requirements.auth = 'email_password';
    const a = recommend(phone),
      b = recommend(email);
    expect(a.estimated_monthly_cost_usd).toMatchObject({
      min: b.estimated_monthly_cost_usd.min,
      max: b.estimated_monthly_cost_usd.max,
    });
    expect(a.estimated_total_monthly_cost_usd!.max).toBeGreaterThan(
      b.estimated_total_monthly_cost_usd!.max,
    );
  });
  it('retains genuine air-gap conflicts rather than creating a cheap external proposal', () => {
    const s = JSON.parse(
      readFileSync(
        new URL('../fixtures/airgap-conflict.json', import.meta.url),
        'utf8',
      ),
    );
    const r = recommend(s);
    expect(r.status).toBe('infeasible');
    expect(r.budget_planning!.options).toEqual([]);
    expect(r.estimated_total_monthly_cost_usd!.max).toBe(0);
  });
  it.each(['total', 'budget_fit', 'critical_warning', 'duplicate_change'])(
    'rejects inconsistent %s evidence in an exported result',
    (kind) => {
      const r = structuredClone(recommend(expensive()));
      if (kind === 'total') r.estimated_total_monthly_cost_usd!.max += 1;
      else if (kind === 'budget_fit')
        r.budget_planning!.options[0]!.budget_fit = 'within_upper';
      else if (kind === 'critical_warning')
        r.budget_planning!.options[0]!.warnings =
          r.budget_planning!.options[0]!.warnings.filter(
            (w) => w.code !== 'BUDGET_REQUIREMENT_CHANGE',
          );
      else
        r.budget_planning!.options[0]!.changes.push(
          r.budget_planning!.options[0]!.changes[0],
        );
      expect(validateOutput(r).length).toBeGreaterThan(0);
    },
  );
});
