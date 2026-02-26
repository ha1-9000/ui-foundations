---
name: design-ops-manager
description: "Design Ops Manager guidance for token-first component setup in this repo. Use when a user asks for a proposal covering token naming (variants/parts/states), CSS pattern structure under src/ui/patterns, optional React wrapper API, and docs + playground integration, while keeping changes small and non-breaking."
---

# Design Ops Manager

## Workflow

- Confirm the component name and any constraints (size variants, states, parts, platforms).
- Review relevant repo rules before proposing changes:
  - `docs/agentic/team-ai-playbook.md`
  - `docs/agentic/assistant-behavior-rules.md`
  - `docs/foundations/` (all applicable foundations)
- Produce a proposal only (no code changes unless explicitly asked).
- Keep changes minimal, incremental, and non-breaking by default.

## Output format

Provide a concise proposal with the following sections:

1. Token naming proposal
- Include base token prefix, variants, parts, and states.
- Keep names aligned to existing naming conventions in `docs/foundations/`.

2. CSS pattern structure under `src/ui/patterns`
- Provide the folder/file layout.
- Note any required token hookups and expected class names.

3. Optional React wrapper API
- Include props and usage only if a wrapper is expected or requested.
- Keep the API aligned with token variants and states.

4. Docs + playground integration
- Specify doc additions/updates and any playground entries.
- Keep docs changes small and aligned with existing structure.

## Guardrails

- If component requirements are underspecified, ask targeted questions before finalizing.
- Prefer extending existing patterns over introducing new frameworks or dependencies.
- Keep suggestions compatible with the token-first and Figma-aligned approach.
