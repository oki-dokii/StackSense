import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeScenario, serialize, validateScenarioText, validateInput, validateOutput, parseJson, MAX_INPUT_BYTES } from '../packages/contracts/src/index.js';
const fixture = (name: string) => JSON.parse(readFileSync(fileURLToPath(new URL(`../fixtures/${name}.json`, import.meta.url)), 'utf8'));
const minimal = () => fixture('minimal');
const scenarios = fixture('public/scenarios') as Record<string, any>[];

describe('standard input contracts', () => {
  it.each(scenarios.map(value => [value.scenario_id, value]))('accepts public input %s without mutating it', (_, value) => {
    const before = structuredClone(value);
    const report = normalizeScenario(value);
    expect(report.status).toBe('valid');
    expect(report.validation_errors).toEqual([]);
    expect(value).toEqual(before);
  });
  it.each([
    ['project', 'type'], ['project', 'platforms'], ['scale', 'users_at_launch'], ['scale', 'users_12_months'],
    ['team', 'size'], ['team', 'experience'], ['team', 'languages'], ['budget', 'monthly_infra_usd'], ['timeline', 'mvp_weeks'],
  ])('reports missing %s.%s at its own path', (group, field) => {
    const value = minimal(); delete value[group][field];
    const report = normalizeScenario(value);
    expect(report.status).toBe('invalid_input');
    expect(report.normalized_input).toBeNull();
    expect(report.validation_errors.some(issue => issue.field === `${group}.${field}`)).toBe(true);
  });
  it('collects independent field errors and never coerces types', () => {
    const value = minimal(); value.team.size = '2'; value.budget.monthly_infra_usd = -1; value.priorities = { cost: 6 }; value.project.type = 'unknown';
    const report = normalizeScenario(value);
    expect(report.validation_errors.map(error => error.field)).toEqual(expect.arrayContaining(['team.size','budget.monthly_infra_usd','priorities.cost','project.type']));
    expect(value.team.size).toBe('2');
  });
  it('accepts empty languages, zero users/budget and explicit nullable p95', () => {
    const value = minimal(); value.requirements = { p95_latency_ms: null };
    expect(normalizeScenario(value).status).toBe('valid');
  });
  it.each([0, -1, '100', 1.5])('rejects invalid p95 %s', (latency) => {
    const value = minimal(); value.requirements = { p95_latency_ms: latency };
    expect(validateInput(value).some(issue => issue.field === 'requirements.p95_latency_ms')).toBe(true);
  });
  it('requires string availability and nonempty platforms', () => {
    const value = minimal(); value.requirements = { availability: 99.9 }; value.project.platforms = [];
    expect(validateInput(value).map(issue => issue.field)).toEqual(expect.arrayContaining(['project.platforms','requirements.availability']));
  });
});

