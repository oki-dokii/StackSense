import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  analyzeDecision,
  assertDecisionLab,
  dominates,
  type LabPlan,
} from '../packages/engine/src/decision-lab.js';
import { recommend } from '../packages/engine/src/index.js';
import {
  normalizeScenario,
  serialize,
} from '../packages/contracts/src/index.js';
import { defaultCatalog } from '../packages/catalog/src/index.js';
import { defaultPolicies } from '../packages/catalog/src/services.js';
import { createServer } from '../apps/api/src/server.js';
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

describe('bounded decision analysis', () => {
  it('preserves the exact original result and caller input while covering every single-axis weight', () => {
    const input = raw(2),
      before = structuredClone(input),
      r = analyzeDecision(input);
    expect(r.baseline).toEqual(recommend(before));
    expect(input).toEqual(before);
    expect(r.input_sha256).toBe(
      createHash('sha256').update(serialize(input)).digest('hex'),
    );
    expect(r.engine_evaluations).toBe(25);
    expect(r.priority_analysis.tested_settings).toBe(25);
    for (const key of Object.keys(
      normalizeScenario(input).normalized_input!.priorities,
    )) {
      const trials = r.priority_analysis.trials.filter(
        (t) => t.criterion === key,
      );
      expect(trials).toHaveLength(4);
      expect(new Set(trials.map((t) => t.trial_weight)).size).toBe(4);
    }
    expect(r.priority_analysis.retained_winner_settings).toBe(
      1 + r.priority_analysis.trials.filter((t) => !t.changed_winner).length,
    );
  });
  it('agrees with an independent actual rerun for a changed weight', () => {
    const input = minimal(),
      r = analyzeDecision(input),
      trial = r.priority_analysis.trials[0]!;
    const weights = normalizeScenario(input).normalized_input!.priorities;
    input.priorities = { ...weights, [trial.criterion]: trial.trial_weight };
    expect(recommend(input).decision_trace.selected_plan_id).toBe(
      trial.selected_plan_id,
    );
  });
  it('includes all completed candidates instead of truncating the tradeoff space to three', () => {
    const r = analyzeDecision(raw(2)),
      p = r.priority_analysis;
    expect(p.evaluated_plans.length).toBe(
      r.baseline.decision_trace.complete_candidates,
    );
    expect(p.evaluated_plans.length).toBeGreaterThan(3);
    const weights = normalizeScenario(raw(2)).normalized_input!.priorities;
    for (const plan of p.evaluated_plans)
      expect(plan.original_priority_score).toBe(
        Object.entries(plan.fit).reduce(
          (sum, [k, v]) => sum + v * weights[k as keyof typeof weights],
          0,
        ),
      );
    const selected = p.evaluated_plans.find(
      (p) => p.plan_id === r.baseline.decision_trace.selected_plan_id,
    )!;
    expect(selected.monthly_usd).toEqual({
      min: r.baseline.estimated_monthly_cost_usd.min,
      max: r.baseline.estimated_monthly_cost_usd.max,
    });
  });
  it('uses strict dominance and retains distinct equal-objective plans', () => {
    const base = {
      monthly_usd: { min: 10, max: 20 },
      operated_components: 2,
      original_priority_score: 50,
    } as LabPlan;
    expect(dominates(base, base)).toBe(false);
    expect(dominates({ ...base, operated_components: 1 }, base)).toBe(true);
    expect(dominates({ ...base, monthly_usd: { min: 5, max: 30 } }, base)).toBe(
      false,
    );
    expect(dominates({ ...base, original_priority_score: 49 }, base)).toBe(
      false,
    );
    const r = analyzeDecision(raw(2));
    const points = r.priority_analysis.evaluated_plans;
    const expected = points
      .filter(
        (b) =>
          !points.some(
            (a) =>
              a.monthly_usd.max <= b.monthly_usd.max &&
              a.operated_components <= b.operated_components &&
              a.original_priority_score >= b.original_priority_score &&
              (a.monthly_usd.max < b.monthly_usd.max ||
                a.operated_components < b.operated_components ||
                a.original_priority_score > b.original_priority_score),
          ),
      )
      .map((p) => p.plan_id);
    expect(r.priority_analysis.frontier_plan_ids).toEqual(expected);
  });
  it('finds independent OTP/payment functional changes while retaining original India/compliance requirements', () => {
    const input = raw(1),
      before = structuredClone(input),
      r = analyzeDecision(input),
      f = r.functional_experiments;
    expect(r.baseline.status).toBe('infeasible');
    expect(input).toEqual(before);
    expect(f.smallest_successful_edit_count).toBe(2);
    expect(
      f.successful_variants.some(
        (t) =>
          t.edits
            .map((e) => e.field)
            .sort()
            .join(',') === 'requirements.auth,requirements.payments',
      ),
    ).toBe(true);
    for (const t of f.trials) {
      const modified = structuredClone(input);
      for (const edit of t.edits)
        modified.requirements[edit.field.split('.')[1]!] = edit.after;
      expect(modified.infrastructure).toEqual(input.infrastructure);
      expect(modified.compliance).toEqual(input.compliance);
      expect(recommend(modified).status).toBe(t.status);
    }
  });
  it('finds the bounded P6 phone alternative but never applies it', () => {
    const input = raw(5),
      r = analyzeDecision(input);
    expect(r.functional_experiments.smallest_successful_edit_count).toBe(1);
    expect(r.functional_experiments.successful_variants[0]!.edits).toEqual([
      {
        field: 'requirements.auth',
        before: 'phone_otp',
        after: 'email_password',
      },
    ]);
    expect(input.requirements.auth).toBe('phone_otp');
    expect(r.baseline.stack).toBeNull();
  });
  it('cannot bypass an existing Entra tenant blocker or waive compliance', () => {
    const r = analyzeDecision(raw(4));
    expect(r.baseline.status).toBe('infeasible');
    expect(r.functional_experiments.smallest_successful_edit_count).toBeNull();
    expect(
      r.functional_experiments.trials
        .flatMap((t) => t.edits)
        .some(
          (e) =>
            e.field.includes('infrastructure') ||
            e.field === 'compliance' ||
            e.field === 'requirements.auth',
        ),
    ).toBe(false);
    expect(r.engine_evaluations).toBeLessThanOrEqual(40);
  });
  it('does no speculative work or unsafe hashing for invalid/cyclic input', () => {
    const cyclic: any = {};
    cyclic.self = cyclic;
    for (const input of [{}, cyclic]) {
      const r = analyzeDecision(input);
      expect(r.engine_evaluations).toBe(1);
      expect(r.input_sha256).toBeNull();
      expect(r.priority_analysis.trials).toEqual([]);
      expect(r.functional_experiments.trials).toEqual([]);
    }
  });
  it('is deterministic under catalog/source/service order changes', () => {
    const catalog = structuredClone(defaultCatalog),
      policies = structuredClone(defaultPolicies);
    catalog.entries.reverse();
    policies.sources.reverse();
    policies.services.reverse();
    expect(serialize(analyzeDecision(raw(1), { catalog, policies }))).toBe(
      serialize(analyzeDecision(raw(1))),
    );
  });
  it('exposes detached analysis metadata without allowing a callback to corrupt recommendations', () => {
    const input = raw(2),
      before = recommend(input),
      after = recommend(input, {
        onCompletePlans: (plans) => {
          plans[0]!.core.frontend = 'tampered';
          plans[0]!.monthly_usd.min = 999;
          plans[0]!.fits[0]!.fit = 99;
        },
      });
    expect(after).toEqual(before);
  });
  it('exports a Proposed ADR with provenance, scoped references and escaped brief content', () => {
    const input = raw(2);
    input.project.description += ' <img src=x onerror=alert(1)> ## Accepted';
    const r = analyzeDecision(input);
    expect(r.adr_markdown).toContain('Status: Proposed');
    expect(r.adr_markdown).toContain(r.input_sha256!);
    expect(r.adr_markdown).not.toContain('<img');
    expect(r.adr_markdown).toContain('not confidence probabilities');
    expect(r.evidence.length).toBeGreaterThan(0);
    expect(new Set(r.evidence.map((s) => s.id)).size).toBe(r.evidence.length);
    expect(r.evidence.every((s) => s.url.startsWith('https://'))).toBe(true);
  });
  it('rejects malformed analysis metadata', () => {
    const r = analyzeDecision(raw(0));
    r.engine_evaluations = 1;
    expect(() => assertDecisionLab(r)).toThrow(/count mismatch/);
    (r as any).analysis_version = 'invented';
    expect(() => assertDecisionLab(r)).toThrow(/contract/);
  });
});

