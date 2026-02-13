---
layout: layouts/docs.njk
title: Design System Documentation
description: Token- und Component-Dokumentation auf Basis von Eleventy Collections.
permalink: /
---

## Bereiche

<div class="docs-grid">
  <a class="docs-card" href="/tokens/">
    <h2>Tokens</h2>
    <p>Farben, Typografie und weitere Foundations als eigene Doku-Seiten.</p>
  </a>
  <a class="docs-card" href="/components/">
    <h2>Components</h2>
    <p>Component-API mit eigenständigen Seiten und Beispielen.</p>
  </a>
</div>

## Token Seiten

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

## Component Seiten

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
