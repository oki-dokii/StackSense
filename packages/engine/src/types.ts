import type { Catalog, Entry, Layer } from '../../catalog/src/index.js';
import type {
  NormalizedScenario,
  ValidationIssue,
  Warning,
} from '../../contracts/src/index.js';
export type Style = 'static' | 'modular_monolith';
export type Criterion =
  | 'cost'
  | 'time_to_market'
  | 'scalability'
  | 'performance'
  | 'maintainability'
  | 'security';
export interface Feature {
  id: string;
  value: boolean | number;
  rule_id: string;
  driven_by: string[];
  reason: string;
}
export interface Features {
  staticEligible: boolean;
  databaseRequired: boolean;
  ledger: boolean;
  markdown: boolean;
  lowMemory: boolean;
  collaborative: boolean;
  evidence: Feature[];
  assumptions: string[];
  warnings: Warning[];
}
export interface Rejection {
  layer: Layer | 'plan';
  candidate_id: string;
  code: string;
  message: string;
  fields: string[];
}
export interface CorePlan {
  id: string;
  style: Style;
  frontend: Entry;
  backend: Entry;
  database: Entry;
  hosting: Entry;
  primary_region: string | null;
  database_deployment: string;
  database_region: string | null;
  database_existing?: boolean;
}
export interface ScorePart {
  criterion: Criterion;
  fit: number;
  weight: number;
  contribution: number;
  driven_by: string[];
  reason: string;
}
export interface RankedPlan {
  plan: CorePlan;
  score: number;
  breakdown: ScorePart[];
  operated_components: number;
}
export interface Selection {
  layer: Layer;
  id: string;
  choice: string;
  source_ids: string[];
  justification: string;
  driven_by: string[];
  alternatives: { choice: string; why_not: string }[];
  tradeoffs: string[];
}
export interface CorePlanningReport {
  schema_version: '0.2.0';
  engine_version: '0.2.0';
  catalog_version: string;
  rules_version: '0.2.0';
  scope: 'core_layers_only';
  status: 'core_plan' | 'blocked' | 'invalid_input';
  scenario_id?: string;
  summary: string;
  core_stack: Record<Layer, Selection> | null;
  architecture_style: Style | null;
  primary_region: string | null;
  database_deployment: string | null;
  database_region: string | null;
  score: number | null;
  score_breakdown: ScorePart[];
  feasible_core_plans: number;
  features: Feature[];
  pending_requirements: { field: string; reason: string }[];
  warnings: Warning[];
  assumptions: string[];
  validation_errors: ValidationIssue[];
  trace: {
    explored_assignments: number;
    rejections: Rejection[];
    shortlist: { id: string; score: number }[];
  };
}
export interface PlanningContext {
  catalog?: Catalog;
  maxAssignments?: number;
}
export interface Prepared {
  scenario: NormalizedScenario;
  features: Features;
}
export class SearchLimitError extends Error {}
