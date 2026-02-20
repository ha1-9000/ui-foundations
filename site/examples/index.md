---
layout: layouts/docs.njk
title: Examples
description: Zusammengesetzte Muster (Organisms) aus bestehenden UI-Components.
navTitle: Overview
order: 1
permalink: /examples/
---

Diese Sektion zeigt konkrete UI-Zusammenstellungen aus den bestehenden Components.

<ul class="docs-link-list">
  {% for entry in collections.examplesDocs %}
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
