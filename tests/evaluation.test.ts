import { it, expect, describe } from 'vitest';
import { readFileSync } from 'node:fs';
import { recommend } from '../packages/engine/src/index.js';
import { defaultCatalog } from '../packages/catalog/src/index.js';
import { defaultPolicies } from '../packages/catalog/src/services.js';
import { validateOutput, serialize } from '../packages/contracts/src/index.js';
const cases = JSON.parse(
  readFileSync(new URL('../evaluation/cases.json', import.meta.url), 'utf8'),
);
describe('Phase 5 author-designed unseen-style cases', () => {
  it.each(cases.map((item: any) => [`${item.id}: ${item.category}`, item]))(
    '%s meets explicit behavioral invariants',
    (_, item) => {
      const before = structuredClone(item.scenario);
      const r = recommend(item.scenario);
      const e = item.expect;
      expect(validateOutput(r)).toEqual([]);
      expect(r.status).toBe(e.status);
      expect(item.scenario).toEqual(before);
      for (const code of e.warnings ?? [])
        expect(r.warnings.map((w) => w.code)).toContain(code);
      for (const path of e.errors ?? [])
        expect(r.validation_errors.map((error) => error.field)).toContain(path);
      if (e.style) expect(r.architecture_style).toBe(e.style);
      if (e.region) {
        expect(r.primary_region).toBe(e.region);
        expect(r.database_region).toBe(e.region);
      }
      if (e.host) expect(r.stack!.hosting.id).toBe(e.host);
      if (e.no_external)
        expect(
          r.stack!.supporting!.some(
            (service) =>
              service.placement === 'external' ||
              service.service_id === 'actions' ||
              service.layer === 'cdn',
          ),
        ).toBe(false);
      for (const layer of e.none_layers ?? [])
        expect((r.stack as any)[layer].choice).toBe('None');
      for (const id of e.services ?? [])
        expect(
          r.stack!.supporting!.map((service) => service.service_id),
        ).toContain(id);
      for (const capability of e.capabilities ?? [])
        expect(
          r.stack!.supporting!.flatMap(
            (service) => service.capabilities as string[],
          ),
        ).toContain(capability);
      if (e.driver) expect(r.stack!.backend.driven_by).toContain(e.driver);
      if (r.stack)
        expect(
          r.warnings.some((w) => w.severity === 'critical')
            ? r.assumptions.join(' ').includes('Reduced scope of assurance')
            : true,
        ).toBe(true);
      else expect(r.estimate_status).toBe('not_estimated');
    },
  );
  it('detects both known EOL products without mislabeling maintained successors', () => {
    const raw = structuredClone(cases[8].scenario);
    expect(
      recommend(raw).warnings.filter((w) => w.code === 'EXISTING_TECH_EOL'),
    ).toHaveLength(2);
    raw.infrastructure.existing_systems = [
      'Python 3.12 service',
      'Angular application',
      'SQL Server 2019',
    ];
    expect(
      recommend(raw).warnings.some((w) => w.code === 'EXISTING_TECH_EOL'),
    ).toBe(false);
  });
  it('retains lifecycle warnings when other evidence prevents a plan', () => {
    const raw = structuredClone(cases[8].scenario);
    raw.infrastructure.cloud_preference = 'azure';
    raw.infrastructure.data_residency = 'eu';
    const r = recommend(raw);
    expect(r.status).toBe('infeasible');
    expect(r.warnings.some((w) => w.code === 'EXISTING_TECH_EOL')).toBe(true);
  });
  it('does not weaken residency just because preferences favor a blocked product', () => {
    const raw = structuredClone(cases[9].scenario);
    raw.infrastructure.cloud_preference = 'azure';
    raw.infrastructure.data_residency = 'eu';
    raw.priorities = { cost: 1, security: 5, maintainability: 5 };
    expect(recommend(raw).status).toBe('infeasible');
  });
  it('keeps usable unseen results unchanged under identifier and set-order mutations', () => {
    for (const item of cases.filter((item: any) =>
      item.expect.status.startsWith('ok'),
    )) {
      const base = recommend(item.scenario);
      const input = structuredClone(item.scenario);
      input.scenario_id = 'new-id';
      input.project.name = 'Unrelated name';
      input.project.platforms.reverse();
      input.team.languages.reverse();
      const result = recommend(input);
      expect(serialize(result.stack)).toBe(serialize(base.stack));
      expect(result.estimated_monthly_cost_usd).toEqual(
        base.estimated_monthly_cost_usd,
      );
    }
  });
  it('never selects an inactive core entry even when it would otherwise rank first', () => {
    const raw = structuredClone(cases[3].scenario);
    const original = recommend(raw);
    const catalog = structuredClone(defaultCatalog);
    catalog.entries.find(
      (entry) => entry.id === original.stack!.frontend.id,
    )!.status = 'retired';
    const result = recommend(raw, { catalog });
    expect(result.stack!.frontend.id).not.toBe(original.stack!.frontend.id);
  });
  it('validates lifecycle source references and patterns as internal policy data', () => {
    const policies = structuredClone(defaultPolicies);
    policies.lifecycle[0]!.source_ids = ['not-reviewed'];
    expect(() => recommend(cases[8].scenario, { policies })).toThrow(/source/i);
  });
});
