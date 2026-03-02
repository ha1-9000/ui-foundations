# UI Foundations (Token Extraction Only)

This repository is trimmed down to **token extraction only**.
Docs, site generation, component code, and CI checks have been removed.

## Structure

- `figma/exports/` — token source exports from Figma (input)
- `dist/tokens/` — generated token artifacts (CSS/JSON/TS + tokens.yaml)
- `scripts/` — token extraction + validation

## Commands

Generate tokens (JSON + CSS):
```bash
npm run tokens:generate
```

Validate token output:
```bash
npm run tokens:validate
```

## Output

- JSON: `dist/tokens/json/`
- CSS: `dist/tokens/css/`
- YAML: `dist/tokens/tokens.yaml`
- Mapping report: `mapping-report.md`

## Mapping report

The token mapping report is stored in this project at:
- `mapping-report.md`

## Input requirements

Place Figma exports here before running:
- `figma/exports/*.tokens.json` (or `.token.json` / `.jsonc`)
