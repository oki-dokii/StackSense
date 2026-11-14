import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  recommend,
  invalidRecommendation,
  SearchLimitError,
} from '../packages/engine/src/index.js';
import {
  normalizeScenario,
  validateOutput,
  serialize,
} from '../packages/contracts/src/index.js';
import { defaultCatalog } from '../packages/catalog/src/index.js';
import {
  assertPolicies,
  defaultPolicies,
} from '../packages/catalog/src/services.js';
import {
  priceLine,
  CostModelLimitError,
} from '../packages/engine/src/costs.js';
const fixture = (name: string) =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8'),
  );
const publicCases = fixture('public/scenarios');
const minimal = () => fixture('minimal');
const full = (index: number) => structuredClone(publicCases[index]);
const codes = (r: ReturnType<typeof recommend>) =>
  r.warnings.map((w) => w.code);
const services = (r: ReturnType<typeof recommend>) =>
  r.stack?.supporting?.map((s) => s.service_id) ?? [];
const line = (r: ReturnType<typeof recommend>, id: string) =>
  r.cost_breakdown.find((item) => item.id === id)!;

describe('complete recommendation contracts', () => {
  it.each(
    publicCases.map((s: any, i: number) => [
      s.scenario_id,
      s,
      [
        'ok',
        'ok_with_warnings',
        'ok_with_warnings',
        'ok_with_warnings',
        'ok_with_warnings',
        'ok_with_warnings',
      ][i],
    ]),
  )('evaluates supplied %s through generic rules', (_, s, status) => {
    const r = recommend(s);
    expect(validateOutput(r)).toEqual([]);
    expect(r.status).toBe(status);
    if (r.stack) {
      expect(r.estimate_status).toBe('estimated');
      for (const c of [
        r.stack.frontend,
        r.stack.backend,
        r.stack.database,
        r.stack.hosting,
        ...(r.stack.supporting ?? []),
      ]) {
        expect(c.alternatives.length).toBeGreaterThan(0);
        expect(c.tradeoffs.length).toBeGreaterThan(0);
        expect(c.driven_by.length).toBeGreaterThan(0);
      }
    } else {
      expect(r.estimate_status).toBe('not_estimated');
      expect(r.cost_breakdown).toEqual([]);
      expect(r.warnings.some((w) => w.severity === 'critical')).toBe(true);
    }
  });
  it('returns field-level invalid results without pretending to estimate', () => {
    const r = recommend({});
    expect(r.status).toBe('invalid_input');
    expect(r.validation_errors.length).toBeGreaterThan(1);
    expect(r.stack).toBeNull();
    expect(validateOutput(r)).toEqual([]);
    expect(
      validateOutput(
        invalidRecommendation([{ field: '$', message: 'Bad JSON' }]),
      ),
    ).toEqual([]);
  });
  it('leaves caller input and frozen policies untouched', () => {
    const raw = full(2),
      copy = structuredClone(raw);
    recommend(raw);
    expect(raw).toEqual(copy);
    expect(Object.isFrozen(defaultPolicies.services[0])).toBe(true);
  });
  it('is independent of scenario IDs and project names', () => {
    const raw = full(2),
      first = recommend(raw);
    raw.scenario_id = 'unseen';
    raw.project.name = 'Unseen business';
    const next = recommend(raw);
    expect(next.stack).toEqual(first.stack);
    expect(next.estimated_monthly_cost_usd).toEqual(
      first.estimated_monthly_cost_usd,
    );
  });
  it('is deterministic with catalog and service order reversed', () => {
    const catalog = structuredClone(defaultCatalog),
      policies = structuredClone(defaultPolicies);
    catalog.entries.reverse();
    policies.services.reverse();
    policies.frameworks.reverse();
    expect(serialize(recommend(full(2), { catalog, policies }))).toBe(
      serialize(recommend(full(2))),
    );
  });
  it('does not translate search exhaustion into infeasibility', () => {
    expect(() => recommend(full(2), { maxAssignments: 1 })).toThrow(
      SearchLimitError,
    );
  });
  it('keeps every compatible complete candidate available before ranking', () => {
    const r = recommend(full(2));
    expect(r.decision_trace.complete_candidates).toBeGreaterThan(5);
    expect(r.decision_trace.core_candidates).toBeGreaterThan(
      r.decision_trace.complete_candidates,
    );
    expect(
      r.decision_trace.rejected.some((x) =>
        x.codes.includes('SERVICE_DATABASE_MISMATCH'),
      ),
    ).toBe(true);
  });
});

