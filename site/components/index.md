---
layout: layouts/docs.njk
title: Components
description: Component-Dokumentation mit eigenen Seiten und API-Beispielen.
navTitle: Overview
order: 1
permalink: /components/
---

Diese Sektion zeigt Komponenten als eigenständige Doku-Seiten, ähnlich zu Storybook-Stories.

<ul class="docs-link-list">
  {% for entry in collections.componentsDocs %}
    {% if entry.url != page.url %}
    <li>
      <a href="{{ entry.url }}">{{ entry.data.title }}</a>
      {% if entry.data.description %}
      <span>{{ entry.data.description }}</span>
      {% endif %}
    </li>
    {% endif %}
  {% endfor %}
</ul>
