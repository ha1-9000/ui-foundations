#!/usr/bin/env node

/**
 * Extract design tokens from local Figma exports
 * Usage: node scripts/extract-tokens.js
 */

const fs = require("fs");
const path = require("path");
const fg = require("fast-glob");
const { parse } = require("jsonc-parser");

const REPO_ROOT = path.resolve(__dirname, "..");
const EXPORTS_DIR = path.join(REPO_ROOT, "figma", "exports");
const OUTPUT_DIR = path.join(REPO_ROOT, "dist", "tokens");

const EXPORT_PATTERNS = [
  "figma/exports/**/*.token.json",
  "figma/exports/**/*.tokens.json",
  "figma/exports/**/*.token.jsonc",
  "figma/exports/**/*.tokens.jsonc",
];

function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

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

function isTokenNode(node) {
  return (
    node && typeof node === "object" && "$type" in node && "$value" in node
  );
}

function flattenTokens(node, pathSegments, list) {
  if (!node || typeof node !== "object") return;

  if (isTokenNode(node)) {
    const aliasTargetName =
      node.$extensions &&
      node.$extensions["com.figma.aliasData"] &&
      node.$extensions["com.figma.aliasData"].targetVariableName
        ? String(node.$extensions["com.figma.aliasData"].targetVariableName)
        : null;
    list.push({
      pathSegments,
      type: node.$type,
      value: node.$value,
      aliasTargetName,
    });
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    flattenTokens(value, [...pathSegments, key], list);
  }
}

function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .toLowerCase();
}

function normalizeColor(value) {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object") {
    if (Array.isArray(value.components)) {
      const [r, g, b] = value.components;
      const a = value.alpha === undefined ? 1 : value.alpha;
      return a < 1 ? toRgba(r, g, b, a) : toRgb(r, g, b);
    }
    if (typeof value.hex === "string") return value.hex;
  }
  return value;
}

function toRgb(r, g, b) {
  const to255 = (c) => Math.round(c * 255);
  return `rgb(${to255(r)} ${to255(g)} ${to255(b)})`;
}

function toRgba(r, g, b, a) {
  const to255 = (c) => Math.round(c * 255);
  const alpha = Number(a.toFixed(4)).toString();
  return `rgba(${to255(r)} ${to255(g)} ${to255(b)} / ${alpha})`;
}