describe('normalization with provenance', () => {
  it('expands optional defaults and keeps unknown capacity distinct from zero', () => {
    const report = normalizeScenario(minimal()); const result = report.normalized_input!;
    expect(result.scale.traffic_pattern).toBe('steady');
    expect(result.scale.workload).toBe('balanced');
    expect(result.scale).not.toHaveProperty('peak_concurrent_users');
    expect(result.scale).not.toHaveProperty('data_volume_gb_12_months');
    expect(result.team.has_devops).toBe(false);
    expect(result.infrastructure).toMatchObject({ cloud_preference:'any', deployment_model:'managed_cloud', data_residency:'none', existing_systems:[] });
    expect(result.requirements).toMatchObject({ realtime:false, offline_support:false, auth:'none', ml_features:'none', availability:'99.9', p95_latency_ms:null });
    expect(result.priorities.cost).toBe(3);
    expect(report.assumptions.some(item => item.includes('scale.peak_concurrent_users') && item.includes('unknown'))).toBe(true);
    expect(report.assumptions.some(item => item.includes('requirements.realtime'))).toBe(true);
    expect(validateInput(result)).toEqual([]);
  });
  it('never overrides supplied false, zero, null, empty lists or nondefault values', () => {
    const value = minimal(); value.team.has_devops = false; value.scale.peak_concurrent_users = 0;
    value.requirements = { p95_latency_ms:null, offline_support:true }; value.priorities = { cost:5 };
    const report = normalizeScenario(value);
    expect(report.normalized_input!.scale.peak_concurrent_users).toBe(0);
    expect(report.normalized_input!.requirements.offline_support).toBe(true);
    expect(report.normalized_input!.priorities.cost).toBe(5);
    expect(report.assumptions.some(item => item.startsWith('team.has_devops'))).toBe(false);
  });
  it('retains unknown fields and emits path-specific warnings', () => {
    const value = minimal(); value.infrastructure = { mystery: { custom: true } }; value.custom = 'kept';
    const report = normalizeScenario(value);
    expect(report.normalized_input!.custom).toBe('kept');
    expect(report.normalized_input!.infrastructure.mystery).toEqual({custom:true});
    expect(report.warnings.filter(item => item.code === 'UNKNOWN_INPUT').map(item => item.fields[0])).toEqual(['custom','infrastructure.mystery']);
  });
  it('does not silently claim that optional extensions affect recommendations yet', () => {
    const value=minimal(); value.extensions={monthly_egress_gb:12, unfamiliar:true};
    const report=normalizeScenario(value);
    expect(report.warnings.map(item=>item.code)).toEqual(['EXTENSION_NOT_APPLIED','UNKNOWN_INPUT']);
  });
  it('sorts set-like lists and records deduplication', () => {
    const value=minimal(); value.team.languages=['python','javascript','python'];
    const report=normalizeScenario(value);
    expect(report.normalized_input!.team.languages).toEqual(['javascript','python']);
    expect(report.assumptions.some(item => item.includes('duplicate'))).toBe(true);
  });
  it('is repeatable and independent of object key and set-list order', () => {
    const value=scenarios[1]!;
    const reorder = (item: any): any => Array.isArray(item) ? item.map(reorder) : item && typeof item==='object' ? Object.fromEntries(Object.entries(item).reverse().map(([key,v])=>[key,reorder(v)])) : item;
    const changed=reorder(value); changed.team.languages.reverse(); changed.project.platforms.reverse();
    expect(serialize(normalizeScenario(value))).toBe(serialize(normalizeScenario(changed)));
    expect(serialize(normalizeScenario(value))).toBe(serialize(normalizeScenario(value)));
  });
});

describe('bounded safe JSON', () => {
  it('returns stable root errors for malformed, oversized and nonfinite JSON', () => {
    expect(validateScenarioText('{').validation_errors[0]!.field).toBe('$');
    expect(parseJson(' '.repeat(MAX_INPUT_BYTES+1)).errors[0]!.message).toContain('2 MiB');
    const value=minimal(); value.scale.users_at_launch=Infinity;
    expect(validateInput(value).some(error=>error.message.includes('finite'))).toBe(true);
    expect(validateScenarioText(JSON.stringify(minimal()).replace('"users_at_launch":0','"users_at_launch":1e400')).status).toBe('invalid_input');
  });
  it('rejects prototype keys and never pollutes object prototypes', () => {
    const text=JSON.stringify(minimal()).replace('"project":', '"__proto__":{"polluted":true},"project":');
    expect(validateScenarioText(text).validation_errors[0]!.field).toBe('__proto__');
    expect(({} as any).polluted).toBeUndefined();
  });
  it('bounds nested extensions and handles programmatic cycles without crashing', () => {
    const value=minimal(); let current:any={}; value.extensions=current;
    for(let index=0;index<40;index++){current.child={};current=current.child;}
    expect(validateInput(value).some(error=>error.message.includes('nesting'))).toBe(true);
    const cycle=minimal(); cycle.custom=cycle;
    expect(validateInput(cycle).some(error=>error.message.includes('Circular'))).toBe(true);
  });
});

describe('output contract protection', () => {
  const empty = () => ({ status:'invalid_input', summary:'Invalid scenario.', architecture_style:'other', stack:null, estimated_monthly_cost_usd:{min:0,max:0,assumptions:['No stack selected; not an estimate.']}, warnings:[], assumptions:[], validation_errors:[{field:'project.type',message:'Missing.'}] });
  it('validates the invalid-input shape and rejects inconsistent status/stack fields', () => {
    expect(validateOutput(empty())).toEqual([]);
    const value:any=empty();value.validation_errors=[];
    expect(validateOutput(value).length).toBeGreaterThan(0);
  });
  it('adds the semantic cost min/max invariant beyond JSON Schema', () => {
    const value=empty();value.estimated_monthly_cost_usd.min=10;
    expect(validateOutput(value)).toEqual([{field:'estimated_monthly_cost_usd',message:'min must not exceed max.'}]);
  });
});
