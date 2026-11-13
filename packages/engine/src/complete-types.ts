import type { Component } from '../../contracts/src/recommendation.generated.js';
import type { Recommendation, Warning } from '../../contracts/src/index.js';
import type {
  Policies,
  ServiceProfile,
  SupportingLayer,
} from '../../catalog/src/services.js';
import type { Catalog } from '../../catalog/src/index.js';
import type { CorePlan, RankedPlan, PlanningContext } from './types.js';
export interface SupportingComponent extends Component {
  layer: SupportingLayer;
  service_id: string;
  capabilities: string[];
  placement: ServiceProfile['placement'];
  source_ids: string[];
  incremental_compute_units: number;
}
export interface DataFlow {
  component: string;
  location: string;
  scope: string;
  verification:
    | 'configuration_required'
    | 'external_scope_review'
    | 'source_only_no_production_data';
}
export interface SupportResult {
  components: SupportingComponent[];
  warnings: Warning[];
  blockers: Warning[];
  assumptions: string[];
  data_flows: DataFlow[];
}
export interface CostLine {
  id: string;
  category: string;
  quantity: { min: number; max: number };
  unit_rate_usd: { min: number; max: number };
  monthly_usd: { min: number; max: number };
  source_ids: string[];
  basis: string;
}
export interface CostEstimate {
  min: number;
  max: number;
  assumptions: string[];
  line_items: CostLine[];
  horizon: 'month_12';
  confidence: 'planning_band_not_quote';
}
export interface ControlPlan {
  frameworks: {
    id: string;
    source_ids: string[];
    technical_controls: string[];
    owner_actions: string[];
    verification: 'design_only_not_certified';
  }[];
  deployment_controls: string[];
  warnings: Warning[];
  blockers: Warning[];
}
export interface CompleteCandidate {
  ranked: RankedPlan;
  plan: CorePlan;
  support: SupportResult;
  cost: CostEstimate;
  control: ControlPlan;
  score: number;
  cost_fit: number;
  security_fit: number;
  operation_penalty: number;
}
export interface RecommendationContext extends PlanningContext {
  policies?: Policies;
}
export type FinalRecommendation = Recommendation & {
  engine_version: '0.5.0';
  catalog_version: string;
  rules_version: '0.5.0';
  services_version: string;
  estimate_status: 'estimated' | 'not_estimated';
  cost_breakdown: CostLine[];
  control_plan: Omit<ControlPlan, 'warnings' | 'blockers'> | null;
  data_flows: DataFlow[];
  decision_trace: {
    core_candidates: number;
    complete_candidates: number;
    selected_plan_id: string | null;
    score: number | null;
    rejected: { plan_id: string; codes: string[] }[];
  };
};
export class CostModelLimitError extends Error {}
