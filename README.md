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

Clean exports for re-import into Figma:
```bash
npm run tokens:clean
```

## Output

- JSON: `dist/tokens/json/`
- CSS: `dist/tokens/css/`
- YAML: `dist/tokens/tokens.yaml`
- Mapping report: `mapping-report.md`
- Figma change log: `figma-change-log.md`

## Mapping report

The token mapping report is stored in this project at:
- `mapping-report.md`

## Figma change log

Progress tracking over time is stored in:
- `figma-change-log.md`

## Figma import-ready files

`npm run tokens:clean` writes cleaned import files to:
- `figma/import-ready/Primitives.cleaned.tokens.json`
- `figma/import-ready/Semantics.cleaned.tokens.json`
- `figma/import-ready/Uilib.components.tokens.json`
- `figma/import-ready/Uilib.missing-from-figma.tokens.json`
- `figma/import-ready/cleaning-report.json`

By default, component/missing files are built from:
- `/Users/Thomas.Bielich@tui.com/Sites/uilib-1/dist`

You can override this source with:
```bash
UILIB_DIST_DIR=/path/to/uilib/dist npm run tokens:clean
```

## Input requirements

Place Figma exports here before running:
- `figma/exports/*.tokens.json` (or `.token.json` / `.jsonc`)
