# Domain Docs

This application uses a single shared domain context across `client/`, `server/`, and `networking/`.

## Before exploring, read these

- `GLOSSARY.md` at the repository root: read the domain vocabulary.
- `docs/adr/`: read ADRs relevant to the area you are about to work in.

If these files do not exist, proceed silently. Do not flag their absence or suggest creating them upfront. The `/domain-modeling` skill, reached via `/grill-with-docs` and `/improve-codebase-architecture`, creates them lazily when terms or decisions are resolved.

## Use the glossary's vocabulary

When output names a domain concept, including in issue titles, refactor proposals, hypotheses, and test names, use the term defined in `GLOSSARY.md`.

If a concept is missing, check whether it is invented terminology. Note real gaps for `/domain-modeling`.

## Flag ADR conflicts

If a proposal contradicts an existing ADR, identify that ADR and explain why the decision should be reconsidered rather than silently overriding it.
