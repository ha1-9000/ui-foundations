# ADR-004: Typography Scale & Line Height

## Status
Accepted

## Context
Figma does not support percentage line-height values. We need a typography system that:
- aligns Figma and CSS
- follows a consistent rhythm (4px base grid)
- supports reusable semantic typography roles

## Decision

### 1) Core typography primitives
Core defines:
- `Font.Size.*` in px
- `LineHeight.*` in px (rounded to 4px grid)
- `Font.Weight.*`
- `Font.Family.*`

### 2) Line-height rule
We use a 140% line-height target and round to the nearest 4px grid.
We publish the resulting scale as Core line-height primitives aligned to our font-size scale.

Mapping (font-size → line-height):
- xs (12) → xs (16)
- sm (14) → sm (20)
- md (16) → md (24)
- lg (20) → lg (28)
- xl (24) → xl (32)
- 2xl (32) → 2xl (44)
- 3xl (40) → 3xl (56)

### 3) Semantic typography roles bundle primitives
Semantic typography roles (`Typography.*`) bundle:
- font-family
- font-size
- line-height
- font-weight

Examples:
- `Typography.Label` (recommended: sm / 14 with sm / 20)
- `Typography.Body` (md / 16 with md / 24)
- `Typography.Heading.Size.S` (lg / 20 with lg / 28)
- `Typography.Heading.Size.M` (xl / 24 with xl / 32)
- `Typography.Heading.Size.L` (2xl / 32 with 2xl / 44)
- `Typography.Display` (3xl / 40 with 3xl / 56)

### 4) Typography does not include color
Text color lives in `Color.Text.*`, never inside typography roles.

## Consequences
- Designers and engineers share the same rhythm
- Typography becomes reusable across components without duplication
