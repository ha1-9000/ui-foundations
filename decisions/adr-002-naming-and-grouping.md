# ADR-002: Naming & Grouping Conventions

## Status
Accepted

## Context
We need token names that:
- stay readable in Figma (grouping is driven by path segments)
- stay code-aligned and easy to search in repositories
- scale across components and variants without becoming unmaintainable
- avoid device-based naming and avoid ambiguous "default" tokens

## Decision

### 1) Component tokens use variant-first grouping
Component token path:
`Component.variant.part.property.state`

Examples:
- `Button.solid.container.background.default`
- `Button.outline.container.border-color.hover`
- `Button.ghost.label.text-color.disabled`

Rationale:
- Figma groups by leading segments; variant-first keeps browsing predictable
- mirrors how engineers reason about a component ("Button → solid → container")

### 2) Semantics tokens are role-based and component-agnostic
Semantics tokens never contain component names.

Examples:
- `Color.Text.Default`
- `Color.Fill.Surface`
- `Color.Border.Brand`
- `Typography.Label`
- `Corner.Medium`

### 3) States are represented as the last segment
States are always at the end:
`...property.state`

Common states:
`default`, `hover`, `active`, `focus`, `disabled`

### 4) Naming rules
- Use PascalCase for component name and lowercase for the rest:
  - `Button.solid.container.background.default`
- Use kebab-case for multi-word properties: `border-color`, `line-height`
- Avoid device labels (`mobile/tablet/desktop`) for responsive tokens

## Consequences
- Token browsing in Figma becomes consistent and scalable
- Component tokens remain implementation-focused; semantics remain meaning-focused
