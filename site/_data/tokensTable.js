const {
  TOKENS_YAML_RELATIVE_PATH,
  loadTokensFromYaml,
} = require("../lib/tokens-yaml");

const TOKEN_KIND_BY_GROUP = {
  colors: "color",
  typography: "font",
  spacing: "spacing",
  radii: "radii",
  shadows: "shadow",
  breakpoints: "breakpoint",
  containers: "container",
  components: "component",
};

function toTokenKind(group) {
  const key = String(group || "").toLowerCase();
  return TOKEN_KIND_BY_GROUP[key] || key || "unknown";
}

function mapTokenRow(token) {
  const group = String(token?.group || "");
  return {
    name: String(token.name || token.cssVar || "").replace(/^--/, ""),
    scope: `${String(token.scopeBucket || "global")}:${String(
      token.scopeId || "global",
    )}`,
    kind: toTokenKind(group),
    value: token.value ?? "",
  };
}

function sortRows(a, b) {
  const nameCmp = a.name.localeCompare(b.name, undefined, {
    numeric: true,
  });
  if (nameCmp !== 0) return nameCmp;
  return a.scope.localeCompare(b.scope);
}

function loadRows() {
  return loadTokensFromYaml()
    .filter((token) => String(token?.cssVar || "").startsWith("--"))
    .map(mapTokenRow)
    .sort(sortRows);
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

module.exports = () => {
  const rows = loadRows();
  return {
    rows,
    count: rows.length,
    scopes: uniqueSorted(rows.map((row) => row.scope)),
    kinds: uniqueSorted(rows.map((row) => row.kind)),
    sourceDir: TOKENS_YAML_RELATIVE_PATH,
  };
};
