# ADR-006: Z-Index / Layering Strategy

## Status
Accepted

## Context
We need consistent stacking behavior across the UI without magic numbers scattered across components.

## Decision
Z-index values are defined as Core primitives under `Core.ZIndex.*`.

Recommended levels:
- `Core.ZIndex.Hidden = -1`
- `Core.ZIndex.Base = 0`
- `Core.ZIndex.Raised = 1`

Overlay stack:
- `Core.ZIndex.DropdownBase = 900`
- `Core.ZIndex.Dropdown = 1000`
- `Core.ZIndex.Sticky = 1020`
- `Core.ZIndex.Fixed = 1030`
- `Core.ZIndex.ModalOverlay = 1040`
- `Core.ZIndex.Modal = 1050`
- `Core.ZIndex.Popover = 1060`
- `Core.ZIndex.Tooltip = 1070`

Components must reference these tokens and must not introduce new stacking numbers.

## Consequences
- Predictable stacking across the product
- No z-index conflicts between components
