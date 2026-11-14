import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  assertCatalog,
  defaultCatalog,
  type Catalog,
  type Layer,
} from '../packages/catalog/src/index.js';
import {
  normalizeScenario,
  serialize,
} from '../packages/contracts/src/index.js';
import {
  planCore,
  deriveFeatures,
  searchCorePlans,
  candidateRejection,
  compatiblePlan,
  rankPlan,
  compareRanked,
  assertCoreReport,
  SearchLimitError,
} from '../packages/engine/src/index.js';
import type { RankedPlan } from '../packages/engine/src/index.js';
const fixture = (name: string) =>
  JSON.parse(
    readFileSync(
      fileURLToPath(new URL(`../fixtures/${name}.json`, import.meta.url)),
      'utf8',
    ),
  );
const minimal = () => fixture('minimal');
const publicCases = fixture('public/scenarios') as any[];
const ids = (report: ReturnType<typeof planCore>) =>
  report.core_stack && Object.values(report.core_stack).map((item) => item.id);
function entry(id: string) {
  return defaultCatalog.entries.find((item) => item.id === id)!;
}

describe('source-backed catalog integrity', () => {
  it('validates the shipped catalog with unique sources and supported layers', () => {
    expect(() => assertCatalog(defaultCatalog)).not.toThrow();
    expect(defaultCatalog.entries.length).toBe(35);
    expect(defaultCatalog.sources.length).toBe(49);
    expect(Object.isFrozen(defaultCatalog.entries[0])).toBe(true);
  });
  it.each(['missing-source', 'duplicate-id', 'bad-edge', 'missing-field'])(
    'rejects corrupt %s catalog as an internal error',
    (kind) => {
      const catalog = structuredClone(defaultCatalog);
      if (kind === 'missing-source')
        catalog.entries[0]!.source_ids = ['not-found'];
      if (kind === 'duplicate-id')
        catalog.entries[1]!.id = catalog.entries[0]!.id;
      if (kind === 'bad-edge')
        catalog.entries.find((item) => item.layer === 'backend')!.databases = [
          'not-found',
        ];
      if (kind === 'missing-field')
        delete (catalog.entries[0] as any).review_scope;
      expect(() => planCore(minimal(), { catalog })).toThrow(
        /catalog|source|compatibility/i,
      );
    },
  );
});

describe('actual core planning', () => {
  it.each(publicCases.map((value) => [value.scenario_id, value]))(
    'returns an honest schema-valid development report for %s',
    (_, value) => {
      const report = planCore(value);
      expect(() => assertCoreReport(report)).not.toThrow();
      expect(report.scope).toBe('core_layers_only');
      if (value.compliance.length) {
        expect(report.status).toBe('blocked');
        expect(report.core_stack).toBeNull();
        expect(
          report.warnings.some(
            (warning) =>
              warning.code === 'COMPLIANCE_EVIDENCE_PENDING' &&
              warning.severity === 'critical',
          ),
        ).toBe(true);
      } else expect(report.status).toBe('core_plan');
      expect(report).not.toHaveProperty('estimated_monthly_cost_usd');
    },
  );
  it('chooses a static Markdown plan with no unnecessary server/database', () => {
    const report = planCore(publicCases[0]);
    expect(report.architecture_style).toBe('static');
    expect(report.core_stack!.frontend.id).toBe('astro');
    expect(report.core_stack!.backend.id).toBe('backend-none');
    expect(report.core_stack!.database.id).toBe('database-none');
    expect(
      report.features.some(
        (feature) => feature.id === 'markdown' && feature.value === true,
      ),
    ).toBe(true);
  });
  it('supports a stateless API with no frontend or database', () => {
    const value = minimal();
    value.project = { type: 'api_platform', platforms: ['api_only'] };
    value.team.languages = ['go'];
    const report = planCore(value);
    expect(report.status).toBe('core_plan');
    expect(report.core_stack!.frontend.id).toBe('frontend-none');
    expect(report.core_stack!.database.id).toBe('database-none');
    expect(report.core_stack!.backend.id).toBe('go-http');
  });
  it.each([
    ['python', ['django', 'fastapi']],
    ['typescript', ['fastify']],
    ['java', ['spring']],
    ['csharp', ['aspnet']],
    ['go', ['go-http']],
    ['php', ['laravel']],
  ])(
    'weighs %s team familiarity in whole-plan ranking',
    (language, options) => {
      const value = minimal();
      value.team.languages = [language];
      expect(options).toContain(planCore(value).core_stack!.backend.id);
    },
  );
  it('never mutates caller input and scores from visible integer contributions', () => {
    const input = minimal();
    const original = structuredClone(input);
    const report = planCore(input);
    expect(input).toEqual(original);
    expect(report.score_breakdown).toHaveLength(6);
    expect(report.score).toBe(
      report.score_breakdown.reduce(
        (sum, part) => sum + part.fit * part.weight,
        0,
      ),
    );
    for (const component of Object.values(report.core_stack!)) {
      expect(component.source_ids.length).toBeGreaterThan(0);
      expect(component.alternatives.length).toBeGreaterThan(0);
      expect(component.tradeoffs.length).toBeGreaterThan(0);
    }
  });
  it('reports invalid input without selection or invented defaults', () => {
    const report = planCore({});
    expect(report.status).toBe('invalid_input');
    expect(report.trace.explored_assignments).toBe(0);
    expect(report.assumptions).toEqual([]);
    expect(() => assertCoreReport(report)).not.toThrow();
  });
  it('neutral security fit cannot silently satisfy compliance', () => {
    const value = minimal();
    value.compliance = ['hipaa'];
    const report = planCore(value);
    expect(report.status).toBe('blocked');
    expect(report.feasible_core_plans).toBeGreaterThan(0);
    expect(report.core_stack).toBeNull();
  });
});

