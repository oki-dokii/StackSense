import type { Scenario } from './scenario.generated.js';
import type { Recommendation } from './recommendation.generated.js';
export type { Scenario, Recommendation };
export type ValidationIssue = Recommendation['validation_errors'][number];
export type Warning = Recommendation['warnings'][number];
export type NormalizedScenario = Scenario & {
  project: Scenario['project'] & { name: string; description: string };
  scale: Scenario['scale'] & { traffic_pattern: 'steady' | 'spiky' | 'seasonal'; workload: 'read_heavy' | 'balanced' | 'write_heavy' };
  team: Scenario['team'] & { has_devops: boolean };
  infrastructure: Required<NonNullable<Scenario['infrastructure']>>;
  requirements: Required<NonNullable<Scenario['requirements']>>;
  compliance: NonNullable<Scenario['compliance']>;
  priorities: Required<NonNullable<Scenario['priorities']>>;
};
export type ValidationReport = {
  schema_version: '0.1.0';
  status: 'valid' | 'invalid_input';
  normalized_input: NormalizedScenario | null;
  assumptions: string[];
  warnings: Warning[];
  validation_errors: ValidationIssue[];
};