describe('required services and data boundaries', () => {
  it('keeps a zero-budget static site free of unnecessary servers and duplicate CDN bills', () => {
    const r = recommend(full(0));
    expect(r.stack!.backend.choice).toBe('None');
    expect(r.stack!.database.choice).toBe('None');
    expect(r.estimated_monthly_cost_usd.min).toBe(0);
    expect(r.estimated_monthly_cost_usd.max).toBe(0);
    expect(r.cost_breakdown.map((x) => x.id)).toEqual(['static-hosting']);
    expect(services(r)).toContain('cdn');
    expect(services(r)).toContain('local-build');
  });
  it('supports offline public content without inventing a transactional queue/database', () => {
    const raw = full(0);
    raw.requirements.offline_support = true;
    const r = recommend(raw);
    expect(r.stack!.database.choice).toBe('None');
    expect(services(r)).toContain('workbox');
    expect(services(r)).not.toContain('outbox');
    expect(r.estimated_monthly_cost_usd.max).toBe(0);
  });
  it('selects tenant isolation and outbox on a compatible database, not a post-hoc incompatible add-on', () => {
    const raw = minimal();
    raw.requirements = {
      auth: 'email_password',
      multi_tenant: true,
      offline_support: true,
    };
    const r = recommend(raw);
    expect(r.stack!.database.choice).toBe('PostgreSQL');
    expect(services(r)).toEqual(
      expect.arrayContaining(['rls', 'outbox', 'keycloak', 'dexie']),
    );
  });
  it('includes durable collaboration and native search services when requested', () => {
    const raw = full(2);
    raw.requirements.full_text_search = true;
    const r = recommend(raw);
    expect(services(r)).toEqual(
      expect.arrayContaining([
        'yjs',
        'outbox',
        'pg-search',
        'keycloak',
        'stripe',
        'otel',
      ]),
    );
  });
  it('does not confuse local Keycloak TOTP with phone delivery', () => {
    const raw = minimal();
    raw.requirements = { auth: 'phone_otp' };
    raw.extensions = { monthly_otp_count: 1000 };
    const r = recommend(raw);
    expect(services(r)).toEqual(expect.arrayContaining(['msg91', 'keycloak']));
    expect(line(r, 'otp-delivery').quantity).toEqual({ min: 1000, max: 1000 });
    expect(
      r.stack!.supporting!.find((x) => x.service_id === 'msg91')!.justification,
    ).toContain('custom Keycloak');
  });
  it('flags provisional India OTP when vendor residency is unverified', () => {
    const r = recommend(full(1));
    expect(r.stack).not.toBeNull();
    expect(codes(r)).toContain('EXTERNAL_RESIDENCY_UNVERIFIED');
  });
  it('blocks social identity under an air gap', () => {
    const raw = minimal();
    raw.infrastructure = { deployment_model: 'air_gapped' };
    raw.requirements = { auth: 'social' };
    const r = recommend(raw);
    expect(r.status).toBe('infeasible');
    expect(codes(r)).toContain('RESTRICTED_PUBLIC_IDENTITY');
  });
  it('blocks payment services under an air gap', () => {
    const raw = minimal();
    raw.infrastructure = { deployment_model: 'air_gapped' };
    raw.requirements = { payments: true };
    const r = recommend(raw);
    expect(r.status).toBe('infeasible');
    expect(codes(r)).toContain('RESTRICTED_EXTERNAL_SERVICE');
  });
  it('checks existing identity data scope separately from the app hosting region', () => {
    const raw = minimal();
    raw.infrastructure = {
      data_residency: 'eu',
      existing_systems: ['Microsoft Entra ID'],
    };
    raw.requirements = { auth: 'enterprise_sso' };
    const r = recommend(raw);
    expect(r.status).toBe('ok_with_warnings');
    expect(
      r.warnings.find((w) => w.code === 'EXISTING_IDENTITY_SCOPE_UNVERIFIED')
        ?.severity,
    ).toBe('critical');
    expect(codes(r)).toContain('EXISTING_IDENTITY_SCOPE_UNVERIFIED');
  });
  it('requires executed BAA evidence for HIPAA cloud services', () => {
    const raw = minimal();
    raw.requirements = { auth: 'email_password' };
    raw.compliance = ['hipaa'];
    const r = recommend(raw);
    expect(r.status).toBe('ok_with_warnings');
    expect(
      r.warnings.find((w) => w.code === 'BAA_EVIDENCE_REQUIRED')?.severity,
    ).toBe('critical');
    expect(codes(r)).toContain('BAA_EVIDENCE_REQUIRED');
  });
  it('records GDPR/ISO control designs without claiming certification', () => {
    const raw = minimal();
    raw.compliance = ['gdpr', 'iso27001'];
    const r = recommend(raw);
    expect(r.stack).not.toBeNull();
    expect(codes(r)).toContain('COMPLIANCE_IMPLEMENTATION_REVIEW');
    expect(r.control_plan!.frameworks).toHaveLength(2);
    expect(
      r.control_plan!.frameworks.every(
        (x) => x.verification === 'design_only_not_certified',
      ),
    ).toBe(true);
  });
  it('derives India residency only from an explicit RBI requirement', () => {
    const raw = minimal();
    raw.compliance = ['rbi_localisation'];
    const r = recommend(raw);
    expect(r.primary_region).toBe('asia-south1');
    expect(
      r.assumptions.some((x) =>
        x.includes('effective payment-data residency is India'),
      ),
    ).toBe(true);
    expect(raw.infrastructure).toBeUndefined();
  });
  it('does not approve contradictory RBI and EU region policy', () => {
    const raw = minimal();
    raw.compliance = ['rbi_localisation'];
    raw.infrastructure = { data_residency: 'eu' };
    const r = recommend(raw);
    expect(r.status).toBe('infeasible');
    expect(codes(r)).toContain('RBI_REGION_CONFLICT');
  });
  it.each(['training', 'llm_rag'])(
    'does not substitute generic CPU serving for %s',
    (ml) => {
      const raw = minimal();
      raw.requirements = { ml_features: ml };
      const r = recommend(raw);
      expect(r.status).toBe('infeasible');
      expect(codes(r)).toContain('ML_DEPLOYMENT_COVERAGE_GAP');
    },
  );
  it('budgets colocated inference with explicit sizing assumptions', () => {
    const raw = minimal();
    raw.requirements = { ml_features: 'inference_api' };
    const r = recommend(raw);
    expect(services(r)).toContain('onnx');
    expect(r.assumptions.some((x) => x.includes('exported to ONNX'))).toBe(
      true,
    );
  });
  it('uses the newly reviewed AWS Mumbai primary mapping', () => {
    const raw = minimal();
    raw.infrastructure = { cloud_preference: 'aws', data_residency: 'india' };
    const r = recommend(raw);
    expect(r.stack).not.toBeNull();
    expect(r.primary_region).toBe('ap-south-1');
    expect(r.database_region).toBe('ap-south-1');
  });
});

