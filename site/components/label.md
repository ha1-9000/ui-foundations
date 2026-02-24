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

## Preview

<div class="docs-stack" style="line-height: 24px;">
  <span class="label-content">
    <span class="icon" data-slot="start" style="--icon-src: url('/assets/icons/search.svg');" aria-hidden="true"></span>
    <span class="label-content__text">Search</span>
  </span>

  <span class="label-content is-icon-only">
    <span class="icon" data-slot="start" style="--icon-src: url('/assets/icons/menu.svg');" aria-hidden="true"></span>
  </span>

  <label class="field-label" for="preview-email">
    <span class="label-content">
      <span class="label-content__text">Email address</span>
    </span>
    <span class="field-label__required" aria-hidden="true">*</span>
    <span class="field-label__required-text"> (required)</span>
  </label>
</div>

## Notes

- Use `FieldLabel` for inputs/selects/textarea so `htmlFor` links label and field.
- For buttons, use `LabelContent` inside the button content path.
- `Icon` stays decorative by default when passed as `startIcon`/`endIcon`.

## Used tokens

<div class="docs-table-wrap">
  <table class="docs-table">
    <thead>
      <tr>
        <th>Token</th>
        <th>Usage</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><code>--label-gap</code></td><td>Spacing between icon and text inside <code>.label-content</code></td></tr>
      <tr><td><code>--field-label-gap</code></td><td>Spacing between label content and required marker</td></tr>
      <tr><td><code>--field-label-line-height</code></td><td>Line-height override for field labels</td></tr>
      <tr><td><code>--field-label-required-color</code></td><td>Color of required marker (<code>*</code>)</td></tr>
    </tbody>
  </table>
</div>

## Usage (React)

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

## React exports

- `LabelContent`: visual primitive for text with optional start/end icons
- `FieldLabel`: semantic `<label>` wrapper that composes `LabelContent`
