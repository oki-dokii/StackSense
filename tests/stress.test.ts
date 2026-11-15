import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { recommend } from '../packages/engine/src/index.js';
import { defaultCatalog } from '../packages/catalog/src/index.js';
import { serialize, validateOutput } from '../packages/contracts/src/index.js';
const cases = JSON.parse(
  readFileSync(
    new URL('../fixtures/stress-cases.json', import.meta.url),
    'utf8',
  ),
);
const entry = (id: string) => defaultCatalog.entries.find((e) => e.id === id)!;
const selected = (r: ReturnType<typeof recommend>) =>
  r.decision_trace.selected_plan_id!.split('|');
describe('varied project briefs: 15 concrete project types', () => {
  it.each(cases.map((c: any) => [c.id, c]))(
    '%s preserves required capabilities and declared constraints',
    (_, c) => {
      const before = serialize(c.scenario),
        r = recommend(c.scenario);
      expect(validateOutput(r)).toEqual([]);
      expect(serialize(c.scenario)).toBe(before);
      if (!c.expect.usable) {
        expect(r.status).toBe('infeasible');
        expect(r.stack).toBeNull();
        expect(
          r.warnings.some((w) =>
            (c.expect.blocker_codes ?? ['ML_DEPLOYMENT_COVERAGE_GAP']).includes(
              w.code,
            ),
          ),
        ).toBe(true);
        return;
      }
      expect(r.stack).not.toBeNull();
      const [, frontend, backend, database, host] = selected(r);
      if (c.expect.provider)
        expect(entry(host!).provider).toBe(c.expect.provider);
      if (
        c.scenario.project.platforms.length === 1 &&
        c.scenario.project.platforms[0] === 'api_only'
      )
        expect(frontend).toBe('frontend-none');
      else
        for (const target of c.scenario.project.platforms)
          expect(entry(frontend!).platforms).toContain(target);
      if (c.expect.persistent) expect(database).not.toBe('database-none');
      if (backend !== 'backend-none')
        expect(
          entry(backend!).languages.some((l) =>
            c.scenario.team.languages.includes(l),
          ),
        ).toBe(true);
      if (c.expect.critical_code)
        expect(
          r.warnings.some(
            (w) =>
              w.code === c.expect.critical_code && w.severity === 'critical',
          ),
        ).toBe(true);
      expect(['static', 'modular_monolith']).toContain(r.architecture_style);
      if (
        r.estimated_monthly_cost_usd.min > c.scenario.budget.monthly_infra_usd
      )
        expect(r.warnings.some((w) => w.code === 'BUDGET_EXCEEDED')).toBe(true);
      if (c.scenario.requirements.full_text_search)
        expect(r.stack!.supporting!.some((s) => s.layer === 'search')).toBe(
          true,
        );
    },
  );
  it.each(['python', 'go', 'java', 'kotlin', 'csharp', 'php', 'javascript'])(
    'keeps a %s-only API team in its known server language',
    (language) => {
      const input = structuredClone(cases[29].scenario);
      input.team.languages = [language];
      input.infrastructure.cloud_preference = 'any';
      const r = recommend(input);
      expect(r.stack).not.toBeNull();
      expect(entry(selected(r)[2]!).languages).toContain(language);
    },
  );
  it.each(['aws', 'azure', 'gcp'])(
    'honors %s for an otherwise identical API',
    (provider) => {
      const input = structuredClone(cases[29].scenario);
      input.infrastructure.cloud_preference = provider;
      const r = recommend(input);
      expect(r.stack).not.toBeNull();
      expect(entry(selected(r)[4]!).provider).toBe(provider);
    },
  );
  it.each(['us', 'eu'])(
    'supports AWS PostgreSQL primary placement in %s',
    (region) => {
      const input = structuredClone(cases[7].scenario);
      input.infrastructure.data_residency = region;
      const r = recommend(input);
      expect(r.stack).not.toBeNull();
      expect(r.primary_region).toBe(
        region === 'us' ? 'us-east-1' : 'eu-west-1',
      );
      expect(r.database_region).toBe(r.primary_region);
      expect(
        r.warnings.some(
          (w) =>
            w.code === 'EXTERNAL_RESIDENCY_UNVERIFIED' &&
            w.severity === 'critical',
        ),
      ).toBe(true);
    },
  );
  it('prefers the web-only client over an otherwise tied extra native bundle', () => {
    const r = recommend(cases[6].scenario);
    expect(selected(r)[1]).toBe('next');
    expect(r.stack!.frontend.choice).not.toContain('Native');
  });
  it('is independent of project names, identifiers and set order', () => {
    for (const c of cases) {
      const input = structuredClone(c.scenario),
        baseline = recommend(input);
      input.scenario_id = 'renamed';
      input.project.name = 'Different name';
      input.project.platforms.reverse();
      input.team.languages.reverse();
      const changed = recommend(input);
      expect(changed.decision_trace.selected_plan_id).toBe(
        baseline.decision_trace.selected_plan_id,
      );
      expect(changed.estimated_monthly_cost_usd).toEqual(
        baseline.estimated_monthly_cost_usd,
      );
    }
  });
  it.each([false, true])(
    'handles the other extension type with search=%s',
    (search) => {
      const input = structuredClone(cases[29].scenario);
      input.project.type = 'other';
      input.requirements.full_text_search = search;
      const r = recommend(input);
      expect(r.stack).not.toBeNull();
      expect(selected(r)[3] === 'database-none').toBe(!search);
    },
  );
});
