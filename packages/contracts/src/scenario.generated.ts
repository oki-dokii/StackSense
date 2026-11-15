/* Generated from schemas/. Run npm run generate:types; do not edit by hand. */

/**
 * Exact standard fields; additional properties preserved and warned by application. Defaults are annotations and must be applied with provenance by normalization, not silently by validator.
 */
export interface Scenario {
  scenario_id?: string;
  project: {
    name?: string;
    type:
      | 'content_site'
      | 'web_app'
      | 'saas_b2b'
      | 'ecommerce'
      | 'marketplace'
      | 'social'
      | 'realtime_collab'
      | 'fintech'
      | 'healthtech'
      | 'data_analytics'
      | 'iot'
      | 'ai_ml_product'
      | 'internal_tool'
      | 'gaming'
      | 'api_platform'
      | 'other';
    description?: string;
    /**
     * @minItems 1
     */
    platforms: [
      'web' | 'android' | 'ios' | 'desktop' | 'api_only',
      ...('web' | 'android' | 'ios' | 'desktop' | 'api_only')[]
    ];
    [k: string]: unknown;
  };
  scale: {
    users_at_launch: number;
    users_12_months: number;
    peak_concurrent_users?: number;
    traffic_pattern?: 'steady' | 'spiky' | 'seasonal';
    workload?: 'read_heavy' | 'balanced' | 'write_heavy';
    data_volume_gb_12_months?: number;
    [k: string]: unknown;
  };
  team: {
    size: number;
    experience: 'beginner' | 'intermediate' | 'senior' | 'mixed';
    languages: string[];
    has_devops?: boolean;
    [k: string]: unknown;
  };
  budget: {
    monthly_infra_usd: number;
    [k: string]: unknown;
  };
  timeline: {
    mvp_weeks: number;
    [k: string]: unknown;
  };
  infrastructure?: {
    cloud_preference?: 'any' | 'aws' | 'gcp' | 'azure' | 'none';
    deployment_model?: 'managed_cloud' | 'self_hosted_cloud_vm' | 'on_premise' | 'air_gapped';
    data_residency?: 'none' | 'india' | 'eu' | 'us' | 'other';
    existing_systems?: string[];
    [k: string]: unknown;
  };
  requirements?: {
    realtime?: boolean;
    offline_support?: boolean;
    full_text_search?: boolean;
    file_media_storage?: boolean;
    payments?: boolean;
    multi_tenant?: boolean;
    seo_critical?: boolean;
    auth?: 'none' | 'email_password' | 'social' | 'phone_otp' | 'enterprise_sso';
    ml_features?: 'none' | 'inference_api' | 'llm_rag' | 'training';
    availability?: '99' | '99.9' | '99.95' | '99.99';
    p95_latency_ms?: number | null;
    [k: string]: unknown;
  };
  compliance?: ('gdpr' | 'dpdp' | 'hipaa' | 'pci_dss' | 'rbi_localisation' | 'soc2' | 'iso27001')[];
  priorities?: {
    cost?: number;
    time_to_market?: number;
    scalability?: number;
    performance?: number;
    maintainability?: number;
    security?: number;
    [k: string]: unknown;
  };
  extensions?: {
    expected_requests_per_second?: number;
    primary_user_region?: string;
    retention_months?: number;
    monthly_egress_gb?: number;
    monthly_otp_count?: number;
    vendor_lock_in_tolerance?: 'low' | 'medium' | 'high';
    /**
     * Optional planning volume; not guaranteed transaction throughput.
     */
    monthly_payment_transactions?: number;
    /**
     * Optional average gross payment value in USD for variable fee estimates.
     */
    average_payment_value_usd?: number;
    /**
     * Authored default 0.2 of registered month-12 users active daily when RPS is absent; explicit RPS takes precedence. Not a measured traffic claim.
     */
    daily_active_user_fraction?: number;
    /**
     * Optional monthly vendor-billed realtime messages, including sender/recipient fan-out; not all HTTP requests. Applied only when the selected design uses metered Supabase Realtime.
     */
    monthly_realtime_messages?: number;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
