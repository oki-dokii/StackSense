export type Layer = 'frontend' | 'backend' | 'database' | 'hosting';
export type Runtime =
  'none' | 'node' | 'python' | 'jvm' | 'dotnet' | 'go' | 'php';
export type Deployment =
  'managed_cloud' | 'self_hosted_cloud_vm' | 'on_premise' | 'air_gapped';
export type Provider =
  | 'none'
  | 'aws'
  | 'gcp'
  | 'azure'
  | 'cloudflare'
  | 'vercel'
  | 'fly'
  | 'digitalocean';
export interface Source {
  id: string;
  title: string;
  url: string;
  checked_on: string;
  scope: string;
}
export interface Region {
  residency: 'india' | 'eu' | 'us';
  region: string;
  source_ids: string[];
}
export interface ManagedDatabase {
  database_id: string;
  choice: string;
  source_ids: string[];
  regions: Region[];
}
export interface Entry {
  id: string;
  name: string;
  layer: Layer;
  status: 'active' | 'retired' | 'unknown';
  source_ids: string[];
  review_scope: string;
  languages: string[];
  complexity: number;
  operations: number;
  cost_class: number;
  strengths: string[];
  tradeoffs: string[];
  platforms?: string[];
  rendering?: 'none' | 'static' | 'ssr' | 'spa' | 'native';
  runtime?: Runtime;
  databases?: string[];
  model?: 'none' | 'relational' | 'document' | 'embedded';
  self_hosted?: boolean;
  provider?: Provider;
  deployments?: Deployment[];
  runtimes?: Runtime[];
  static_assets?: boolean;
  persistent_volume?: boolean;
  managed_databases?: ManagedDatabase[];
  regions?: Region[];
  fixed_region?: string;
  default_residency?: Region['residency'];
  upstream_database_id?: string;
  service_bundle?: 'supabase_pro' | 'neon_launch';
}
export interface Catalog {
  version: string;
  reviewed_on: string;
  sources: Source[];
  entries: Entry[];
}
