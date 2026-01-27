# ADR-001: Token Layering Strategy

## Status
Accepted

## Context
We need a token architecture that:
- aligns Figma Variables with CSS custom properties
- supports Light/Dark modes
- supports multiple brands (e.g. TUI, ROBINSON, LTUR)
- scales across components without duplication
- stays maintainable and code-aligned

## Decision
We use four layers:

1) **Core (Primitives)**
- Raw physical values (spacing, radii, borders, typography primitives, layout constants)
- No brand and no theme variations

2) **Color Modes (Light/Dark)**
- Theme palettes: brand colors, neutrals, overlays
- Contains raw color values only, no semantic meaning

3) **Semantics (Roles)**
- Meaning-based roles used across the UI:
  - `Color.Text.*`
  - `Color.Fill.*`
  - `Color.Border.*`
  - `Typography.*`
  - `Corner.*`
- Contains brand modes (e.g. TUI/ROBINSON/LTUR) where needed

4) **Components (APIs)**
- Component token APIs (variants, parts, properties, states)
- Components reference semantic roles and core primitives
- Components must not define raw values for color/typography/layout fundamentals

## Consequences
- Changes to brand look-and-feel happen in **Semantics** (and/or Color Modes)
- Component styling remains stable; only references change
- Typography remains consistent: structure in `Typography.*`, color in `Color.Text.*`
- Layout constants (breakpoints, container sizes, z-index) live in Core
