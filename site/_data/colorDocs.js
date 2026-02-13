const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const TOKENS_YAML_PATH = path.join(
  __dirname,
  "..",
  "..",
  "dist",
  "tokens",
  "tokens.yaml",
);

function loadTokens() {
  if (!fs.existsSync(TOKENS_YAML_PATH)) return [];

  try {
    const doc = yaml.load(fs.readFileSync(TOKENS_YAML_PATH, "utf8"));
    return Array.isArray(doc?.tokens) ? doc.tokens : [];
  } catch {
    return [];
  }
}

function normalizeTokens(tokens) {
  return tokens
    .filter((token) => String(token?.cssVar || "").startsWith("--"))
    .map((token) => ({
      cssVar: String(token.cssVar),
      name: String(token.name || token.cssVar.replace(/^--/, "")),
      value: token.value ?? "",
      scopeBucket: String(token.scopeBucket || ""),
      scopeId: String(token.scopeId || ""),
    }));
}

function sortByName(tokens) {
  return [...tokens].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true }),
  );
}

function pickByScope(tokens, bucket, id) {
  return tokens.filter(
    (token) => token.scopeBucket === bucket && token.scopeId === id,
  );
}

function pickByPrefixes(tokens, prefixes) {
  return tokens.filter((token) =>
    prefixes.some((prefix) => token.cssVar.startsWith(prefix)),
  );
}

module.exports = () => {
  const tokens = normalizeTokens(loadTokens());
  const semanticPrefixes = [
    "--color-text-",
    "--color-fill-",
    "--color-border-",
    "--color-overlay-",
  ];

  const groups = [
    {
      id: "brand-a",
      title: "Brand A",
      description: "Aus tokens.yaml gefiltert (scope brand:a).",
      tokens: sortByName(
        pickByPrefixes(pickByScope(tokens, "brand", "a"), ["--brand-color-"]),
      ),
    },
    {
      id: "brand-b",
      title: "Brand B",
      description: "Aus tokens.yaml gefiltert (scope brand:b).",
      tokens: sortByName(
        pickByPrefixes(pickByScope(tokens, "brand", "b"), ["--brand-color-"]),
      ),
    },
    {
      id: "light-semantic",
      title: "Light Semantic Mapping",
      description: "Aus tokens.yaml gefiltert (scope mode:light).",
      tokens: sortByName(
        pickByPrefixes(pickByScope(tokens, "mode", "light"), semanticPrefixes),
      ),
    },
    {
      id: "dark-semantic",
      title: "Dark Semantic Mapping",
      description: "Aus tokens.yaml gefiltert (scope mode:dark).",
      tokens: sortByName(
        pickByPrefixes(pickByScope(tokens, "mode", "dark"), semanticPrefixes),
      ),
    },
    {
      id: "core-neutral-overlay",
      title: "Core Neutrals & Overlay",
      description: "Aus tokens.yaml gefiltert (scope other:primitives).",
      tokens: sortByName(
        pickByPrefixes(pickByScope(tokens, "other", "primitives"), [
          "--color-transparent",
          "--color-neutral-",
          "--color-neutral-alpha-",
        ]),
      ),
    },
  ].filter((group) => group.tokens.length > 0);

  return {
    groups,
    sourceDir: "dist/tokens/tokens.yaml",
  };
};