describe('hard deployment and compatibility constraints', () => {
  it.each(['aws', 'azure', 'gcp'])(
    'respects explicit %s cloud preference',
    (provider) => {
      const value = minimal();
      value.infrastructure = { cloud_preference: provider };
      const report = planCore(value);
      expect(report.status).toBe('core_plan');
      expect(entry(report.core_stack!.hosting.id).provider).toBe(provider);
    },
  );
  it('uses independently reviewed primary compute and database regions', () => {
    const value = minimal();
    value.infrastructure = { cloud_preference: 'gcp', data_residency: 'india' };
    const report = planCore(value);
    expect(report.status).toBe('core_plan');
    expect(report.primary_region).toBe('asia-south1');
    expect(report.database_region).toBe('asia-south1');
    expect(report.core_stack!.database.id).toBe('pg');
    expect(
      report.pending_requirements.some(
        (item) =>
          item.field === 'infrastructure.data_residency' &&
          item.reason.includes('backups'),
      ),
    ).toBe(true);
  });
  it.each(['azure'])(
    'blocks unreviewed %s EU claims rather than generalizing India evidence',
    (provider) => {
      const value = minimal();
      value.infrastructure = {
        cloud_preference: provider,
        data_residency: 'eu',
      };
      const report = planCore(value);
      expect(report.status).toBe('blocked');
      expect(
        report.trace.rejections.some(
          (item) => item.code === 'REGION_EVIDENCE_GAP',
        ),
      ).toBe(true);
    },
  );
  it.each(['on_premise', 'air_gapped'])(
    'selects a local host for %s without silently adding a cloud dependency',
    (deployment) => {
      const value = minimal();
      value.infrastructure = {
        cloud_preference: 'none',
        deployment_model: deployment,
      };
      const report = planCore(value);
      expect(report.status).toBe('core_plan');
      expect(report.core_stack!.hosting.id).toBe('local');
      expect(report.database_deployment).toContain('Self-hosted');
    },
  );
  it('does not assume the country of an on-premise server', () => {
    const value = minimal();
    value.infrastructure = {
      deployment_model: 'on_premise',
      data_residency: 'india',
    };
    expect(planCore(value).status).toBe('blocked');
  });
  it('blocks contradictory no-cloud/managed-cloud constraints', () => {
    const value = minimal();
    value.infrastructure = {
      cloud_preference: 'none',
      deployment_model: 'managed_cloud',
    };
    expect(planCore(value).status).toBe('blocked');
  });
  it('does not put an embedded database on ephemeral managed application storage', () => {
    const value = normalizeScenario(minimal()).normalized_input!;
    const result = compatiblePlan(
      entry('react'),
      entry('django'),
      entry('sqlite'),
      entry('cloudrun'),
      'modular_monolith',
      value,
    );
    expect(result.plan).toBeNull();
    expect(result.reason).toContain('separately managed');
  });
  it('rejects a backend/database pair with no reviewed driver edge', () => {
    const value = normalizeScenario(minimal()).normalized_input!;
    expect(
      compatiblePlan(
        entry('react'),
        entry('django'),
        entry('mongo'),
        entry('ec2'),
        'modular_monolith',
        value,
      ).plan,
    ).toBeNull();
  });
  it('requires an actual crawlable rendering variant when SEO is critical', () => {
    const value = minimal();
    value.requirements = { seo_critical: true };
    value.project.platforms = ['web', 'android'];
    const report = planCore(value);
    expect(report.status).toBe('core_plan');
    expect(report.core_stack!.frontend.id).toBe('next-native');
    expect(
      report.trace.rejections.some(
        (item) =>
          item.candidate_id === 'flutter' && item.code === 'SEO_RENDERING_GAP',
      ),
    ).toBe(true);
  });
  it('does not select retired or unknown catalog products', () => {
    for (const status of ['retired', 'unknown'] as const) {
      const catalog = structuredClone(defaultCatalog);
      catalog.entries.find((item) => item.id === 'astro')!.status = status;
      expect(
        planCore(publicCases[0], { catalog }).core_stack!.frontend.id,
      ).not.toBe('astro');
    }
  });
});