describe('Decision Lab adapters', () => {
  it('serves exact analysis over the local API and rejects batches', async () => {
    const app = createServer({ serveWeb: false });
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/analyze',
        payload: raw(5),
      });
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe(serialize(analyzeDecision(raw(5))));
      expect(response.headers['cache-control']).toBe('no-store');
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/analyze',
            payload: [raw(0)],
          })
        ).statusCode,
      ).toBe(400);
    } finally {
      await app.close();
    }
  });
  it('keeps origin restrictions on the analysis endpoint', async () => {
    const app = createServer({ serveWeb: false });
    try {
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/analyze',
            payload: raw(0),
            headers: { origin: 'https://attacker.invalid' },
          })
        ).statusCode,
      ).toBe(403);
    } finally {
      await app.close();
    }
  });
  it('exports JSON and ADR through the source CLI with original infeasible exit status', () => {
    const cli = fileURLToPath(
      new URL('../apps/cli/src/analyze.ts', import.meta.url),
    );
    const input = fileURLToPath(
      new URL('../fixtures/public/P6.json', import.meta.url),
    );
    const json = spawnSync(
      process.execPath,
      ['--import', 'tsx', cli, '--input', input],
      { encoding: 'utf8' },
    );
    expect(json.status).toBe(3);
    expect(JSON.parse(json.stdout).baseline.status).toBe('infeasible');
    const adr = spawnSync(
      process.execPath,
      ['--import', 'tsx', cli, '--input', input, '--format', 'adr'],
      { encoding: 'utf8' },
    );
    expect(adr.status).toBe(3);
    expect(adr.stdout).toContain('# Proposed architecture decision');
  });
});
