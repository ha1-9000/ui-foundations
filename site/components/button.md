---
layout: layouts/docs.njk
title: Button
description: Varianten, Zustände und Token-gebundene Darstellung.
navTitle: Button
order: 10
permalink: /components/button/
---

## Variants

<div class="button-group docs-stack">
  <button type="button" class="button">Solid</button>
  <button type="button" class="button outline">Outline</button>
  <button type="button" class="button ghost">Ghost</button>
  <button type="button" class="button" disabled>Disabled</button>
</div>

## API (React)

```jsx
<Button variant="solid">Solid</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button disabled>Disabled</Button>
```

## Token reference (excerpt)

- `--button-solid-container-background-default`
- `--button-outline-border-color-default`
- `--button-ghost-text-color-default`
- `--button-container-background-disabled`
