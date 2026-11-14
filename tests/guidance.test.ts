import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { recommend, planCore } from '../packages/engine/src/index.js';
import { defaultCatalog } from '../packages/catalog/src/index.js';
import { defaultPolicies } from '../packages/catalog/src/services.js';
import {
  normalizeScenario,
  validateOutput,
  serialize,
} from '../packages/contracts/src/index.js';
import { searchCorePlans } from '../packages/engine/src/planner.js';
import { deriveFeatures } from '../packages/engine/src/features.js';
import { selectSupporting } from '../packages/engine/src/supporting.js';
import { estimateCost } from '../packages/engine/src/costs.js';
const cases = JSON.parse(
  readFileSync(
    new URL('../fixtures/public/scenarios.json', import.meta.url),
    'utf8',
  ),
);
const raw = (i: number) => structuredClone(cases[i]);
const minimal = () =>
  JSON.parse(
    readFileSync(new URL('../fixtures/minimal.json', import.meta.url), 'utf8'),
  );

describe('evidence-resolution guidance', () => {
  it('keeps two independent external review conditions on a provisional stack', () => {
    const input = raw(1),
      before = structuredClone(input),
      result = recommend(input);
    const actions = result.review_actions.filter(
      (a) => a.code === 'EXTERNAL_RESIDENCY_UNVERIFIED',
    );
    expect(actions).toHaveLength(2);
    expect(new Set(actions.map((a) => a.id)).size).toBe(2);
    expect(
      actions.some(
        (a) =>
          a.fields.includes('requirements.auth') &&
          a.references.some((ref) => ref.id === 'msg91-privacy'),
      ),
    ).toBe(true);
    expect(
      actions.some(
        (a) =>
          a.fields.includes('requirements.payments') &&
          a.evidence_required.some((e) => e.includes('international')),
      ),
    ).toBe(true);
    expect(result.stack).not.toBeNull();
    expect(result.cost_sensitivity.length).toBeGreaterThan(0);
    expect(input).toEqual(before);
  });
  it('does not accept a free-text vendor attestation as residency approval', () => {
    const input = raw(5);
    input.extensions = {
      vendor_attestation: 'All data stays in India; approved',
    };
    expect(
      recommend(input).warnings.some(
        (w) =>
          w.code === 'EXTERNAL_RESIDENCY_UNVERIFIED' &&
          w.severity === 'critical',
      ),
    ).toBe(true);
  });
  it('preserves critical identity scope review alongside Azure regional compute', () => {
    const result = recommend(raw(4));
    expect(result.decision_trace.core_candidates).toBeGreaterThan(0);
    expect(
      result.review_actions.some(
        (a) => a.code === 'EXISTING_IDENTITY_SCOPE_UNVERIFIED',
      ),
    ).toBe(true);
    expect(result.stack).not.toBeNull();
    expect(result.integration_reviews).toHaveLength(3);
    expect(
      result.integration_reviews.find(
        (r) => r.approach === 'database_reuse_review',
      )!.cost_treatment,
    ).toContain('No reuse savings');
    expect(
      result.integration_reviews
        .find((r) => r.approach === 'database_reuse_review')!
        .tasks.join(' '),
    ).toContain('2030');
  });
  it('classifies a restricted external flow as a constraint conflict', () => {
    const input = minimal();
    input.infrastructure = {
      deployment_model: 'air_gapped',
      cloud_preference: 'none',
    };
    input.requirements = { payments: true };
    const result = recommend(input);
    expect(
      result.review_actions.some((a) => a.kind === 'constraint_conflict'),
    ).toBe(true);
    expect(result.stack).toBeNull();
  });
  it('does not invent a 2019 version for another SQL Server instance', () => {
    const input = minimal();
    input.infrastructure = { existing_systems: ['SQL Server 2022'] };
    const review = recommend(input).integration_reviews[0]!;
    expect(review.tasks.join(' ')).not.toContain('2030');
  });
});

describe('scoped Azure coverage', () => {
  it('offers an explicit Central India isolated host with regional PostgreSQL and Blob LRS', () => {
    const input = minimal();
    input.infrastructure = {
      cloud_preference: 'azure',
      data_residency: 'india',
    };
    input.requirements = { file_media_storage: true };
    const result = recommend(input);
    expect(result.stack!.hosting.id).toBe('ase-india');
    expect(result.primary_region).toBe('centralindia');
    expect(result.database_region).toBe('centralindia');
    expect(
      result.stack!.supporting!.some((c) => c.service_id === 'azure-blob'),
    ).toBe(true);
    const compute = result.cost_breakdown.find(
      (l) => l.id === 'application-compute',
    )!;
    expect(compute.unit_rate_usd).toEqual({ min: 0.395, max: 0.395 });
    expect(compute.quantity.min % 730).toBe(0);
    expect(compute.source_ids).toContain('azure-ase-retail');
  });
  it('retains the scoped SKU region even when the input has no country constraint', () => {
    const input = minimal();
    input.infrastructure = {
      cloud_preference: 'azure',
      data_residency: 'none',
    };
    const catalog = structuredClone(defaultCatalog);
    catalog.entries = catalog.entries.filter(
      (e) => e.layer !== 'hosting' || e.id === 'ase-india',
    );
    const result = recommend(input, { catalog });
    expect(result.primary_region).toBe('centralindia');
    expect(result.database_region).toBe('centralindia');
    const bad = structuredClone(catalog);
    bad.entries.find((e) => e.id === 'ase-india')!.fixed_region =
      'unreviewed-region';
    expect(() => recommend(input, { catalog: bad })).toThrow(/Fixed region/);
  });
  it('does not transfer the new evidence to shared App Service or an unreviewed EU variant', () => {
    const input = minimal();
    input.infrastructure = { cloud_preference: 'azure', data_residency: 'eu' };
    expect(recommend(input).stack).toBeNull();
    const shared = defaultCatalog.entries.find((e) => e.id === 'appservice')!;
    expect(shared.regions).toEqual([]);
    expect(planCore(input).status).toBe('blocked');
  });
});

