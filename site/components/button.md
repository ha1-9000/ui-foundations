---
layout: layouts/docs.njk
title: Button
description: Varianten, Zustände und Token-gebundene Darstellung.
navTitle: Button
order: 10
permalink: /components/button/
---

{% import "macros/ui.njk" as ui %}

## Variants

<div class="button-group docs-stack">
  {{ ui.button("Solid") }}
  {{ ui.button("Outline", "outline") }}
  {{ ui.button("Ghost", "ghost") }}
  {{ ui.button("Disabled", "", true) }}
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
