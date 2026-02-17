---
layout: layouts/docs.njk
title: Input
description: Text input pattern with token-driven interaction states.
navTitle: Input
order: 40
permalink: /components/input/
playgroundUrl: /components/input-playground/
playgroundLabel: Open Input Playground
---

## Usage (HTML)

```html
<input class="input" type="text" placeholder="Email address" />
```

## Preview

<div class="docs-stack" style="max-inline-size: 28rem;">
  <input class="input" type="text" placeholder="Email address" />
  <input class="input is-focus-visible" type="text" value="Focus preview" />
  <input class="input" type="text" value="Disabled field" disabled />
</div>

## API (React)

{% raw %}
```jsx
<Input placeholder="Email address" />
<Input type="email" placeholder="name@example.com" />
<Input value="Read only" readOnly />
<Input disabled value="Disabled field" />
```
{% endraw %}

## Token reference (excerpt)

- `--input-text-border-color-default`
- `--input-text-border-color-focus`
- `--input-text-container-background-default`
- `--input-text-text-color-placeholder`
- `--shadow-focus`
- `--color-focus`