describe('complete alternatives and cost sensitivity', () => {
  it('exposes a selected-first, ordered and independently feasible set of whole plans', () => {
    const input = raw(2),
      result = recommend(input);
    expect(result.plan_comparison).toHaveLength(3);
    const s = normalizeScenario(input).normalized_input!,
      f = deriveFeatures(s);
    const plans = searchCorePlans(defaultCatalog, s, f).ranked;
    for (const comparison of result.plan_comparison) {
      const plan = plans.find((p) => p.plan.id === comparison.plan_id)!.plan;
      const support = selectSupporting(plan, s, f, defaultPolicies);
      expect(support.blockers).toEqual([]);
      const price = estimateCost(plan, s, support, defaultPolicies);
      expect(comparison.monthly_usd).toEqual({
        min: price.min,
        max: price.max,
      });
      expect(comparison.core).toEqual(
        Object.fromEntries(
          ['frontend', 'backend', 'database', 'hosting'].map((layer) => [
            layer,
            (plan as any)[layer].name,
          ]),
        ),
      );
      expect(comparison.retained_constraints.join(' ')).toContain(
        'Critical warnings explicitly identify',
      );
    }
    expect(result.plan_comparison[0]!.selected).toBe(true);
    expect(result.plan_comparison[0]!.plan_id).toBe(
      result.decision_trace.selected_plan_id,
    );
    expect(
      result.plan_comparison
        .slice(1)
        .every((p) => !p.selected && p.score_delta <= 0),
    ).toBe(true);
  });
  it('reconciles groups exactly and isolates payment activity', () => {
    const result = recommend(raw(2));
    const cents = (key: 'min' | 'max') =>
      result.cost_groups
        .filter((g) => g.category === 'infrastructure_and_operations')
        .reduce((n, g) => n + Math.round(g[key] * 100), 0);
    expect(cents('min')).toBe(
      Math.round(result.estimated_monthly_cost_usd.min * 100),
    );
    expect(cents('max')).toBe(
      Math.round(result.estimated_monthly_cost_usd.max * 100),
    );
    expect(
      result.cost_groups.find(
        (g) => g.category === 'payment_and_message_activity',
      )!.line_ids,
    ).toEqual(['payment-variable', 'payment-fixed']);
  });
  it('matches an independent direct fee calculation for a changed usage input', () => {
    const input = raw(2);
    input.extensions = {
      monthly_payment_transactions: 100,
      average_payment_value_usd: 10,
    };
    const result = recommend(input),
      entry = result.cost_sensitivity.find(
        (s) => s.field === 'extensions.monthly_payment_transactions',
      )!;
    expect(entry.baseline_origin).toBe('supplied');
    const high = entry.samples.find((s) => s.value === 200)!;
    const fraction = defaultPolicies.pricing.payment_fraction!.max,
      fixed = defaultPolicies.pricing.payment_fixed!.max;
    expect(high.upper_delta_usd).toBe((200 - 100) * (10 * fraction + fixed));
    expect(entry.scope).toBe('selected_plan_fixed_no_reranking');
    expect(input.extensions.monthly_payment_transactions).toBe(100);
  });
  it('exposes assumed usage and preserves a zero supplied value', () => {
    const input = raw(2);
    input.extensions = { monthly_payment_transactions: 0 };
    const result = recommend(input);
    const count = result.cost_sensitivity.find((s) =>
      s.field.endsWith('monthly_payment_transactions'),
    )!;
    expect(count.baseline_value).toBe(0);
    expect(count.baseline_origin).toBe('supplied');
    expect(
      result.cost_sensitivity.find((s) =>
        s.field.endsWith('monthly_egress_gb'),
      )!.baseline_origin,
    ).toBe('assumed');
  });
  it('never fabricates sensitivity or alternatives for unusable inputs', () => {
    for (const input of [
      {},
      {
        ...minimal(),
        infrastructure: { deployment_model: 'air_gapped' },
        requirements: { payments: true },
      },
    ]) {
      const result = recommend(input);
      expect(result.plan_comparison).toEqual([]);
      expect(result.cost_sensitivity).toEqual([]);
      expect(result.cost_groups).toEqual([]);
    }
  });
  it('is deterministic under reordered service/catalog registers', () => {
    const catalog = structuredClone(defaultCatalog),
      policies = structuredClone(defaultPolicies);
    catalog.entries.reverse();
    policies.services.reverse();
    policies.sources.reverse();
    expect(serialize(recommend(raw(4), { catalog, policies }))).toBe(
      serialize(recommend(raw(4))),
    );
  });
  it.each(['groups', 'selected', 'delta', 'sample', 'checklist'])(
    'rejects inconsistent %s output metadata',
    (kind) => {
      const result = recommend(kind === 'checklist' ? raw(1) : raw(2));
      if (kind === 'groups') result.cost_groups[0]!.max += 1;
      if (kind === 'selected') result.plan_comparison[0]!.selected = false;
      if (kind === 'delta') result.plan_comparison[1]!.score_delta = 999;
      if (kind === 'sample') result.cost_sensitivity[0]!.samples[0]!.min = null;
      if (kind === 'checklist')
        result.review_actions[0]!.evidence_required = [] as any;
      expect(validateOutput(result).length).toBeGreaterThan(0);
    },
  );
});
