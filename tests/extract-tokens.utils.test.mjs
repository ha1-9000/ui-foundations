import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { parseWebSyntax, formatLength } = require("../scripts/extract-tokens.utils.js");

test("parseWebSyntax accepts var(...) and raw --token forms", () => {
  assert.deepEqual(parseWebSyntax("var(--color-text-default)"), {
    name: "--color-text-default",
    ref: "var(--color-text-default)",
    error: null,
  });

  assert.deepEqual(parseWebSyntax("--color-text-default"), {
    name: "--color-text-default",
    ref: "var(--color-text-default)",
    error: null,
  });
});

test("parseWebSyntax rejects invalid values", () => {
  assert.equal(parseWebSyntax("").error, "empty WEB syntax");
  assert.match(
    String(parseWebSyntax("color-text-default").error),
    /invalid WEB syntax/,
  );
});

test("formatLength converts numbers/px to rem and preserves non-length values", () => {
  assert.equal(formatLength(8), ".5rem");
  assert.equal(formatLength("24px"), "1.5rem");
  assert.equal(formatLength("1.25rem"), "1.25rem");
  assert.equal(formatLength("auto"), "auto");
});
