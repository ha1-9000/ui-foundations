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

function extractCssVarFromWebSyntax(webSyntax) {
  const raw = String(webSyntax || "").trim();
  if (!raw) {
    return { name: null, ref: null, error: "empty WEB syntax" };
  }

  let name = null;

  if (raw.startsWith("var(")) {
    const match = raw.match(/var\(([^)]+)\)/);
    if (match && match[1]) {
      name = match[1].trim();
    }
  } else if (raw.includes("--")) {
    const index = raw.indexOf("--");
    name = raw.slice(index).trim();
  } else {
    name = `--${toKebabCase(raw)}`;
  }

  if (!name || !name.startsWith("--") || name.includes(")")) {
    return { name: null, ref: null, error: `invalid WEB syntax: ${raw}` };
  }

  return { name, ref: `var(${name})`, error: null };
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
    const webSyntax =
      node.$extensions &&
      node.$extensions["com.figma.codeSyntax"] &&
      node.$extensions["com.figma.codeSyntax"].WEB
        ? String(node.$extensions["com.figma.codeSyntax"].WEB)
        : null;
    list.push({
      pathSegments,
      type: node.$type,
      value: node.$value,
      aliasTargetName,
      webSyntax,
      cssVar: null,
      cssVarRef: null,
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

function getAliasRef(aliasKey, tokenMap) {
  const target = tokenMap.get(aliasKey);
  if (target && target.cssVar) {
    return `var(${target.cssVar})`;
  }
  return aliasToCssVar(aliasKey);
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
  let resolved = token.value;
  if (token.aliasTargetName) {
    const aliasKey = normalizeAliasKey(token.aliasTargetName);
    resolved = getAliasRef(aliasKey, tokenMap);
  } else {
    const aliasMatch =
      typeof token.value === "string" ? token.value.match(/^\{(.+)\}$/) : null;
    if (aliasMatch) {
      const aliasKey = normalizeAliasKey(aliasMatch[1]);
      resolved = getAliasRef(aliasKey, tokenMap);
    }
  }
  const segments = token.pathSegments;

  const tokenKey = buildTokenKey(segments);
  const formattedValue = formatTokenValue(token, resolved, tokenKey, segments);
  const category = String(segments[0] || "").toLowerCase();
  const prefix = String(token.cssVar || "").toLowerCase();

  if (category === "color" || prefix.startsWith("--color-")) {
    tokens.colors[token.cssVar] = formattedValue;
    return;
  }

  if (
    category === "typography" ||
    prefix.startsWith("--typography-") ||
    prefix.startsWith("--font-") ||
    prefix.startsWith("--line-height-") ||
    prefix.startsWith("--letter-spacing-")
  ) {
    tokens.typography[token.cssVar] = formattedValue;
    return;
  }

  if (
    category === "spacing" ||
    category === "space" ||
    prefix.startsWith("--spacing-") ||
    prefix.startsWith("--space-") ||
    prefix.startsWith("--size-spacing-")
  ) {
    tokens.spacing[token.cssVar] = formattedValue;
    return;
  }

  if (
    category === "radius" ||
    category === "corner" ||
    prefix.startsWith("--radius-") ||
    prefix.startsWith("--corner-") ||
    prefix.startsWith("--size-radius-")
  ) {
    tokens.radii[token.cssVar] = formattedValue;
    return;
  }

  if (category === "shadow" || prefix.startsWith("--shadow-")) {
    tokens.shadows[token.cssVar] = formattedValue;
    return;
  }

  if (category === "breakpoint" || prefix.startsWith("--breakpoint-")) {
    tokens.breakpoints[token.cssVar] = formattedValue;
    return;
  }

  if (category === "container" || prefix.startsWith("--container-")) {
    tokens.containers[token.cssVar] = formattedValue;
    return;
  }

  tokens.other[token.cssVar] = formattedValue;
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

function assignCssVars(tokenList, report) {
  const seen = new Map();
  for (const token of tokenList) {
    const fallback = `--${buildTokenKey(token.pathSegments)}`;
    if (!token.webSyntax) {
      report.missingWeb.push(token.pathSegments.join("/"));
      token.cssVar = fallback;
      token.cssVarRef = `var(${fallback})`;
    } else {
      const parsed = extractCssVarFromWebSyntax(token.webSyntax);
      if (parsed.error || !parsed.name) {
        report.invalidWeb.push(
          `${token.pathSegments.join("/")}: ${parsed.error}`,
        );
        token.cssVar = fallback;
        token.cssVarRef = `var(${fallback})`;
      } else {
        token.cssVar = parsed.name;
        token.cssVarRef = parsed.ref;
      }
    }

    const currentPath = token.pathSegments.join("/");
    const existing = seen.get(token.cssVar);
    if (existing && existing !== currentPath) {
      report.duplicates.push({
        name: token.cssVar,
        first: existing,
        duplicate: currentPath,
      });
    } else if (!existing) {
      seen.set(token.cssVar, currentPath);
    }
  }
}

function normalizeOutputBase(filePath) {
  const base = path.basename(filePath).toLowerCase().replace(/\s+/g, "-");
  return base.replace(/\.jsonc?$/i, "");
}

function normalizePerFileBase(base) {
  if (base === "light-mode.tokens") return "color.light.tokens";
  if (base === "dark-mode.tokens") return "color.dark.tokens";
  if (base === "color-light.tokens") return "color.light.tokens";
  if (base === "color-dark.tokens") return "color.dark.tokens";
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

    const report = { missingWeb: [], invalidWeb: [], duplicates: [] };
    assignCssVars(allTokens, report);
    for (const entry of perFileTokens) {
      assignCssVars(entry.tokenList, report);
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

    const sanityToken = allTokens.find(
      (token) => token.pathSegments.join("/") === "Breakpoint/100",
    );
    if (sanityToken && sanityToken.cssVar !== "--breakpoint-100") {
      console.warn(
        `⚠️ Sanity check failed: Breakpoint/100 cssVar is ${sanityToken.cssVar}`,
      );
    }

    if (report.missingWeb.length > 0) {
      console.warn("⚠️ Tokens missing codeSyntax.WEB (fallback applied):");
      report.missingWeb.forEach((entry) => console.warn(`  - ${entry}`));
    }
    if (report.invalidWeb.length > 0) {
      console.warn("⚠️ Tokens with invalid codeSyntax.WEB (fallback applied):");
      report.invalidWeb.forEach((entry) => console.warn(`  - ${entry}`));
    }
    if (report.duplicates.length > 0) {
      console.warn("⚠️ Duplicate cssVar names detected:");
      report.duplicates.forEach((entry) =>
        console.warn(
          `  - ${entry.name} (${entry.first}) duplicated by ${entry.duplicate}`,
        ),
      );
    }

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

  const merged = {
    ...tokens.colors,
    ...tokens.typography,
    ...tokens.spacing,
    ...tokens.radii,
    ...tokens.shadows,
    ...tokens.breakpoints,
    ...tokens.containers,
    ...tokens.other,
  };

  Object.entries(merged).forEach(([key, value]) => {
    css += `  ${key}: ${value};\n`;
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
