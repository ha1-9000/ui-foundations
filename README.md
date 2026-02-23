# UI Foundations

This repository contains the **foundation layer** of our UI platform:

- Design tokens (core primitives, color modes, semantic roles)
- Component token APIs (variants, parts, properties, states)
- Foundational architecture rules for long-term consistency
- Docs/playground generated with Eleventy

## What this is

- A **token-first** foundation that aligns **Figma Variables** with **CSS custom properties**
- A **multi-brand** and **multi-mode** ready architecture
- A place to document foundational rules that must remain stable over time

## What this is not (yet)

- A full “product design system” with all patterns, usage guidelines, and governance
- Product-specific application rules (these live downstream in product repositories)

## Architecture (4 layers)

1. **Core (Primitives)**  
   Raw physical values: spacing, radii, borders, typography primitives, layout constants.

2. **Color Modes (Light/Dark)**  
   Theme palettes: brand colors, neutrals, overlays. No semantic meaning.

3. **Semantics (Roles)**  
   Meaning-based roles: `Color.Text.*`, `Color.Fill.*`, `Color.Border.*`, `Typography.*`, `Corner.*`.  
   Supports brand modes (e.g. TUI, ROBINSON, LTUR).

4. **Components (APIs)**  
   Component-level API rules: variants, parts, properties, states.  
   Components reference semantic roles—**never raw values**.

## Naming conventions

Component tokens use a **variant-first** grouping:

`Component.variant.part.property.state`

Example:

- `Button.solid.container.background.default`
- `Button.outline.container.border-color.hover`

Rules:

- **Typography never includes color** (color lives in `Color.Text.*`)
- **Components never introduce new colors** (they reference semantic roles)
- Layout primitives (breakpoints, container sizes, z-index) live in **Core**

## Repository structure

- `figma/exports/` — token source exports from Figma
- `dist/tokens/` — generated token artifacts (CSS/JSON/TS)
- `src/` — package source layers (Core/UI/React)
- `site/` — Eleventy preview/docs site (templates + docs-specific CSS)
- `docs/foundations/` — foundational architecture and token rules (source of truth)
- `docs/agentic/` — assistant behavior rules and AI collaboration playbooks
- `figma/` — Figma exports, mappings, Code Connect notes
- `AGENTS.md` — entrypoint for AI coding agents

Docs structure (`site/`):
- `_includes/layouts/` — shared Nunjucks layouts
- `tokens/*.md` — token docs pages (Eleventy collection)
- `components/*.md` — component docs pages (Eleventy collection)
- `assets/docs.css` — docs-only styling

AI collaboration:
- `AGENTS.md` — quick entrypoint and baseline checks for agents
- `docs/agentic/assistant-behavior-rules.md` — assistant-specific guardrails
- `docs/agentic/team-ai-playbook.md` — standard AI-assisted workflows for component incubation and token roundtrips

## Flow: Add a new component

```text
Figma
├─ 1) Create/update component tokens
│  └─ figma/exports/Component.tokens.json
├─ 2) (Optional) Add/update Code Connect mapping
│  └─ figma/connections/web-<component>.figma.ts
└─ 3) Regenerate generated artifacts
   └─ npm run build:all
      ├─ dist/tokens/*
      ├─ dist/ui/*
      ├─ dist/react/*
      └─ dist/main.css

Repository implementation
├─ 4) Add CSS pattern
│  └─ src/ui/patterns/<component>.css
├─ 5) Export pattern in UI bundle
│  └─ src/ui/index.css
├─ 6) Add React wrapper (if needed)
│  ├─ src/react/<component>.js
│  └─ src/react/index.js
└─ 7) Add assets (if needed)
   └─ src/assets/*

Documentation + Playground
├─ 8) Add component docs page
│  └─ site/components/<component>.md
├─ 9) Add playground page
│  └─ site/components/<component>-playground.md
├─ 10) Extend macros (if needed)
│   └─ site/_includes/macros/{ui.njk,playground.njk}
└─ 11) Extend playground runtime (only for new behavior)
   └─ site/assets/playground/{renderers.js,state.js,code.js,shared.js}

Validation
├─ npm run test:unit
├─ npm run build:all
├─ npm run docs:site
└─ npm run ci:check
```

## Flow: AI-assisted component incubation

This project is designed for a collaborative build loop between design and implementation, not only for one-way token export.