describe('description hints with explicit limits', () => {
  it('detects affirmative ledger/low-memory hints with provenance and neutralizes supported negations', () => {
    for (const description of [
      'No ledger is needed.',
      'No double-entry ledger is needed.',
    ]) {
      const value = minimal();
      value.project.description = description;
      const report = planCore(value);
      expect(report.features.some((item) => item.id === 'ledger')).toBe(false);
    }
    const value = minimal();
    value.project.description =
      'No analytics, but a double-entry ledger and low-end Android phones with 2 GB RAM.';
    const report = planCore(value);
    expect(
      report.features.some(
        (item) => item.id === 'ledger' && item.value === true,
      ),
    ).toBe(true);
    expect(
      report.features.some(
        (item) => item.id === 'low_memory' && item.value === true,
      ),
    ).toBe(true);
    expect(
      report.assumptions.some((item) => item.includes('double-entry')),
    ).toBe(true);
    expect(report.core_stack!.database.id).not.toBe('mongo');
  });
  it('does not override structured realtime=false with a whiteboard keyword', () => {
    const value = minimal();
    value.project.description = 'Collaborative editing with live cursors.';
    value.requirements = { realtime: false };
    const report = planCore(value);
    expect(
      report.warnings.some((item) => item.code === 'DESCRIPTION_CONFLICT'),
    ).toBe(true);
    expect(
      report.features.find((item) => item.id === 'collaboration_hint')!.value,
    ).toBe(false);
  });
});

