---
layout: layouts/docs.njk
title: Button
description: Variants, grouped usage, states, and token-driven rendering.
navTitle: Button
order: 10
permalink: /components/button/
playgroundUrl: /components/button-playground/
playgroundLabel: Open Button Playground
---

{% import "macros/ui.njk" as ui %}

## Variants

<div class="docs-stack">
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
<Button startIcon="search">Search</Button>
<Button endIcon="plus">Add</Button>
<Button startIcon="menu" iconOnly ariaLabel="Open menu" />
<Button disabled>Disabled</Button>
```

## Grouped Actions (Button Group Wrapper)

[Open Button Group Playground](/components/button-group-playground/)

```html
<div
  class="button-group"
  role="group"
  data-orientation="horizontal"
  data-attached="false"
  data-justify="start"
>
  <button class="button" type="button">Primary</button>
  <button class="button outline" type="button">Secondary</button>
  <button class="button ghost" type="button">Tertiary</button>
</div>
```

<div class="docs-stack" style="max-inline-size: 34rem;">
  {% call ui.buttonGroup(false, "horizontal", "start") %}
    {{ ui.button("Primary", "outline") }}
    {{ ui.button("Primary", "outline") }}
    {{ ui.button("Primary", "outline") }}
  {% endcall %}
</div>

```jsx
<ButtonGroup attached>
  <Button variant="outline">Day 1</Button>
  <Button variant="outline">Day 2</Button>
  <Button variant="outline">Day 3</Button>
</ButtonGroup>
```

## Token reference (excerpt)

- `--button-solid-container-background-default`
- `--button-outline-border-color-default`
- `--button-ghost-text-color-default`
- `--button-container-background-disabled`
- `--button-group-gap`
- `--button-group-border-radius`
