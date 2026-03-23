---
name: design-ops-specialist
description: "Tactical proposal-first guidance for token-first component work in this repo and package consumers. Use when a request asks for a minimal component draft, token naming proposal, CSS pattern structure under src/ui/patterns, optional React wrapper API, docs/playground integration, or a concrete implementation plan that should stay incremental and non-breaking. Prefer design-system-architect instead when the request is about foundations, token governance, component-boundary decisions, Figma/code drift, or system-wide architecture."
---

# Design Ops Specialist

## Intent

Use this skill for tactical, proposal-first work before or just ahead of implementation.

This skill is narrower than `design-system-architect`.

- Use `design-ops-specialist` for concrete component drafts and repo-shaped implementation proposals.
- Use `design-system-architect` for system-wide reviews, governance, and architecture decisions.

## Workflow

1. Confirm scope and constraints:
   - component name
   - parts / variants / states
   - platform or framework constraints
   - whether the ask is proposal-only or implementation-adjacent
2. Align with source rules:
   - `docs/foundations/`
   - `docs/agentic/assistant-behavior-rules.md`
   - `docs/agentic/team-ai-playbook.md`
3. If the request implies a new system component, call out that boundary validation is required and defer the strategic decision to `design-system-architect` when needed.
4. Produce a concise proposal by default, with no code changes unless explicitly requested.
5. Keep proposals minimal, incremental, and non-breaking.

## Output format

Provide these sections:

1. Boundary assumption
   - whether this is assumed to be composition or a valid standalone candidate
   - if unclear, say so briefly
2. Token naming proposal
   - prefix, variants, parts, states
   - alignment to foundations naming rules
3. CSS pattern structure
   - target files under `src/ui/patterns` or existing family integration
   - expected class names and token hookups
4. Optional React wrapper API
   - only when requested or clearly needed
   - props mapped to token variants/states
5. Docs + playground integration
   - required docs pages/sections
   - playground additions or updates
6. Implementation surface
   - exact repo paths likely to change

## Guardrails

- Prefer extending existing patterns over introducing new frameworks.
- Keep recommendations compatible with token-first and Figma-aligned architecture.
- Do not broaden into foundations governance unless explicitly asked.
- If requirements are underspecified, ask targeted clarifying questions or state minimal assumptions.
- If the task is really about whether something belongs in the system at all, hand off conceptually to `design-system-architect`.
