# Figma → Repo Sync

Figma Variables are the source of truth for UI Foundations tokens.
Tokens are synced via the Figma API and normalized into the repo structure.

Local sync:

FIGMA_TOKEN=xxx FIGMA_FILE_KEY=yyy node scripts/figma-sync.mjs

Validation:
- `node scripts/validate-tokens.mjs` checks architecture rules and token hygiene.
- Validation fails CI if component tokens contain raw values or if semantics include component names.

Workflow:
- Generate a PR for any token changes produced by the sync.
- Review diffs against ADRs before merging.

Notes:
- Color modes (Light/Dark) are raw palettes.
- Semantics are role-based (Color / Typography / Corner).
- Components are APIs and must reference Semantics/Core.
- Component naming is variant-first.
