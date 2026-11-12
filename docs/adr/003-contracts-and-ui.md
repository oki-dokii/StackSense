# ADR-003: Contracts first and a lightweight web adapter

Date: 2026-11-13 · Status: proposed baseline

Context: exact standard JSON field names are required; UI is flexible; all fields need validation.

Decision: root draft-07 JSON schemas are authoritative. Use Ajv validation without coercion and generate TS types during implementation. React/Vite supplies a responsive form/result workspace; Fastify exposes a local API; CLI remains a full judging path. Pin verified versions in the future lockfile.

Alternatives: hand-maintained duplicated TS/UI/API types drift; a CLI-only product is acceptable but less convenient for screenshots and interactive review; an SSR application framework has no specific SEO requirement for this local tool.

Consequences: schemas run before application code exists; semantic invariants need separate engine checks. Form labels can be friendly while stored values remain exact enums. Additional fields must not break standard-only scenario files.
