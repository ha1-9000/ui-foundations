# UI Foundations

Token-first UI foundations aligned with Figma variables.

This package provides:

- foundation and semantic design tokens
- UI pattern CSS
- optional React wrappers
- docs/playground via Eleventy

## Install

```bash
npm install ui-foundations
```

## Package Usage

```js
import "ui-foundations/core.css";
import "ui-foundations/ui.css";
```

Optional token imports:

```js
import "ui-foundations/tokens/primitives.css";
import "ui-foundations/tokens/brand-a.css";
import "ui-foundations/tokens/brand-b.css";
import "ui-foundations/tokens/color-light.css";
import "ui-foundations/tokens/color-dark.css";
import "ui-foundations/tokens/semantic.css";
import "ui-foundations/tokens/components.css";
```

Runtime scope example:

```js
const root = document.documentElement;
root.dataset.brand = "a"; // "a" | "b"
root.dataset.mode = "light"; // "light" | "dark"
```

## Documentation

- Foundations (source of truth): `docs/foundations/`
- Workflow + pipeline details: `docs/foundations/foundation-010-implementation-and-pipeline-workflow.md`
- Branching + release governance: `docs/foundations/foundation-011-branching-and-release-governance.md`
- AI playbook: `docs/agentic/team-ai-playbook.md`
- Shareable skill: `docs/agentic/skills/design-ops-specialist/SKILL.md`
- Docs site content: `site/`
- Vanilla starter guide: `site/examples/vanilla-starter.md`

## Local Development

```bash
npm run docs:dev
```

Validation baseline:

```bash
npm run lint
npm run test:unit
npm run ci:check
```

Release shortcuts:

```bash
npm run release:patch   # or release:minor / release:major
npm run release:push
npm run release:publish # use npm publish --otp=<code> when 2FA is required
```