function normalizeAliasKey(raw) {
  return raw.replace(/\//g, ".");
}

function aliasToCssVar(raw) {
  const key = toKebabCase(raw.replace(/\//g, "-"));
  return `var(--${key})`;
}

function resolveAlias(value, tokenMap, stack = new Set()) {
  if (typeof value !== "string") return value;
  const match = value.match(/^\{(.+)\}$/);
  if (!match) return value;

  const aliasKey = normalizeAliasKey(match[1]);
  if (stack.has(aliasKey)) return value;

  const target = tokenMap.get(aliasKey);
  if (!target) return value;

  stack.add(aliasKey);
  return resolveAlias(target.value, tokenMap, stack);
}

function isBreakpointToken(segments) {
  // Breakpoint tokens are grouped under Breakpoint.*
  return String(segments[0] || "").toLowerCase() === "breakpoint";
}

function isContainerToken(segments) {
  // Container tokens are grouped under Container.*
  return String(segments[0] || "").toLowerCase() === "container";
}

function mapStepToSizeLabel(step) {
  const map = {
    100: "sm",
    200: "md",
    300: "lg",
    400: "xl",
    500: "2xl",
  };
  const numeric = Number(step);
  if (!Number.isNaN(numeric) && map[numeric]) return map[numeric];
  return String(step);
}

function formatPx(value) {
  // Breakpoints/containers stay in px; preserve any explicit unit
  if (typeof value === "number") return `${value}px`;
  return value;
}

function buildTokenKey(segments) {
  return toKebabCase(segments.join("-"));
}

function formatTokenValue(token, rawValue, tokenKey, segments) {
  const type = String(token.type || "").toLowerCase();

  if (type === "color") {
    return normalizeColor(rawValue);
  }

  if (type === "number") {
    if (isBreakpointToken(segments) || isContainerToken(segments)) {
      return formatPx(rawValue);
    }
    return formatLength(rawValue);
  }

  if (type === "shadow") {
    if (rawValue && typeof rawValue === "object" && rawValue.offsetX !== undefined) {
      return `${formatLength(rawValue.offsetX)} ${formatLength(rawValue.offsetY)} ${formatLength(rawValue.blur)} ${rawValue.color}`;
    }
  }

  const lowerKey = tokenKey.toLowerCase();
  if (lowerKey.startsWith("zindex-") || lowerKey.startsWith("z-index-")) {
    return rawValue;
  }

  return formatLength(rawValue);
}

function addToken(tokens, token, tokenMap) {
  let resolved;
  if (token.aliasTargetName) {
    resolved = aliasToCssVar(token.aliasTargetName);
  } else {
    const aliasMatch =
      typeof token.value === "string" ? token.value.match(/^\{(.+)\}$/) : null;
    resolved = aliasMatch
      ? aliasToCssVar(aliasMatch[1])
      : resolveAlias(token.value, tokenMap);
  }
  const segments = token.pathSegments;

  const tokenKey = buildTokenKey(segments);
  const formattedValue = formatTokenValue(token, resolved, tokenKey, segments);
  tokens.other[tokenKey] = formattedValue;
}

function buildTokensFromList(tokenList) {
  const tokenMap = new Map();
  for (const token of tokenList) {
    const key = token.pathSegments.join(".");
    tokenMap.set(key, token);
  }

  const tokens = {
    colors: {},
    typography: {},
    spacing: {},
    radii: {},
    shadows: {},
    other: {},
    breakpoints: {},
    containers: {},
  };

  for (const token of tokenList) {
    addToken(tokens, token, tokenMap);
  }

  return tokens;
}

function normalizeOutputBase(filePath) {
  const base = path.basename(filePath).toLowerCase().replace(/\s+/g, "-");
  return base.replace(/\.jsonc?$/i, "");
}

function normalizePerFileBase(base) {
  if (base === "light-mode.tokens") return "color.light.tokens";
  if (base === "dark-mode.tokens") return "color.dark.tokens";
  return base;
}

async function extractTokens() {
  try {
    const files = await fg(EXPORT_PATTERNS, {
      cwd: REPO_ROOT,
      absolute: true,
      onlyFiles: true,
      unique: true,
    });

    if (files.length === 0) {
      throw new Error(`No token exports found in ${EXPORTS_DIR}`);
    }

    const allTokens = [];
    const perFileTokens = [];
    for (const filePath of files.sort()) {
      const data = readJsonLike(filePath);
      const tokenList = [];
      flattenTokens(data, [], tokenList);
      allTokens.push(...tokenList);
      perFileTokens.push({ filePath, tokenList });
    }

    const tokens = buildTokensFromList(allTokens);

    const cssDir = path.join(OUTPUT_DIR, "css");
    const jsonDir = path.join(OUTPUT_DIR, "json");
    const tsDir = path.join(OUTPUT_DIR, "ts");

    for (const dir of [cssDir, jsonDir, tsDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    for (const { filePath, tokenList } of perFileTokens) {
      const rawBase = normalizeOutputBase(filePath);
      const base = normalizePerFileBase(rawBase);
      const perTokens = buildTokensFromList(tokenList);
      const jsonOut = JSON.stringify(perTokens, null, 2);
      const cssOut = generateCSS(perTokens);
      const tsOut = generateTypeScript(perTokens);

      fs.writeFileSync(path.join(jsonDir, `${base}.json`), jsonOut);
      fs.writeFileSync(path.join(cssDir, `${base}.css`), cssOut);
      fs.writeFileSync(path.join(tsDir, `${base}.ts`), tsOut);

      if (rawBase !== base) {
        const oldJson = path.join(jsonDir, `${rawBase}.json`);
        const oldCss = path.join(cssDir, `${rawBase}.css`);
        const oldTs = path.join(tsDir, `${rawBase}.ts`);
        for (const oldFile of [oldJson, oldCss, oldTs]) {
          if (fs.existsSync(oldFile)) {
            fs.unlinkSync(oldFile);
          }
        }
      }
    }

    console.log("✅ Tokens generated from local exports!");
    console.log(`📁 Files created in ${path.relative(REPO_ROOT, OUTPUT_DIR)}/`);
    console.log("   - css/*.css, json/*.json, ts/*.ts (per-file files)");

    const shouldTrash =
      process.argv.includes("--trash") || process.env.npm_config_trash === "true";
    if (shouldTrash) {
      for (const filePath of files) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      console.log("🧹 Removed source exports from figma/exports");
    }
  } catch (error) {
    console.error("❌ Error extracting tokens:", error.message);
    process.exit(1);
  }
}

function generateCSS(tokens) {
  let css = `/* Auto-generated design tokens from Figma */\n/* Generated on ${new Date().toISOString()} */\n\n:root {\n`;

  Object.entries(tokens.other).forEach(([key, value]) => {
    css += `  --${key}: ${value};\n`;
  });

  css += `}\n`;
  return css;
}

function generateTypeScript(tokens) {
  return `// Auto-generated design tokens from Figma\n// Generated on ${new Date().toISOString()}\n\nexport const tokens = ${JSON.stringify(tokens, null, 2)} as const;\n\nexport type ColorToken = keyof typeof tokens.colors;\nexport type TypographyToken = keyof typeof tokens.typography;\nexport type SpacingToken = keyof typeof tokens.spacing;\nexport type RadiusToken = keyof typeof tokens.radii;\nexport type ShadowToken = keyof typeof tokens.shadows;\nexport type BreakpointToken = keyof typeof tokens.breakpoints;\nexport type ContainerToken = keyof typeof tokens.containers;\nexport type OtherToken = keyof typeof tokens.other;\n`;
}

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

if (require.main === module) {
  extractTokens();
}

module.exports = { extractTokens };
