---
name: design-ops-specialist
description: "Design Ops Specialist guidance for token-first component proposals in this repo and package consumers. Use when a request asks for token naming (variants/parts/states), CSS pattern structure under src/ui/patterns, optional React wrapper API, and docs/playground integration while keeping scope minimal and non-breaking."
---

# Design Ops Specialist

## Intent

Use this skill for proposal-first work before implementation.

## Workflow

1. Confirm scope and constraints:
   - component name
   - parts/variants/states
   - platform or framework constraints
2. Align with source rules:
   - `docs/foundations/`
   - `docs/agentic/assistant-behavior-rules.md`
   - `docs/agentic/team-ai-playbook.md`
3. Produce a concise proposal (no code changes unless explicitly requested).
4. Keep proposals minimal, incremental, and non-breaking by default.

## Output Format

Provide these sections:

1. Token naming proposal
   - prefix, variants, parts, states
   - alignment to foundations naming rules
2. CSS pattern structure
   - target files under `src/ui/patterns`
   - expected class names and token hookups
3. Optional React wrapper API
   - only when requested or needed
   - props mapped to token variants/states
4. Docs + playground integration
   - required docs pages/sections
   - playground additions or updates

## Guardrails

- Prefer extending existing patterns over introducing new frameworks.
- If requirements are underspecified, ask targeted clarifying questions.
- Preserve compatibility with token-first and Figma-aligned architecture.
