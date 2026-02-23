import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  buildTokenKey,
  classifyTokenGroup,
  formatTokenValue,
} = require("../scripts/extract-tokens.value.js");
const {
  parseScopeKey,
  selectorForScope,
  normalizePerFileBase,
} = require("../scripts/extract-tokens.scope.js");

test("buildTokenKey creates kebab-case keys", () => {
  assert.equal(buildTokenKey(["Button", "Text", "Color", "Default"]), "button-text-color-default");
});

test("classifyTokenGroup maps tokens by path/prefix", () => {
  assert.equal(
    classifyTokenGroup({ pathSegments: ["Color", "Text"], cssVar: "--color-text-default" }),
    "colors",
  );
  assert.equal(
    classifyTokenGroup({ pathSegments: ["Breakpoint", "100"], cssVar: "--breakpoint-100" }),
    "breakpoints",
  );
  assert.equal(
    classifyTokenGroup({ pathSegments: ["Input", "Text"], cssVar: "--input-text-color" }),
    "components",
  );
});

test("formatTokenValue preserves layout columns and z-index numbers", () => {
  assert.equal(
    formatTokenValue(
      { type: "number" },
      12,
      "layout-columns",
      ["Layout", "Columns"],
    ),
    12,
  );
  assert.equal(
    formatTokenValue({ type: "number" }, 30, "zindex-toast", ["zIndex", "toast"]),
    30,
  );
});

test("scope helpers normalize and resolve selectors", () => {
  assert.deepEqual(parseScopeKey("brand:a"), { bucket: "brand", id: "a" });
  assert.equal(selectorForScope({ bucket: "mode", id: "dark" }), ':root[data-mode="dark"]');
  assert.equal(normalizePerFileBase("mode-light.tokens"), "color.light.tokens");
});
