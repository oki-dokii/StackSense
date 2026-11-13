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
