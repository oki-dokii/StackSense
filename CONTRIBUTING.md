# Development guidance

This challenge submission is individual. This file describes change discipline for the repository owner and permitted coding assistance; it is not an invitation to multi-member collaboration.

1. Read docs/README.md and the SRS before changing contracts.
2. Use focused commits; keep generated public outputs tied to engine/catalog versions.
3. Add/revise a source-backed rule and meaningful test for changed behavior.
4. Update traceability, ADRs, references and AI assistance record when relevant.
5. Run `python3 scripts/check_docs.py` and schema mode where available; later run implemented type/build/test commands.
6. Never commit secrets, installed dependencies, fake screenshots or hard-coded scenario answers.

Branch prefix for implementation: `codex/` by default. The initial documentation may initialize the empty repository's main branch. Avoid rewriting history or force-pushing. The repository owner chooses licensing; no license is inferred by this starter.
