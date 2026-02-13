# ADR-008: Mode Activation & Consumer Control

## Status
Accepted

## Context
We need dark mode support that is:
- reusable across different consumers (not only 11ty)
- non-invasive for hosts that do not want dark mode
- compatible with token-based theming and brand/mode scopes

Recent changes surfaced a coupling risk:
- if dark token outputs are emitted as global `:root`, they can override light defaults unintentionally
- if core theme CSS hard-codes dark value overrides, every consumer inherits behavior even when not wanted

## Decision

### 1) Token outputs are scope-ready, not activation logic
- Light mode tokens are emitted at `:root`
- Dark mode tokens are emitted at `:root[data-mode="dark"]`
- Brand tokens remain scoped by `data-brand`

Token generation provides values and scopes, but does not decide when dark mode is active.

### 2) Core theme layer stays neutral
`src/core/themes/mode.css` only defines non-invasive base behavior (`color-scheme`), without hard-coded color token overrides for dark mode.

### 3) Consumer decides mode policy
Each consuming app/site owns activation logic:
- whether dark mode is available at all
- how `system` mode maps to OS preference
- when/how `data-mode` is set or removed

For 11ty docs, this is handled in `src/docs/index.njk` script logic.

## Consequences
- No unintended global dark overrides in downstream consumers
- Clear separation of concerns: token definitions vs runtime mode policy
- Consumers can implement different behavior (light-only, manual dark toggle, system-following)
- Documentation site can still offer system/light/dark UX without forcing it globally
