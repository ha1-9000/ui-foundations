const fs = require("fs");
const { parse } = require("jsonc-parser");

function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

// Reads JSON/JSONC token exports and returns a parsed object with useful parse errors.
function readJsonLike(filePath) {
  const text = stripBom(fs.readFileSync(filePath, "utf8"));
  const errors = [];
  const data = parse(text, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  });

  if (errors.length > 0) {
    const first = errors[0];
    throw new Error(
      `Failed to parse ${filePath} (offset ${first.offset}, length ${first.length}, code ${first.error})`,
    );
  }

  return data;
}

// Converts free-form names (for example file-derived scope labels) into stable slugs.
function slugifyName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Validates Figma WEB code syntax and normalizes it to a CSS var + var() reference pair.
function parseWebSyntax(webSyntax) {
  const raw = String(webSyntax || "").trim();
  if (!raw) {
    return { name: null, ref: null, error: "empty WEB syntax" };
  }

  let name = null;
  if (/^var\(/i.test(raw)) {
    const match = raw.match(/^var\(\s*(--[^)\s]+)\s*\)$/i);
    if (match) {
      name = match[1];
    } else {
      return { name: null, ref: null, error: `invalid WEB syntax: ${raw}` };
    }
  } else {
    name = raw;
  }

  if (!name.startsWith("--") || name.includes(")")) {
    return { name: null, ref: null, error: `invalid WEB syntax: ${raw}` };
  }

  return { name, ref: `var(${name})`, error: null };
}

// Normalizes a Figma variable id by stripping mode/path suffixes used in exports.
function normalizeVariableId(raw) {
  if (!raw) return null;
  return String(raw).split("/")[0].trim() || null;
}

// Normalizes token references to a canonical slash-based path for lookup matching.
function normalizeTokenPath(raw) {
  return String(raw || "")
    .trim()
    .replace(/^\{|\}$/g, "")
    .replace(/\./g, "/")
    .replace(/\/+/g, "/");
}

// Converts token path fragments into kebab-case CSS-friendly keys.
function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .toLowerCase();
}

// Normalizes length-like values to rem where appropriate while preserving non-length values.
function formatLength(value) {
  if (typeof value === "number") return toRem(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    const pxMatch = trimmed.match(/^(-?\d*\.?\d+)px$/i);
    if (pxMatch) {
      const parsed = Number(pxMatch[1]);
      if (!Number.isNaN(parsed)) return toRem(parsed);
    }
    const remMatch = trimmed.match(/^(-?\d*\.?\d+)rem$/i);
    if (remMatch) {
      const parsed = Number(remMatch[1]);
      if (!Number.isNaN(parsed)) return formatRemValue(parsed);
    }
  }
  return value;
}

function toRem(px) {
  return formatRemValue(px / 16);
}

function formatRemValue(rem) {
  let trimmed = rem
    .toFixed(4)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*[1-9])0+$/, "$1");

  if (trimmed === "-0") trimmed = "0";
  if (trimmed.startsWith("0.") && trimmed !== "0") trimmed = trimmed.slice(1);
  if (trimmed.startsWith("-0.")) trimmed = `-${trimmed.slice(2)}`;

  return trimmed === "0" ? "0" : `${trimmed}rem`;
}

module.exports = {
  readJsonLike,
  slugifyName,
  parseWebSyntax,
  normalizeVariableId,
  normalizeTokenPath,
  toKebabCase,
  formatLength,
};
