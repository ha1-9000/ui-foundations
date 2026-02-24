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

Use `ButtonGroup` to keep related actions visually and semantically grouped.

```html
<div
  class="button-group"
  role="group"
  aria-label="Travel dates"
  data-orientation="horizontal"
  data-attached="false"
  data-justify="start"
>
  <button class="button outline" type="button">Day 1</button>
  <button class="button outline" type="button">Day 2</button>
  <button class="button outline" type="button">Day 3</button>
</div>
```

<div class="docs-stack" style="max-inline-size: 34rem;">
  {% call ui.buttonGroup(false, "horizontal", "start", "Travel dates") %}
    {{ ui.button("Day 1", "outline") }}
    {{ ui.button("Day 2", "outline") }}
    {{ ui.button("Day 3", "outline") }}
  {% endcall %}
</div>

```jsx
<ButtonGroup attached aria-label="Travel dates">
  <Button variant="outline">Day 1</Button>
  <Button variant="outline">Day 2</Button>
  <Button variant="outline">Day 3</Button>
</ButtonGroup>
```

- `orientation`: `"horizontal"` (default) or `"vertical"`
- `attached`: `false` (default) removes shared borders/gaps when `true`
- `justify`: `"start"` (default) or `"stretch"`

## Token reference (excerpt)

- `--button-solid-container-background-default`
- `--button-outline-border-color-default`
- `--button-ghost-text-color-default`
- `--button-container-background-disabled`
- `--button-group-gap`
- `--button-group-border-radius`
