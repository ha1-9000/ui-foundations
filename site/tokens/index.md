---
layout: layouts/docs.njk
title: Tokens
description: Foundations organized as documented token categories.
navTitle: Overview
order: 1
permalink: /tokens/
---

This section documents token layers and their concrete output in CSS.

<ul class="docs-link-list">
  {% for entry in collections.tokensDocs %}
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
