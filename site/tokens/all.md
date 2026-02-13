---
layout: layouts/docs.njk
title: All Tokens
description: Tabellarische Uebersicht aller Tokens aus dem zentralen YAML-Export.
navTitle: All Tokens
order: 5
permalink: /tokens/all/
templateEngineOverride: njk
---

{% if tokensTable.rows and tokensTable.rows.length %}
<p class="page-intro">Quelle: <code>{{ tokensTable.sourceDir }}</code> ({{ tokensTable.count }} Tokens)</p>
<div class="docs-filter-bar" aria-label="Token filters">
<label class="docs-filter">
<span>Scope</span>
<select id="token-scope-filter">
<option value="">Alle</option>
{% for scope in tokensTable.scopes %}
<option value="{{ scope }}">{{ scope }}</option>
{% endfor %}
</select>
</label>
<label class="docs-filter">
<span>Token Type</span>
<select id="token-type-filter">
<option value="">Alle</option>
{% for kind in tokensTable.kinds %}
<option value="{{ kind }}">{{ kind }}</option>
{% endfor %}
</select>
</label>
<button id="token-filter-reset" class="button ghost" type="button">Reset</button>
</div>
<p class="page-intro token-filter-summary" id="token-filter-summary">{{ tokensTable.count }} von {{ tokensTable.count }} Tokens angezeigt</p>

<div class="docs-table-wrap">
<table class="docs-table">
<thead>
<tr>
<th>Name</th>
<th>Scope</th>
<th>Value</th>
</tr>
</thead>
<tbody>
{% for token in tokensTable.rows %}
<tr data-token-row data-token-scope="{{ token.scope }}" data-token-type="{{ token.kind }}">
<td><code>{{ token.name }}</code></td>
<td><code>{{ token.scope }}</code></td>
<td><code>{{ token.value }}</code></td>
</tr>
{% endfor %}
</tbody>
</table>
</div>
{% else %}
<p>Keine Tokens gefunden in <code>{{ tokensTable.sourceDir }}</code>.</p>
<p>Fuehre zuerst <code>npm run tokens:generate</code> aus.</p>
{% endif %}

<script>
  const scopeFilter = document.getElementById("token-scope-filter");
  const typeFilter = document.getElementById("token-type-filter");
  const resetButton = document.getElementById("token-filter-reset");
  const summary = document.getElementById("token-filter-summary");
  const rows = Array.from(document.querySelectorAll("[data-token-row]"));

  if (scopeFilter && typeFilter && resetButton && summary && rows.length) {
    const applyTokenFilters = () => {
      const selectedScope = scopeFilter.value;
      const selectedType = typeFilter.value;
      let visible = 0;

      rows.forEach((row) => {
        const scopeMatch =
          !selectedScope || row.dataset.tokenScope === selectedScope;
        const typeMatch = !selectedType || row.dataset.tokenType === selectedType;
        const show = scopeMatch && typeMatch;

        row.hidden = !show;
        if (show) visible += 1;
      });

      summary.textContent = `${visible} von ${rows.length} Tokens angezeigt`;
    };

    scopeFilter.addEventListener("change", applyTokenFilters);
    typeFilter.addEventListener("change", applyTokenFilters);
    resetButton.addEventListener("click", () => {
      scopeFilter.value = "";
      typeFilter.value = "";
      applyTokenFilters();
    });
  }
</script>
