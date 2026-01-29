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
const EXPORTS_DIR = path.join(REPO_ROOT, "src", "figma-exports");
const OUTPUT_DIR = path.join(REPO_ROOT, "dist", "tokens");

const EXPORT_PATTERNS = [
  "src/figma-exports/**/*.token.json",
  "src/figma-exports/**/*.tokens.json",
  "src/figma-exports/**/*.token.jsonc",
  "src/figma-exports/**/*.tokens.jsonc",
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

function getTypographyField(segments) {
  const fieldMap = {
    "font family": "fontFamily",
    "font size": "fontSize",
    "font weight": "fontWeight",
    "font style": "fontWeight",
    "line height": "lineHeight",
  };

  for (let i = 0; i < segments.length; i += 1) {
    const normalized = String(segments[i]).toLowerCase().trim();
    if (fieldMap[normalized]) {
      return { field: fieldMap[normalized], index: i };
    }
  }

  return null;
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

function isSpacingPath(segments) {
  return segments.some((segment) => {
    const lower = String(segment).toLowerCase();
    return (
      lower === "space" || lower === "spacing" || lower.includes("spacing")
    );
  });
}

function isRadiusPath(segments) {
  return segments.some((segment) => {
    const lower = String(segment).toLowerCase();
    return (
      lower.includes("radius") ||
      lower.includes("corner") ||
      lower.includes("radii")
    );
  });
}

function isShadowPath(segments) {
  return segments.some((segment) =>
    String(segment).toLowerCase().includes("shadow"),
  );
}

function buildTokenKey(segments) {
  return toKebabCase(segments.join("-"));
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
  const type = String(token.type || "").toLowerCase();
  const segments = token.pathSegments;

  // Breakpoint/Container must be classified before numeric buckets
  if (isBreakpointToken(segments) && segments[1] !== undefined) {
    const label = mapStepToSizeLabel(segments[1]);
    tokens.breakpoints[label] = resolved;
    return;
  }

  if (isContainerToken(segments) && segments[1] !== undefined) {
    const label = mapStepToSizeLabel(segments[1]);
    tokens.containers[label] = resolved;
    return;
  }

  const typographyField = getTypographyField(segments);
  if (typographyField) {
    const { field, index } = typographyField;
    let nameSegments = [];

    if (index < segments.length - 1) {
      nameSegments = segments.slice(index + 1);
    } else {
      nameSegments = segments.slice(0, index);
    }

    if (nameSegments[0] && nameSegments[0].toLowerCase() === "typography") {
      nameSegments = nameSegments.slice(1);
    }

    const tokenKey = toKebabCase(nameSegments.join("-") || "typography");
    const entry = tokens.typography[tokenKey] || {};
    entry[field] = resolved;
    tokens.typography[tokenKey] = entry;
    return;
  }

  if (type === "color") {
    tokens.colors[buildTokenKey(segments)] = normalizeColor(resolved);
    return;
  }

  if (isSpacingPath(segments)) {
    tokens.spacing[buildTokenKey(segments)] = resolved;
    return;
  }

  if (isRadiusPath(segments)) {
    tokens.radii[buildTokenKey(segments)] = resolved;
    return;
  }

  if (isShadowPath(segments)) {
    tokens.shadows[buildTokenKey(segments)] = resolved;
    return;
  }

  tokens.other[buildTokenKey(segments)] = resolved;
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
      const base = normalizeOutputBase(filePath);
      const perTokens = buildTokensFromList(tokenList);
      const jsonOut = JSON.stringify(perTokens, null, 2);
      const cssOut = generateCSS(perTokens);
      const tsOut = generateTypeScript(perTokens);

      fs.writeFileSync(path.join(jsonDir, `${base}.json`), jsonOut);
      fs.writeFileSync(path.join(cssDir, `${base}.css`), cssOut);
      fs.writeFileSync(path.join(tsDir, `${base}.ts`), tsOut);

    }

    console.log("✅ Tokens generated from local exports!");
    console.log(`📁 Files created in ${path.relative(REPO_ROOT, OUTPUT_DIR)}/`);
    console.log("   - css/*.css, json/*.json, ts/*.ts (per-file files)");
  } catch (error) {
    console.error("❌ Error extracting tokens:", error.message);
    process.exit(1);
  }
}

function generateCSS(tokens) {
  let css = `/* Auto-generated design tokens from Figma */\n/* Generated on ${new Date().toISOString()} */\n\n:root {\n`;

  Object.entries(tokens.colors).forEach(([key, value]) => {
    css += `  --color-${key}: ${value};\n`;
  });

  Object.entries(tokens.typography).forEach(([key, value]) => {
    if (value.fontFamily !== undefined) {
      css += `  --typography-${key}-font-family: ${value.fontFamily};\n`;
    }
    if (value.fontSize !== undefined) {
      css += `  --typography-${key}-font-size: ${formatLength(value.fontSize)};\n`;
    }
    if (value.fontWeight !== undefined) {
      css += `  --typography-${key}-font-weight: ${value.fontWeight};\n`;
    }
    if (value.lineHeight !== undefined) {
      css += `  --typography-${key}-line-height: ${formatLength(value.lineHeight)};\n`;
    }
  });

  Object.entries(tokens.spacing).forEach(([key, value]) => {
    css += `  --space-${key}: ${formatLength(value)};\n`;
  });

  Object.entries(tokens.radii).forEach(([key, value]) => {
    css += `  --radius-${key}: ${formatLength(value)};\n`;
  });

  Object.entries(tokens.shadows).forEach(([key, value]) => {
    if (value && typeof value === "object" && value.offsetX !== undefined) {
      css += `  --shadow-${key}: ${formatLength(value.offsetX)} ${formatLength(value.offsetY)} ${formatLength(value.blur)} ${value.color};\n`;
    } else {
      css += `  --shadow-${key}: ${value};\n`;
    }
  });

  Object.entries(tokens.breakpoints).forEach(([key, value]) => {
    css += `  --breakpoint-${key}: ${formatPx(value)};\n`;
  });

  Object.entries(tokens.containers).forEach(([key, value]) => {
    css += `  --container-${key}: ${formatPx(value)};\n`;
  });

  Object.entries(tokens.other).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    const isZIndex =
      lowerKey.startsWith("zindex-") || lowerKey.startsWith("z-index-");
    const formatted = isZIndex ? value : formatLength(value);
    css += `  --${key}: ${formatted};\n`;
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
