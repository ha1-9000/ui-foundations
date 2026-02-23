# AI Playbook

This playbook defines how to use AI as an engineering copilot in this repository.

## Goal

Use AI to speed up component incubation and implementation while keeping output:
- token-first
- reviewable in Git
- consistent with existing architecture

## Principles

1. Keep changes small and incremental.
2. Prefer existing patterns over introducing new abstractions.
3. Keep Figma and code aligned through explicit token roundtrips.
4. Always validate with local checks before pushing.

## Component Boundary Check (Mandatory)

Run this decision gate before implementing a "new component":

1. Start with composition-first:
   - If the new idea is primarily grouping, layout, or orchestration of existing components, implement it as composition within the existing component family and document it there.
2. Promote to standalone only when needed:
   - The candidate introduces distinct semantics (own role/responsibility), a stable API surface, or independent lifecycle/behavior that is not just a wrapper.
3. Apply a utility test ("Snowflake check"):
   - One-off/local case -> keep it local or document as composition.
   - Reusable across contexts/products -> valid candidate for system-level component.
4. Keep token work independent:
   - New tokens may be needed in both paths.
   - Token creation does not automatically justify a new standalone component.
5. Source of truth:
   - `docs/foundations/foundation-009-component-boundaries-and-utility.md`

## Standard Workflow: New Component

1. Run the Component Boundary Check and decide:
   - standalone component, or
   - composition inside existing component docs/API.
2. Ask AI for a first proposal:
   - structure: HTML/CSS/React
   - token names and states
   - docs + playground example
3. Review and adjust naming before implementation.
4. Add/import proposed tokens in Figma.
5. Export tokens from Figma to `figma/exports/`.
6. Let AI integrate implementation:
   - `src/ui/patterns/<component>.css`
   - `src/react/<component>.js` and `src/react/index.js` (if needed)
   - `site/components/<component>.md`
   - `site/components/<component>-playground.md`
   - `figma/connections/web-<component>.figma.ts` (if needed)
7. Run validation:
   - `npm run ci:check`
8. Iterate naming/states/a11y until stable.

## Standard Workflow: Token Roundtrip

1. Create or update tokens in Figma.
2. Export into `figma/exports/*.tokens.json`.
3. Run:
   - `npm run build:all`
   - `npm run tokens:validate`
4. Check output consistency:
   - `dist/tokens/css/*.tokens.css`
   - `dist/tokens/json/*.json`
   - `dist/tokens/tokens.yaml`
5. If warnings appear (missing/invalid WEB syntax, alias issues), fix in Figma first.

## Standard Workflow: Refactor and Quality

1. Ask AI to identify one small refactor target.
2. Implement only one focused change set.
3. Add or update tests when behavior is touched.
4. Run:
   - `npm run lint`
   - `npm run test:unit`
   - `npm run ci:check`
5. Commit with clear scope in message.

## Prompt Templates

### 1) New component incubation

```text
You are my Senior Staff Engineer. Propose a token-first setup for a new <component>.
Include:
- token naming proposal (variants/parts/states)
- CSS pattern structure under src/ui/patterns
- optional React wrapper API
- docs + playground integration
Keep changes minimal and aligned with existing repository conventions.
```

### 2) Token integration after Figma export

```text
I updated figma/exports. Please run the token/build pipeline, review warnings,
and apply minimal fixes so docs and bundles are green.
```

### 3) Safe refactor

```text
Refactor <target file/module> for maintainability in small steps only.
No behavior changes. Add tests if needed. Keep ci:check green.
```

## Definition of Done (AI Task)

- Scope is clear and minimal.
- Affected files are easy to review.
- No broken exports or docs.
- `npm run ci:check` passes.
- README/docs updated when behavior or workflow changes.

## Worked example: Button Group

This repository now includes a concrete walkthrough based on a `Button Group`:

1. AI proposal:
   - layout model (`orientation`, `attached`, `justify`)
   - token proposal (`--button-group-gap`, `--button-group-border-radius`)
2. Implementation in code:
   - integrated button family CSS: `src/ui/patterns/button.css`
   - React wrapper API in `src/react/button.js` (`ButtonGroup`)
3. Documentation:
   - integrated in `site/components/button.md` under grouped usage
4. Validation:
   - `npm run ci:check`

Use this pattern as the reference baseline for future AI-assisted component incubation where wrappers extend an existing component family.