describe('determinism, search and metamorphic relations', () => {
  it('keeps core selection independent of name, ID and metadata', () => {
    const original = minimal();
    const renamed = structuredClone(original);
    renamed.scenario_id = 'not-a-public-ID';
    renamed.project.name = 'A very different name';
    const a = planCore(original),
      b = planCore(renamed);
    expect(ids(a)).toEqual(ids(b));
    expect(a.score).toBe(b.score);
  });
  it('produces identical canonical output after input key and catalog ordering changes', () => {
    const input = minimal();
    input.team.languages = ['python', 'typescript'];
    const reverse = (value: any): any =>
      Array.isArray(value)
        ? value.map(reverse)
        : value && typeof value === 'object'
          ? Object.fromEntries(
              Object.entries(value)
                .reverse()
                .map(([key, item]) => [key, reverse(item)]),
            )
          : value;
    const changed = reverse(input);
    changed.team.languages.reverse();
    const catalog = structuredClone(defaultCatalog);
    catalog.entries.reverse();
    catalog.sources.reverse();
    expect(serialize(planCore(input))).toBe(
      serialize(planCore(changed, { catalog })),
    );
  });
  it('adding an ineligible candidate cannot change the chosen core plan', () => {
    const catalog = structuredClone(defaultCatalog);
    const retired = structuredClone(entry('react'));
    retired.id = 'aaa-retired';
    retired.status = 'retired';
    catalog.entries.push(retired);
    expect(ids(planCore(minimal(), { catalog }))).toEqual(
      ids(planCore(minimal())),
    );
  });
  it('explicit defaults preserve selection while assumption provenance changes', () => {
    const original = minimal();
    const explicit = normalizeScenario(original).normalized_input;
    expect(ids(planCore(original))).toEqual(ids(planCore(explicit)));
    expect(planCore(original).assumptions).not.toEqual(
      planCore(explicit).assumptions,
    );
  });
  it('tightened provider constraints only remove previously eligible plans', () => {
    const broad = normalizeScenario(minimal()).normalized_input!;
    const strict = structuredClone(broad);
    strict.infrastructure.cloud_preference = 'gcp';
    const a = searchCorePlans(defaultCatalog, broad, deriveFeatures(broad)),
      b = searchCorePlans(defaultCatalog, strict, deriveFeatures(strict));
    const ids = new Set(a.ranked.map((item) => item.plan.id));
    expect(b.ranked.length).toBeGreaterThan(0);
    expect(b.ranked.every((item) => ids.has(item.plan.id))).toBe(true);
  });
  it('a search bound raises an internal error, never false infeasibility', () => {
    expect(() => planCore(minimal(), { maxAssignments: 1 })).toThrow(
      SearchLimitError,
    );
    expect(() => planCore(minimal(), { maxAssignments: 0 })).toThrow(
      /positive safe integer/,
    );
  });
  it('matches exhaustive Cartesian enumeration on a small independently ordered catalog', () => {
    const catalog: Catalog = structuredClone(defaultCatalog);
    const keep = new Set([
      'react',
      'vue',
      'fastify',
      'django',
      'pg',
      'sqlite',
      'ec2',
      'local',
    ]);
    catalog.entries = catalog.entries.filter((item) => keep.has(item.id));
    for (const item of catalog.entries)
      if (item.databases)
        item.databases = item.databases.filter((id) => keep.has(id));
    assertCatalog(catalog);
    const raw = minimal();
    raw.infrastructure = {
      deployment_model: 'self_hosted_cloud_vm',
      cloud_preference: 'aws',
    };
    const scenario = normalizeScenario(raw).normalized_input!;
    const features = deriveFeatures(scenario);
    const values = Object.fromEntries(
      (['frontend', 'backend', 'database', 'hosting'] as Layer[]).map(
        (layer) => [
          layer,
          catalog.entries.filter(
            (item) =>
              item.layer === layer &&
              !candidateRejection(item, scenario, features, 'modular_monolith'),
          ),
        ],
      ),
    ) as Record<Layer, typeof catalog.entries>;
    const brute: RankedPlan[] = [];
    for (const f of values.frontend)
      for (const b of values.backend)
        for (const d of values.database)
          for (const h of values.hosting) {
            const result = compatiblePlan(
              f,
              b,
              d,
              h,
              'modular_monolith',
              scenario,
            );
            if (result.plan)
              brute.push(rankPlan(result.plan, scenario, features));
          }
    brute.sort(compareRanked);
    const actual = searchCorePlans(catalog, scenario, features);
    expect(actual.ranked.map((item) => item.plan.id)).toEqual(
      brute.map((item) => item.plan.id),
    );
    expect(actual.ranked.length).toBeGreaterThan(0);
  });
});

describe('restricted deployment conflict visibility', () => {
  it.each([{ payments: true }, { auth: 'phone_otp' }, { auth: 'social' }])(
    'withholds an air-gapped plan with an external identity/payment flow %j',
    (requirements) => {
      const value = minimal();
      value.infrastructure = {
        deployment_model: 'air_gapped',
        cloud_preference: 'none',
      };
      value.requirements = requirements;
      const report = planCore(value);
      expect(report.status).toBe('blocked');
      expect(
        report.warnings.some(
          (item) => item.code === 'AIR_GAP_EXTERNAL_REQUIREMENT',
        ),
      ).toBe(true);
    },
  );
});
