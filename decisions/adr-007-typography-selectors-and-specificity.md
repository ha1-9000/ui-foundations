# ADR-007: Typography Selectors & Specificity

## Status
Accepted

## Context
We need a consistent typography API that:
- supports element defaults (`h1`…`h6`)
- allows heading styles on non-heading elements
- keeps specificity low to avoid cascading conflicts
- aligns with the token-driven approach

## Decision

### 1) Element defaults for headings
`h1`…`h6` define base heading styles:
- font-family
- font-weight
- line-height
- color
- text-rendering

### 2) Heading class for non-heading elements
`.heading` applies the same base heading styles to non-heading elements.

### 3) Size scale via class modifiers
Heading sizes use size classes:
- `.heading-xxxl`
- `.heading-xxl`
- `.heading-xl`
- `.heading-lg`
- `.heading-md`
- `.heading-sm`

Text scale uses utility-like classes:
- `.text--xs` … `.text--3xl`

### 4) Low specificity via :where()
We use `:where()` to keep specificity at zero for size/scale selectors
(e.g. `:where(h1, .heading-xxxl)`), so component-level styles can
override without `!important`.

### 5) Data attributes are context/state only
Data attributes (e.g. `[data-theme]`, `[data-density]`) are reserved for
contextual/states and are not used as the primary styling API.

## Consequences
- Predictable overrides and fewer specificity wars
- Clear separation between element defaults and class-based variants
- Keeps the API aligned with design tokens and future component layers
