import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { recommend } from '../packages/engine/src/index.js';
import { defaultCatalog } from '../packages/catalog/src/index.js';
const pub = JSON.parse(readFileSync(new URL('../fixtures/public/scenarios.json', import.meta.url), 'utf8'));
const restricted = (alter: (catalog: typeof defaultCatalog) => void) => {
  const catalog = structuredClone(defaultCatalog);
  alter(catalog);
  return { catalog };
};
const usOnly = () => restricted((c) => {
  c.entries = c.entries.filter((e) => e.layer !== 'hosting' || e.id === 'fly');
  for (const host of c.entries.filter((e) => e.layer === 'hosting')) {
    host.regions = host.regions?.filter((r) => r.residency !== 'eu');
    for (const db of host.managed_databases ?? []) db.regions = db.regions.filter((r) => r.residency !== 'eu');
  }
});
describe('GDPR placement preference and explicit cross-border conditions', () => {
  it('places unchanged BoardRoom-style GDPR input in reviewed EU compute and database regions', () => {
    const input = structuredClone(pub[2]);
    input.scenario_id = 'renamed'; input.project.name = 'Unrelated title';
    const before = structuredClone(input), r = recommend(input);
    expect(input).toEqual(before);
    expect(r.primary_region).toBe('fra');
    expect(r.database_region).toBe('eu-central-1');
    expect(r.decision_trace.selected_plan_id).toContain('|fly|fra');
    expect(r.warnings).toContainEqual(expect.objectContaining({code:'GDPR_DATA_FLOW_REVIEW', severity:'critical'}));
    expect(r.warnings.some((w) => w.code === 'GDPR_CROSS_BORDER_REVIEW')).toBe(false);
  });
  it('keeps the non-GDPR version in its original default region and cost band', () => {
    const input = structuredClone(pub[2]); input.compliance = input.compliance.filter((x: string) => x !== 'gdpr');
    const r = recommend(input);
    expect(r.primary_region).toBe('iad'); expect(r.database_region).toBe('us-east-1');
    expect(r.estimated_monthly_cost_usd.min).toBe(291.9);
    expect(r.estimated_monthly_cost_usd.max).toBe(501.56);
    expect(r.warnings.some((w) => w.code.startsWith('GDPR_'))).toBe(false);
  });
  it('retains a feasible non-EU fallback with critical DPA and EU-US transfer requirements', () => {
    const r = recommend(pub[2], usOnly());
    expect(r.stack).not.toBeNull(); expect(r.status).toBe('ok_with_warnings');
    expect(r.primary_region).toBe('iad');
    const warning = r.warnings.find((w) => w.code === 'GDPR_CROSS_BORDER_REVIEW')!;
    expect(warning.severity).toBe('critical');
    expect(warning.message).toMatch(/DPAs/); expect(warning.message).toMatch(/EU-US/); expect(warning.message).toMatch(/SCCs/);
    expect(r.review_actions.find((a) => a.code === warning.code)).toBeDefined();
  });
  it('does not discard the fallback when EU compute exists but its managed DB has no EU mapping', () => {
    const ctx = usOnly(), host = ctx.catalog.entries.find((e) => e.id === 'fly')!;
    const original = defaultCatalog.entries.find((e) => e.id === 'fly')!;
    host.regions = structuredClone(original.regions);
    const r = recommend(pub[2], ctx);
    expect(r.stack).not.toBeNull(); expect(r.primary_region).toBe('iad');
    expect(r.warnings.some((w) => w.code === 'GDPR_CROSS_BORDER_REVIEW')).toBe(true);
  });
  it('preserves explicit US residency and provider rather than silently moving it', () => {
    const input = structuredClone(pub[2]); input.infrastructure.data_residency = 'us'; input.infrastructure.cloud_preference = 'aws';
    const r = recommend(input);
    expect(r.stack).not.toBeNull(); expect(r.primary_region).toBe('us-east-1');
    expect(r.warnings.some((w) => w.code === 'GDPR_CROSS_BORDER_REVIEW' && w.severity === 'critical')).toBe(true);
  });
  it('prefers reviewed EU complete plans even when a non-EU alternative is cheaper', () => {
    const input = structuredClone(pub[2]); input.infrastructure.cloud_preference = 'azure'; input.budget.monthly_infra_usd = 10000;
    const ctx = restricted((c) => {
      // Preserve original source-backed mappings, expose GCP + Azure only.
      c.entries = c.entries.filter((e) => e.layer !== 'hosting' || ['cloudrun','appservice-india'].includes(e.id));
    });
    input.infrastructure.cloud_preference = 'any';
    const r = recommend(input, ctx);
    expect(r.primary_region).toBe('europe-west1'); expect(r.database_region).toBe('europe-west1');
  });
  it.each([0,1,3,4,5])('leaves non-GDPR public case %s architecture and cost unchanged', (index) => {
    const s = pub[index], r = recommend(s);
    const baseline = JSON.parse(readFileSync(new URL(`../outputs/${s.scenario_id}_output.json`, import.meta.url), 'utf8'));
    for (const field of ['primary_region','database_region','estimated_monthly_cost_usd','warnings'] as const) expect(r[field]).toEqual(baseline[field]);
    expect(r.decision_trace.selected_plan_id).toBe(baseline.decision_trace.selected_plan_id);
  });
});
