/* Generated from schemas/. Run npm run generate:types; do not edit by hand. */

/**
 * Requires nonempty alternatives, drivers and tradeoffs for all components; stricter than the minimum output table. Semantic rules (min<=max, critical warning, driver paths) are also required.
 */
export type Recommendation = {
  [k: string]: unknown;
} & {
  scenario_id?: string;
  engine_version?: string;
  catalog_version?: string;
  rules_version?: string;
  status: 'ok' | 'ok_with_warnings' | 'infeasible' | 'invalid_input';
  summary: string;
  architecture_style:
    | 'static'
    | 'monolith'
    | 'modular_monolith'
    | 'serverless'
    | 'service_oriented'
    | 'microservices'
    | 'hybrid'
    | 'other';
  stack: Stack | null;
  estimated_monthly_cost_usd: {
    min: number;
    max: number;
    assumptions: string[];
    [k: string]: unknown;
  };
  warnings: Warning[];
  assumptions: string[];
  validation_errors: {
    field: string;
    message: string;
    [k: string]: unknown;
  }[];
  review_actions?: ReviewAction[];
  integration_reviews?: IntegrationReview[];
  cost_groups?: CostGroup[];
  cost_sensitivity?: CostSensitivity[];
  plan_comparison?: PlanComparison[];
  [k: string]: unknown;
};

export interface Stack {
  frontend: Component;
  backend: Component;
  database: Component;
  hosting: Component;
  supporting?: (Component & {
    layer:
      | 'cache'
      | 'queue'
      | 'search'
      | 'auth'
      | 'storage'
      | 'cdn'
      | 'realtime'
      | 'payments'
      | 'ml'
      | 'ci_cd'
      | 'observability'
      | 'other';
    [k: string]: unknown;
  })[];
  [k: string]: unknown;
}
export interface Component {
  choice: string;
  justification: string;
  /**
   * @minItems 1
   */
  driven_by: [string, ...string[]];
  /**
   * @minItems 1
   */
  alternatives: [
    {
      choice: string;
      why_not: string;
      [k: string]: unknown;
    },
    ...{
      choice: string;
      why_not: string;
      [k: string]: unknown;
    }[]
  ];
  /**
   * @minItems 1
   */
  tradeoffs: [string, ...string[]];
  [k: string]: unknown;
}
export interface Warning {
  code: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  fields: string[];
  [k: string]: unknown;
}
export interface ReviewAction {
  id: string;
  code: string;
  kind: 'evidence_gap' | 'constraint_conflict' | 'model_limit';
  fields: string[];
  /**
   * @minItems 1
   */
  affected_components: [string, ...string[]];
  /**
   * @minItems 1
   */
  evidence_required: [string, ...string[]];
  next_action: string;
  resolution_gate: string;
  references: {
    id: string;
    title: string;
    url: string;
    checked_on: string;
    scope: string;
  }[];
}
export interface IntegrationReview {
  system: string;
  approach: 'federation_review' | 'database_reuse_review' | 'inventory_review';
  approval: 'pending_project_evidence';
  protocol: string;
  data_boundary: string;
  cost_treatment: string;
  /**
   * @minItems 1
   */
  tasks: [string, ...string[]];
  references: {
    id: string;
    title: string;
    url: string;
    checked_on: string;
    scope: string;
  }[];
}
export interface CostGroup {
  category: 'infrastructure_and_operations' | 'payment_and_message_activity';
  min: number;
  max: number;
  line_ids: string[];
}
export interface CostSensitivity {
  field: string;
  baseline_value: number;
  baseline_origin: 'supplied' | 'assumed';
  scope: 'selected_plan_fixed_no_reranking';
  samples: {
    value: number;
    status: 'estimated' | 'model_limit';
    min: number | null;
    max: number | null;
    upper_delta_usd: number | null;
  }[];
}
export interface PlanComparison {
  plan_id: string;
  selected: boolean;
  architecture_style: string;
  core: {
    frontend: string;
    backend: string;
    database: string;
    hosting: string;
  };
  supporting_services: string[];
  primary_region: string | null;
  database_region: string | null;
  score: number;
  score_delta: number;
  tied_on_score: boolean;
  monthly_usd: {
    min: number;
    max: number;
  };
  operated_components: number;
  budget_fit: 'within_upper' | 'range_risk' | 'over_budget';
  warning_codes: string[];
  cost_assumptions: string[];
  /**
   * @minItems 1
   */
  retained_constraints: [string, ...string[]];
}
