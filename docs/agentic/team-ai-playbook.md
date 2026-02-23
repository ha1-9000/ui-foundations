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

## Standard Workflow: New Component

1. Ask AI for a first proposal:
   - structure: HTML/CSS/React
   - token names and states
   - docs + playground example
2. Review and adjust naming before implementation.
3. Add/import proposed tokens in Figma.
4. Export tokens from Figma to `figma/exports/`.
5. Let AI integrate implementation:
   - `src/ui/patterns/<component>.css`
   - `src/react/<component>.js` and `src/react/index.js` (if needed)
   - `site/components/<component>.md`
   - `site/components/<component>-playground.md`
   - `figma/connections/web-<component>.figma.ts` (if needed)
6. Run validation:
   - `npm run ci:check`
7. Iterate naming/states/a11y until stable.

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
