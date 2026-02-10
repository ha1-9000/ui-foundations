# UI Foundations

This repository contains the **foundation layer** of our UI platform:
- Design tokens (core primitives, color modes, semantic roles)
- Component token APIs (variants, parts, properties, states)
- Architecture Decision Records (ADRs) for long-term consistency
- Example implementations (CSS / container queries / Storybook docs)

## What this is
- A **token-first** foundation that aligns **Figma Variables** with **CSS custom properties**
- A **multi-brand** and **multi-mode** ready architecture
- A place to document decisions that must remain stable over time

## What this is not (yet)
- A full “product design system” with all patterns, usage guidelines, and governance
- Product-specific application rules (these live downstream in product repositories)

## Architecture (4 layers)

1) **Core (Primitives)**  
Raw physical values: spacing, radii, borders, typography primitives, layout constants.

2) **Color Modes (Light/Dark)**  
Theme palettes: brand colors, neutrals, overlays. No semantic meaning.

3) **Semantics (Roles)**  
Meaning-based roles: `Color.Text.*`, `Color.Fill.*`, `Color.Border.*`, `Typography.*`, `Corner.*`.  
Supports brand modes (e.g. TUI, ROBINSON, LTUR).

4) **Components (APIs)**  
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
- `tokens/` — token JSON (core, color, semantics, components)
- `docs/` — docs/playground (HTML preview)
- `src/` — Core/UI/React source layers
- `figma/` — Figma exports, mappings, Code Connect notes
- `agent/` — assistant rules and prompt examples

## Quick start (local)
1. Read the ADRs in `decisions/`
2. Inspect tokens in `tokens/`
3. Use `docs/index.html` for the preview

## Build (local)
1. Generate token outputs: `npm run tokens:generate`
2. Build dist bundles: `npm run docs:build`