describe('cost envelopes and warnings', () => {
  it('totals priced resources in integer cents with outward line rounding', () => {
    const r = recommend(full(2));
    for (const bound of ['min', 'max'] as const) {
      const cents = r.cost_breakdown
        .filter((x) => x.category !== 'payments' && x.id !== 'otp-delivery')
        .reduce((sum, x) => sum + Math.round(x.monthly_usd[bound] * 100), 0);
      expect(Math.round(r.estimated_monthly_cost_usd[bound] * 100)).toBe(cents);
    }
    expect(r.estimated_monthly_cost_usd.min).toBeGreaterThan(0);
    expect(r.estimated_monthly_cost_usd.max).toBeGreaterThan(
      r.estimated_monthly_cost_usd.min,
    );
  });
  it('rounds fractional-cent intervals outwards', () => {
    const r = priceLine(
      'test',
      'test',
      { min: 1, max: 1 },
      { min: 0.001, max: 0.009, source_ids: ['test'], basis: 'test' },
    );
    expect(r.monthly_usd).toEqual({ min: 0, max: 0.01 });
  });
  it('does not round sub-micro reference rates inward at a cent boundary', () => {
    const r = priceLine(
      'test',
      'test',
      { min: 1, max: 1 },
      { min: 0.0099999, max: 0.0099999, source_ids: ['test'], basis: 'test' },
    );
    expect(r.monthly_usd).toEqual({ min: 0, max: 0.01 });
  });
  it.each([-1, NaN, Infinity, 1e10])(
    'rejects unsafe quantity %s without generating NaN costs',
    (q) => {
      expect(() =>
        priceLine(
          'test',
          'test',
          { min: q, max: q },
          { min: 1, max: 1, source_ids: ['test'], basis: 'test' },
        ),
      ).toThrow(CostModelLimitError);
    },
  );
  it('reports model-envelope exhaustion honestly', () => {
    const raw = minimal();
    raw.scale.users_12_months = 1e12;
    const r = recommend(raw);
    expect(r.status).toBe('infeasible');
    expect(codes(r)).toContain('COST_MODEL_COVERAGE_GAP');
    expect(r.estimate_status).toBe('not_estimated');
  });
  it('marks dynamic zero-budget recommendations as explicitly over budget', () => {
    const r = recommend(minimal());
    expect(r.status).toBe('ok_with_warnings');
    expect(codes(r)).toContain('BUDGET_EXCEEDED');
    expect(r.estimated_monthly_cost_usd.min).toBeGreaterThan(0);
  });
  it('uses payment volume/value inputs and leaves unrelated extensions unapplied', () => {
    const raw = minimal();
    raw.requirements = { payments: true };
    raw.extensions = {
      monthly_payment_transactions: 100,
      average_payment_value_usd: 10,
      monthly_egress_gb: 2,
      primary_user_region: 'Mars',
    };
    const r = recommend(raw);
    expect(line(r, 'payment-variable').quantity).toEqual({
      min: 1000,
      max: 1000,
    });
    expect(line(r, 'payment-fixed').quantity).toEqual({ min: 100, max: 100 });
    expect(r.applied_extensions).toEqual([
      'average_payment_value_usd',
      'monthly_egress_gb',
      'monthly_payment_transactions',
    ]);
    expect(
      r.warnings.some(
        (x) =>
          x.code === 'EXTENSION_NOT_APPLIED' &&
          x.fields.includes('extensions.primary_user_region'),
      ),
    ).toBe(true);
    expect(
      r.warnings.some(
        (x) =>
          x.code === 'EXTENSION_NOT_APPLIED' &&
          x.fields.includes('extensions.monthly_payment_transactions'),
      ),
    ).toBe(false);
  });
  it('uses full requested backup retention rather than silently capping it', () => {
    const raw = minimal();
    raw.extensions = { retention_months: 24 };
    const r = recommend(raw);
    expect(line(r, 'backup-storage').quantity.min).toBe(240);
  });
  it('keeps availability and latency targets explicitly unverified', () => {
    const r = recommend(full(2));
    expect(codes(r)).toEqual(
      expect.arrayContaining([
        'AVAILABILITY_TARGET_UNVERIFIED',
        'LATENCY_TARGET_UNVERIFIED',
      ]),
    );
  });
  it.each(['duplicate', 'source', 'rate', 'schema'])(
    'rejects invalid policy %s as internal data failure',
    (kind) => {
      const p = structuredClone(defaultPolicies);
      if (kind === 'duplicate') p.services.push(p.services[0]!);
      if (kind === 'source') p.services[0]!.source_ids = ['missing'];
      if (kind === 'rate')
        p.pricing.cloudrun_hour!.min = p.pricing.cloudrun_hour!.max + 1;
      if (kind === 'schema') delete (p.services[0] as any).placement;
      expect(() => assertPolicies(p)).toThrow();
    },
  );
});
