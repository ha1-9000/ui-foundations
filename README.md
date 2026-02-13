# UI Foundations

This repository contains the **foundation layer** of our UI platform:

- Design tokens (core primitives, color modes, semantic roles)
- Component token APIs (variants, parts, properties, states)
- Architecture Decision Records (ADRs) for long-term consistency
- Docs/playground generated with Eleventy

## What this is

- A **token-first** foundation that aligns **Figma Variables** with **CSS custom properties**
- A **multi-brand** and **multi-mode** ready architecture
- A place to document decisions that must remain stable over time

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
   Component-level decisions: variants, parts, properties, states.  
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

- `decisions/` — ADRs (source of truth)
- `figma/exports/` — token source exports from Figma
- `dist/tokens/` — generated token artifacts (CSS/JSON/TS)
- `src/` — Core/UI/React source layers
- `figma/` — Figma exports, mappings, Code Connect notes
- `agent/` — assistant rules and prompt examples

## CSS variable naming

CSS custom property names are derived from `com.figma.codeSyntax.WEB`.
If a token is missing `codeSyntax.WEB`, a warning is logged and the build
falls back to the legacy name.

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

1. Read the ADRs in `decisions/`
2. Inspect source tokens in `figma/exports/` and generated tokens in `dist/tokens/`
3. Run `npm run docs:dev`

## Build (local)

1. Generate token outputs: `npm run tokens:generate`
2. Build CSS bundles: `npm run build:css`
3. Build docs: `npm run docs:site`
