# ADR-003: Color Semantics, Status vs State

## Status
Accepted

## Context
We need a color model that:
- supports Light/Dark modes via palettes (raw colors)
- supports multiple brands (brand palettes)
- supports semantic meaning (roles) without component-specific duplication
- keeps interaction states (hover/active/disabled) separate from status meaning (danger/success)

## Decision

### 1) Color modes contain raw palettes (no meaning)
Color Mode tokens contain raw values only:
- `Brand.*` (brand palette)
- `Neutral.*` (greys)
- `Overlay.*` (alpha/elevation overlays)
These are stored per mode, e.g. Light and Dark.

### 2) Semantics expose only three main role families
Semantic color roles are:
- `Color.Text.*`
- `Color.Fill.*`
- `Color.Border.*`

### 3) Status is semantic meaning (global)
Status is expressed inside the three families:
- `Color.Text.Danger`, `Color.Fill.Danger`, `Color.Border.Danger`
- optionally `Warning`, `Success`, `Info`

Status roles map to brand palette choices (e.g. `Brand.Red.*`) inside Semantics.

### 4) State is interaction (component logic)
Interaction states are not semantic color families. They are expressed in component tokens:
- `...background.hover`
- `...border-color.focus`
- `...text-color.disabled`

Components reference semantic roles for each state (e.g. hover uses `Color.Fill.Subtle` or overlays).

### 5) "Inverse" roles
We support inverse readability:
- `Color.Text.Inverse`
- optional `Color.Fill.Inverse` (only if we use dark surfaces inside light UI)

## Consequences
- Semantics remain global and reusable
- Components implement variants and interaction states without polluting the semantic layer
- Multi-brand and multi-mode mapping remains flexible
