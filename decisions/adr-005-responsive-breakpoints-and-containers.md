# ADR-005: Responsive Strategy (Breakpoints & Container Queries)

## Status
Accepted

## Context
We need responsive thresholds that work for:
- viewport-based layouts (media queries)
- component-based layouts (container queries)
- multi-platform usage and long-term maintainability

## Decision

### 1) Breakpoints (viewport) are Core primitives
Store breakpoints as numeric primitives:
- `Core.Breakpoint.*` (px)

No device naming (no mobile/tablet/desktop).

### 2) Container thresholds are separate Core primitives
Store container inline-size thresholds as numeric primitives:
- `Core.Container.*` (px)

Container thresholds are not the same as viewport breakpoints.

### 3) No t-shirt sizing in Core
We avoid S/M/L naming for breakpoints and containers in Core.
Optional speaking aliases may be added later as documentation helpers, but the numeric tokens are the source of truth.

## Consequences
- Precision and stability in responsive behavior
- Clear separation between page layout and component layout
