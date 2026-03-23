---
name: design-system-architect
description: "Strategic design-system architecture for this repo. Use when reviewing or evolving foundations, deciding token governance, evaluating component boundaries, reconciling Figma/code drift, auditing semantic coverage, or making architecture-level decisions that span beyond a single component proposal. Prefer this skill over design-ops-specialist when the request is system-wide, governance-heavy, or about whether something should enter the system at all."
---

# Design System Architect

## Intent

Use this skill for system-level decisions, reviews, and governance.

This skill is broader than `design-ops-specialist`.

- Use `design-ops-specialist` for tactical, proposal-first component drafts.
- Use `design-system-architect` for architecture, boundaries, token governance, and Figma/code alignment decisions.

## Required source alignment

Before responding, align to these repo sources:

- `docs/foundations/`
- `docs/agentic/assistant-behavior-rules.md`
- `docs/agentic/team-ai-playbook.md`

At minimum, check these when relevant:

- `docs/foundations/foundation-001-token-layering.md`
- `docs/foundations/foundation-002-naming-and-grouping.md`
- `docs/foundations/foundation-003-color-semantics-and-status.md`
- `docs/foundations/foundation-009-component-boundaries-and-utility.md`
- `docs/foundations/foundation-010-implementation-and-pipeline-workflow.md`
- `docs/foundations/foundation-011-branching-and-release-governance.md`

## Task types

### 1. Foundation review

Use when reviewing the health of the system.

Check for:

- layering integrity
- semantic gaps
- naming drift
- duplicate concepts
- hard-coded or leaky component decisions
- weak state coverage
- Figma/code mismatch

### 2. Token governance

Use when deciding whether to create, alias, rename, or reject token changes.

Report:

- correct layer
- rationale
- consumer scope
- theme/mode impact
- migration implications

### 3. Boundary decision

Use before proposing or implementing a new component.

Decide:

- composition inside an existing family, or
- standalone system component

Apply the Snowflake check from `foundation-009`.

### 4. Figma/code reconciliation

Use when system contracts drift between Figma and implementation.

Review:

- token exports in `figma/exports/`
- Code Connect mappings in `figma/connections/`
- implementation in `src/ui/` and `src/react/`
- docs/playground representation in `site/components/`

### 5. System handoff

Use when another designer or engineer needs a structured architectural recommendation.

## Output format

Provide these sections when relevant:

1. Task type
2. Current system reading
3. Decision
4. Rationale
5. Repo surfaces affected
6. Risks / mismatches
7. Recommended next step

## Guardrails

- Do not invent raw values inside components.
- Keep the 4-layer architecture intact.
- Treat token work and component boundary decisions as separate questions.
- Prefer small, reviewable changes and feature-branch delivery.
- Say explicitly when something should remain local instead of entering the system.
