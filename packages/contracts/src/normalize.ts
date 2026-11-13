import { compare } from './canonical.js';
import { scenarioSchema } from './schemas.js';
import { validateInput, parseJson, sortIssues } from './validation.js';
import type { NormalizedScenario, ValidationIssue, ValidationReport, Warning } from './types.js';

type SchemaNode = { type?: string; properties?: Record<string, SchemaNode>; default?: unknown };
const rootSchema = scenarioSchema as SchemaNode;
const extraDefaults: Record<string, unknown> = {
  'project.name': '', 'project.description': '', 'infrastructure.existing_systems': [],
  'requirements.p95_latency_ms': null,
};
const optionalGroups = ['infrastructure', 'requirements', 'priorities'];
const setPaths = new Set(['project.platforms', 'team.languages', 'compliance', 'infrastructure.existing_systems']);
// Accepted as typed data; extra architectural influences are Phase 2+ work, never silently used.
const notYetUsed = new Set(Object.keys((rootSchema.properties?.extensions?.properties) ?? {}));

export function invalidReport(errors: ValidationIssue[]): ValidationReport {
  return { schema_version: '0.1.0', status: 'invalid_input', normalized_input: null, assumptions: [], warnings: [], validation_errors: sortIssues(errors) };
}
export function normalizeScenario(raw: unknown): ValidationReport {
  const errors = validateInput(raw);
  if (errors.length) return invalidReport(errors);
  const normalized = structuredClone(raw) as Record<string, unknown>;
  const assumptions: string[] = [];
  const warnings: Warning[] = [];
  for (const group of optionalGroups) {
    if (!(group in normalized)) {
      normalized[group] = {};
      assumptions.push(`${group} was absent; initialized the optional group before applying field defaults.`);
    }
  }
  function visit(data: Record<string, unknown>, schema: SchemaNode, prefix = ''): void {
    for (const key of Object.keys(schema.properties ?? {}).sort(compare)) {
      const node = schema.properties![key]!;
      const path = prefix ? `${prefix}.${key}` : key;
      if (!(key in data)) {
        const defaultValue = path in extraDefaults ? extraDefaults[path] : node.default;
        if (defaultValue !== undefined) {
          data[key] = structuredClone(defaultValue);
          assumptions.push(`${path} was absent; defaulted to ${JSON.stringify(defaultValue)}.`);
        } else if (['scale.peak_concurrent_users', 'scale.data_volume_gb_12_months'].includes(path)) {
          assumptions.push(`${path} was absent; remains unknown (not zero).`);
        }
      }
      if (setPaths.has(path) && Array.isArray(data[key])) {
        const original = data[key] as string[];
        const sorted = [...new Set(original)].sort(compare);
        if (sorted.length !== original.length) assumptions.push(`${path} contained duplicate values; deduplicated for set semantics.`);
        data[key] = sorted;
      }
      if (node.type === 'object' && data[key] && typeof data[key] === 'object') visit(data[key] as Record<string, unknown>, node, path);
    }
    for (const key of Object.keys(data).sort(compare)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (!Object.hasOwn(schema.properties ?? {}, key)) {
        warnings.push({ code: 'UNKNOWN_INPUT', severity: 'warning', message: `${path} is not a recognized field. Preserved without interpreting it.`, fields: [path] });
      } else if (prefix === 'extensions' && notYetUsed.has(key)) {
        warnings.push({ code: 'EXTENSION_NOT_APPLIED', severity: 'info', message: `${path} is structurally supported; its effect on architecture selection is not implemented yet.`, fields: [path] });
      }
    }
  }
  visit(normalized, rootSchema);
  return {
    schema_version: '0.1.0', status: 'valid', normalized_input: normalized as NormalizedScenario,
    assumptions: assumptions.sort(compare), warnings: warnings.sort((a, b) => compare(a.fields[0] ?? '', b.fields[0] ?? '') || compare(a.code, b.code)), validation_errors: [],
  };
}
export function validateScenarioText(text: string): ValidationReport {
  const parsed = parseJson(text);
  return parsed.errors.length ? invalidReport(parsed.errors) : normalizeScenario(parsed.value);
}
