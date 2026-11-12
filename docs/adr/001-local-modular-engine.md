# ADR-001: Local modular engine

Date: 2026-11-13 · Status: proposed baseline

Context: judges need quick local setup and hidden-scenario import. UI and CLI must not disagree.

Decision: implement one pure TypeScript engine consumed by a local Fastify server and CLI; a React UI uses the local API. Store immutable catalog/rules as versioned files. Final local server serves built frontend and API from one origin.

Alternatives: browser-only engine simplifies serving but complicates CLI parity/packaging; separate Python engine adds a second runtime; distributed services add setup and network failure modes.

Consequences: one runtime and selection code path; clear test seams; no database dependency. API/CLI packaging and types still require build discipline. Revisit only if deployment or workload needs exceed this challenge.
