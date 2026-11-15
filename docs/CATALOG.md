# Catalog scope

Current core catalog **0.6.0**: 43 entries, 75 scoped source records. There are 12 frontend, 10 backend, 9 database and 12 host entries (including explicit None and deployment variants). Service policy records and literature are separate; these are not unique-vendor counts. Exact records live in `packages/catalog/data/`.

New bounded variants: NestJS/TypeORM and Express reviewed driver edges; Supabase Pro and Neon Launch PostgreSQL lineage; Vercel regional functions and Fly regional Machines. Managed PostgreSQL variants share reviewed PostgreSQL driver/search/RLS semantics but cannot be silently self-hosted as a managed product. Each host/database regional edge is checked separately; `bom1` application compute is not an AWS database-region string.

Supabase supports a specific Mumbai project mapping. Fly and Neon have only reviewed US/EU mappings here. Vercel Pro is modeled with paid deploying seats, one team usage credit, and current on-demand CPU/memory/invocation/CDN/transfer/build meters. No legacy free Pro transfer allowances or commercial Hobby allowance is assumed. Supabase allowances and compute credit are applied once; file backup and SMS are additional.

Known limits: no Vercel persistent Yjs/ML/private existing SQL profile; no Supabase Pro HIPAA or explicit month-based DB retention profile; no Neon file-storage bundle. Plan capacity, contractual availability, logs/control-plane/CDN/subprocessor residency remain critically qualified. Full source review is not a compliance certification or workload benchmark.

See [cost model](COST_MODEL.md), [acceptability rubric](ARCHITECTURAL_ACCEPTABILITY.md), [input map](INPUT_DECISION_MAP.md) and [phase history](PHASES.md). Firebase, Render, Netlify, Workers/D1 and other absent products remain research candidates until runtime, service, geography and price edges are reviewed; omission is not technical impossibility.

Release 0.9.0 adds separate Central India Basic B1 Linux and DigitalOcean App Platform profiles. B1 is a qualified standard-service alternative, not ASE assurance. DigitalOcean dynamic Bangalore and regional Spaces maps are reviewed separately; fixed USD10 1GiB plans cannot horizontally scale, while USD12 1GiB plans can. A charged worker packs outbox/telemetry and one Spaces archive subscription, with explicit alpha exporter and recovery conditions. See REMAINING_GAPS.md and the retained official Azure tariff record.
