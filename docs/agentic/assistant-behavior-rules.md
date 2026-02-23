# Assistant rules (UI Foundations)

1. Always follow foundation rules in `/docs/foundations` as the source of truth.
2. Keep the 4-layer architecture: Core → Color Modes → Semantics → Components.
3. Components may only reference Semantics/Core tokens; no raw values in components.
4. Typography tokens never include color; text color lives in `Color.Text.*`.
5. Responsive thresholds:
   - Viewport breakpoints in `Core.Breakpoint.*`
   - Container query thresholds in `Core.Container.*`
6. Use variant-first naming: `Component.variant.part.property.state`.
