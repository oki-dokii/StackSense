# ADR-008: Same-origin local API and schema-driven workspace

Date: 2026-11-13 · Status: implemented in Phase 4

Decision: use Fastify for a loopback-only API and static asset serving; React/Vite for the in-memory interface. Keep all selection and authoritative validation in the shared engine. Expose the existing schema and source metadata rather than maintaining a second form-field specification. Preserve extra imported fields while editing known fields.

Single and batch adapters return the same deterministic result objects as the CLI. Distinguish transport/usage errors from invalid scenarios and evidence-relative infeasibility. Never turn an internal failure into a domain recommendation. Protect the loopback service against foreign origins and DNS-rebinding Host headers; do not enable permissive CORS or send inputs to a third party.

The client retains the evaluated input snapshot for driver explanations. Every edit invalidates current-result export until a new evaluation completes. Unapplied JSON also disables evaluation/export; applying or cancelling is explicit. Routes retain in-memory state; there is no persistent storage, user login or server-side project database.

Consequences: `npm start` runs both adapters and UI on one origin after building. A complete checkout remains required because engine schemas/catalog/fixtures load locally. Reloading loses unsaved drafts. The app is intended for local use; deployment as a public multi-user service would require a separate design and review.
