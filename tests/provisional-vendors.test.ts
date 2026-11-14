import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { recommend } from '../packages/engine/src/index.js';
import { validateOutput, serialize } from '../packages/contracts/src/index.js';
const read = (name: string) =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8'),
  );
const all = read('public/scenarios');
describe('provisional vendor recommendations', () => {
  it.each(all.map((s: any) => [s.scenario_id, s]))(
    'returns a real stack for %s with explicit unresolved conditions',
    (_, input) => {
      const before = serialize(input),
        r = recommend(input);
      expect(r.stack).not.toBeNull();
      expect(validateOutput(r)).toEqual([]);
      expect(serialize(input)).toBe(before);
      if (['P2', 'P4', 'P5', 'P6'].includes(input.scenario_id)) {
        expect(r.status).toBe('ok_with_warnings');
        expect(r.warnings.some((w) => w.severity === 'critical')).toBe(true);
        expect(r.assumptions.join(' ')).toContain('Reduced scope of assurance');
        expect(
          r.data_flows.some((f) => f.verification === 'external_scope_review'),
        ).toBe(true);
      }
    },
  );
  it.each(
    ['india', 'eu', 'us'].flatMap((region) =>
      ['phone_otp', 'email_password'].flatMap((auth) =>
        [true, false].map((payments) => [region, auth, payments]),
      ),
    ),
  )(
    'handles %s / %s / payments=%s without identifier rules',
    (region, auth, payments) => {
      const input = structuredClone(all[1]);
      input.scenario_id = 'unseen';
      input.project.name = 'Alternate project';
      input.infrastructure.data_residency = region;
      input.requirements.auth = auth;
      input.requirements.payments = payments;
      if (payments) input.compliance = ['pci_dss'];
      const result = recommend(input);
      expect(result.stack).not.toBeNull();
      expect(validateOutput(result)).toEqual([]);
      if (payments)
        expect(
          result.stack!.supporting!.some(
            (s) =>
              s.service_id === (region === 'india' ? 'razorpay' : 'stripe'),
          ),
        ).toBe(true);
    },
  );
  it('reuses the existing Entra tenant through direct federation rather than adding Keycloak', () => {
    const r = recommend(all[4]),
      ids = r.stack!.supporting!.map((s) => s.service_id);
    expect(ids).toContain('entra');
    expect(ids).not.toContain('keycloak');
    expect(r.primary_region).toBe('centralindia');
    expect(
      r.warnings.some(
        (w) =>
          w.code === 'EXISTING_IDENTITY_SCOPE_UNVERIFIED' &&
          w.severity === 'critical',
      ),
    ).toBe(true);
  });
  it('keeps real air-gap conflicts infeasible', () => {
    const r = recommend(read('airgap-conflict'));
    expect(r.status).toBe('infeasible');
    expect(r.stack).toBeNull();
  });
  it('reconciles headline infrastructure separately from additional activity fees', () => {
    for (const input of all) {
      const r = recommend(input),
        g = r.cost_groups.find(
          (g) => g.category === 'infrastructure_and_operations',
        )!;
      expect(r.estimated_cost_scope).toBe('infrastructure_and_operations');
      expect(r.estimated_monthly_cost_usd.min).toBe(g.min);
      expect(r.estimated_monthly_cost_usd.max).toBe(g.max);
    }
    const input = structuredClone(all[1]),
      baseline = recommend(input);
    input.extensions = {
      monthly_otp_count: 500000,
      monthly_payment_transactions: 100000,
      average_payment_value_usd: 100,
    };
    const changed = recommend(input);
    expect(changed.estimated_monthly_cost_usd.min).toBe(
      baseline.estimated_monthly_cost_usd.min,
    );
    expect(changed.estimated_monthly_cost_usd.max).toBe(
      baseline.estimated_monthly_cost_usd.max,
    );
    expect(
      changed.cost_groups.find(
        (g) => g.category === 'payment_and_message_activity',
      )!.max,
    ).toBeGreaterThan(
      baseline.cost_groups.find(
        (g) => g.category === 'payment_and_message_activity',
      )!.max,
    );
  });
});