```text
Collaborative loop (real-world workflow)
├─ 1) Ask the assistant for a proposed component setup
│  ├─ component structure (HTML/CSS/React)
│  ├─ token naming proposal
│  └─ docs/playground example
├─ 2) Review and adapt the proposal
│  └─ align names and states with your design language
├─ 3) Create/import the proposed tokens in Figma
│  └─ refine values and variants in design
├─ 4) Export from Figma back into this repository
│  └─ figma/exports/*.tokens.json
├─ 5) Let the assistant integrate and align implementation
│  ├─ src/ui/patterns/<component>.css
│  ├─ src/react/<component>.js
│  ├─ site/components/<component>.md
│  ├─ site/components/<component>-playground.md
│  └─ figma/connections/web-<component>.figma.ts (if needed)
└─ 6) Validate and iterate
   ├─ npm run ci:check
   └─ repeat loop for naming, states, a11y, and behavior refinements
```

Why this matters:
- It closes the gap between design intent and production implementation.
- It keeps token naming and component APIs consistent across Figma and code.
- It makes component incubation faster while staying auditable in Git.

## Script locations

- `scripts/` — build, token extraction, validation, lint and smoke-check automation for local/CI usage
- `site/assets/playground/` — browser runtime modules for docs playground (shared helpers, state, code formatting, renderers)
- `tests/` — unit tests for extraction helpers and edge-case behavior

## CSS variable naming

CSS custom property names are derived from `com.figma.codeSyntax.WEB`.
If a token is missing `codeSyntax.WEB`, a warning is logged and the build
falls back to an auto-derived token name.

Scopes are derived from export filenames:

- `Brand X.tokens.json` -> `:root[data-brand="x"]`
- `Mode Light.tokens.json` -> `:root`
- `Mode Dark.tokens.json` -> `:root[data-mode="dark"]`

## Specification compliance

Generated JSON tokens follow the official Design Tokens Community Group format where applicable:

- W3C DTCG format: `https://www.designtokens.org/tr/drafts/format/`
- Export normalization maps Figma values to spec-friendly types (for example `dimension`, `fontFamily`, `fontWeight`)
- `fontWeight` values are emitted numerically in generated JSON, even if authored as strings in Figma
- Distributed JSON in `dist/tokens/json/*.json` strips `com.figma.*` metadata for cleaner consumer output
- Optional: include Figma metadata sidecars with `npm run tokens:generate -- --include-figma-metadata` (writes `*.figma.json`)

## Quick start (local)

1. Read the foundation rules in `docs/foundations/`
2. Inspect source tokens in `figma/exports/` and generated tokens in `dist/tokens/`
3. Run `npm run docs:dev`

## Build (local)

1. Optional syntax lint for JS files: `npm run lint`
2. Optional unit tests for extractor helpers: `npm run test:unit`
3. Generate token outputs (after Figma export updates): `npm run tokens:generate`
4. Build CSS bundles from already generated tokens: `npm run build:css`
5. Full refresh in one command (tokens + CSS): `npm run build:all`
6. Run smoke checks for generated artifacts: `npm run smoke:check`
7. Build docs: `npm run docs:site`
8. Run CI-equivalent checks locally: `npm run ci:check`

`npm run build:css` fails if `dist/tokens/css/*.tokens.css` does not exist yet.

## Token Pipeline Internals

`scripts/extract-tokens.js` is the orchestration entry point.

Main helper modules:
- `scripts/extract-tokens.utils.js` — parsing + normalization helpers (`readJsonLike`, `parseWebSyntax`, length/path utilities)
- `scripts/extract-tokens.lookup.js` — alias lookup + cycle/missing-target handling
- `scripts/extract-tokens.value.js` — token grouping + output value formatting
- `scripts/extract-tokens.scope.js` — scope parsing and selector/output-base normalization

Data flow:
1. Read `figma/exports/*.tokens.json` (JSON/JSONC supported)
2. Flatten tokens + resolve aliases across the combined lookup
3. Assign CSS variable names from `com.figma.codeSyntax.WEB`
4. Emit `dist/tokens/{css,json,ts}` and `dist/tokens/tokens.yaml`

Fallback behavior:
- Missing or invalid `com.figma.codeSyntax.WEB` values fall back to auto-derived CSS variable names and are reported in the extract summary.
- Missing alias targets and alias cycles fall back to literal values and are reported.
