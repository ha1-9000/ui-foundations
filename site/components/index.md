---
layout: layouts/docs.njk
title: Components
description: Component documentation with dedicated pages and API examples.
navTitle: Overview
order: 1
permalink: /components/
---

This section presents components as standalone documentation pages, similar to Storybook stories.

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
