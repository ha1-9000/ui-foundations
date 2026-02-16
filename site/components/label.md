---
layout: layouts/docs.njk
title: Label
description: Text and icon label primitives for components and form fields.
navTitle: Label
order: 30
permalink: /components/label/
playgroundUrl: /components/label-playground/
playgroundLabel: Open Label Playground
---

## Usage

{% raw %}
```jsx
<LabelContent text="Continue" />
<LabelContent text="Search" startIcon="search" />
<LabelContent text="Add" endIcon="plus" />
<LabelContent startIcon="menu" iconOnly />

<FieldLabel htmlFor="email" text="Email address" />
<FieldLabel htmlFor="search" text="Search" startIcon="search" />
<FieldLabel htmlFor="booking-code" text="Booking code" required />
```
{% endraw %}

## Preview

<div class="docs-stack" style="line-height: 24px;">
  <span class="label-content">
    <span class="label-content__icon label-content__icon--start">
      <span class="icon" style="--icon-src: url('/assets/icons/search.svg');" aria-hidden="true"></span>
    </span>
    <span class="label-content__text">Search</span>
  </span>

  <span class="label-content is-icon-only">
    <span class="label-content__icon label-content__icon--start">
      <span class="icon" style="--icon-src: url('/assets/icons/menu.svg');" aria-hidden="true"></span>
    </span>
  </span>

  <label class="field-label" for="preview-email">
    <span class="label-content">
      <span class="label-content__text">Email address</span>
    </span>
    <span class="field-label__required" aria-hidden="true">*</span>
    <span class="field-label__required-text"> (required)</span>
  </label>
</div>

## React exports

- `LabelContent`: visual primitive for text with optional start/end icons
- `FieldLabel`: semantic `<label>` wrapper that composes `LabelContent`

## Notes

- Use `FieldLabel` for inputs/selects/textarea so `htmlFor` links label and field.
- For buttons, use `LabelContent` inside the button content path.
- `Icon` stays decorative by default when passed as `startIcon`/`endIcon`.
