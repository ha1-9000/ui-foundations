---
layout: layouts/docs.njk
title: Color Tokens
description: Brand-, Neutral- und Overlay-Tokens inkl. Mode- und Brand-Switch.
navTitle: Color
order: 10
permalink: /tokens/color/
---

{% import "macros/ui.njk" as ui %}

{% if colorDocs.groups and colorDocs.groups.length %}
<p class="page-intro">Diese Seite wird automatisch aus <code>{{ colorDocs.sourceDir }}</code> erzeugt.</p>

<section class="palette">
{% for group in colorDocs.groups %}
<div class="palette-group" id="group-{{ group.id }}"{% if group.id == "brand-a" %} data-brand-scope="a"{% elif group.id == "brand-b" %} data-brand-scope="b"{% endif %}>
<h2>{{ group.title }}</h2>
{% if group.description %}<p class="palette-note">{{ group.description }}</p>{% endif %}
<div class="swatch-grid">
{% for token in group.tokens %}
{{ ui.colorChip(token) }}
{% endfor %}
</div>
</div>
{% endfor %}
</section>
{% else %}
<p>Keine Color-Tokens gefunden in <code>{{ colorDocs.sourceDir }}</code>.</p>
<p>Fuehre zuerst <code>npm run tokens:generate</code> aus.</p>
{% endif %}
