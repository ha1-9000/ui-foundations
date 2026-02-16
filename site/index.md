---
layout: layouts/docs.njk
title: Design System Documentation
description: Token and component documentation based on Eleventy collections.
permalink: /
---

## Sections

<div class="docs-grid">
  <a class="docs-card" href="/tokens/">
    <h2>Tokens</h2>
    <p>Colors, typography, and other foundations on dedicated documentation pages.</p>
  </a>
  <a class="docs-card" href="/components/">
    <h2>Components</h2>
    <p>Component API with standalone pages and examples.</p>
  </a>
</div>

## Token Pages

<ul class="docs-link-list">
  {% for entry in collections.tokensDocs %}
  <li>
    <a href="{{ entry.url }}">{{ entry.data.title }}</a>
    {% if entry.data.description %}
    <span>{{ entry.data.description }}</span>
    {% endif %}
  </li>
  {% endfor %}
</ul>

## Component Pages

<ul class="docs-link-list">
  {% for entry in collections.componentsDocs %}
  <li>
    <a href="{{ entry.url }}">{{ entry.data.title }}</a>
    {% if entry.data.description %}
    <span>{{ entry.data.description }}</span>
    {% endif %}
  </li>
  {% endfor %}
</ul>
