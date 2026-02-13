import fs from "fs";
import path from "path";
import fg from "fast-glob";
import { parse } from "jsonc-parser";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(REPO_ROOT, "dist");
const DIST_TOKENS_DIR = path.join(DIST_DIR, "tokens", "css");
const EXPORT_PATTERNS = [
  "figma/exports/**/*.token.json",
  "figma/exports/**/*.tokens.json",
  "figma/exports/**/*.token.jsonc",
  "figma/exports/**/*.tokens.jsonc",
];

function copyDir(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function inlineImports(filePath, seen = new Set()) {
  if (seen.has(filePath)) return "";
  seen.add(filePath);

  const baseDir = path.dirname(filePath);
  const css = fs.readFileSync(filePath, "utf8");

  return css.replace(
    /@import\s+url\(["']([^"']+)["']\)\s*layer\([^)]+\);\s*/g,
    (match, importPath) => {
      if (importPath.startsWith("http")) return match;
      const resolved = path.resolve(baseDir, importPath);
      if (!fs.existsSync(resolved)) return match;
      return inlineImports(resolved, seen);
    },
  );
}

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

function slugifyName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function inferBucketFromFilename(filename) {
  const baseName = path.basename(filename);
  const stem = baseName
    .replace(/\.(token|tokens)\.jsonc?$/i, "")
    .replace(/\.jsonc?$/i, "")
    .trim();

  let match = stem.match(/^brand\s+(.+)$/i);
  if (match) {
    const rest = match[1].trim();
    if (/^[a-z]$/i.test(rest)) {
      return { bucket: "brand", id: rest.toLowerCase(), stem };
    }
    return { bucket: "brand", id: slugifyName(rest), stem };
  }

  match = stem.match(/^mode\s+(.+)$/i);
  if (match) {
    return { bucket: "mode", id: slugifyName(match[1]), stem };
  }

  // Backward-compatible fallback for legacy "Light Mode"/"Dark Mode" naming.
  match = stem.match(/^(.+)\s+mode$/i);
  if (match) {
    return { bucket: "mode", id: slugifyName(match[1]), stem };
  }

  return { bucket: "other", id: slugifyName(stem), stem };
}

function parseWebSyntax(web) {
  const raw = String(web || "").trim();
  if (!raw) return { name: null, ref: null, error: "empty WEB syntax" };

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

function normalizeVariableId(raw) {
  if (!raw) return null;
  return String(raw).split("/")[0].trim() || null;
}

function normalizeTokenPath(raw) {
  return String(raw || "")
    .trim()
    .replace(/^\{|\}$/g, "")
    .replace(/\./g, "/")
    .replace(/\/+/g, "/");
}

function toKebabCase(str) {
  return String(str || "")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .replace(/^-|-$/g, "");
}

function buildTokenKey(segments) {
  return toKebabCase(segments.join("-"));
}

function isTokenNode(node) {
  return (
    node && typeof node === "object" && "$type" in node && "$value" in node
  );
}

function flattenTokens(node, pathSegments, list, source, orderRef) {
  if (!node || typeof node !== "object") return;

  if (isTokenNode(node)) {
    const aliasData =
      node.$extensions &&
      node.$extensions["com.figma.aliasData"] &&
      typeof node.$extensions["com.figma.aliasData"] === "object"
        ? node.$extensions["com.figma.aliasData"]
        : null;
    const webSyntax = node.$extensions?.["com.figma.codeSyntax"]?.WEB
      ? String(node.$extensions["com.figma.codeSyntax"].WEB)
      : null;
    const valueRef =
      node.$value && typeof node.$value === "object" && node.$value.$ref
        ? normalizeTokenPath(node.$value.$ref)
        : null;
    const stringAliasMatch =
      typeof node.$value === "string" ? node.$value.match(/^\{(.+)\}$/) : null;

    list.push({
      pathSegments,
      path: pathSegments.join("/"),
      pathKey: pathSegments.join("."),
      type: node.$type,
      value: node.$value,
      source,
      order: orderRef.value++,
      variableId: normalizeVariableId(
        node.$extensions?.["com.figma.variableId"],
      ),
      aliasTargetId: aliasData
        ? normalizeVariableId(aliasData.targetVariableId)
        : null,
      aliasTargetName: aliasData
        ? normalizeTokenPath(aliasData.targetVariableName)
        : null,
      aliasRefPath:
        valueRef ||
        (stringAliasMatch ? normalizeTokenPath(stringAliasMatch[1]) : null),
      webSyntax,
      cssVarName: null,
      cssVarRef: null,
    });
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    flattenTokens(value, [...pathSegments, key], list, source, orderRef);
  }
}

function assignCssVars(tokens, report) {
  const seenByScope = new Map();

  for (const token of tokens) {
    const fallback = `--${buildTokenKey(token.pathSegments)}`;

    if (!token.webSyntax) {
      report.missingWeb.push(token.path);
      token.cssVarName = fallback;
      token.cssVarRef = `var(${fallback})`;
    } else {
      const parsed = parseWebSyntax(token.webSyntax);
      if (parsed.error || !parsed.name) {
        report.invalidWeb.push(`${token.path}: ${parsed.error}`);
        token.cssVarName = fallback;
        token.cssVarRef = `var(${fallback})`;
      } else {
        token.cssVarName = parsed.name;
        token.cssVarRef = parsed.ref;
      }
    }

    const scopeKey = `${token.source.bucket}:${token.source.id}`;
    if (!seenByScope.has(scopeKey)) {
      seenByScope.set(scopeKey, new Map());
    }

    const map = seenByScope.get(scopeKey);
    const existing = map.get(token.cssVarName);
    if (existing && existing !== token.path) {
      report.duplicates.push({
        scope: scopeKey,
        name: token.cssVarName,
        winner: token.path,
        dropped: existing,
      });
    }
    map.set(token.cssVarName, token.path);
  }
}

function createTokenLookup(tokens) {
  const byPath = new Map();
  const byId = new Map();

  for (const token of tokens) {
    const pathValue = normalizeTokenPath(token.path);
    byPath.set(pathValue, token);
    byPath.set(pathValue.toLowerCase(), token);

    const dotValue = normalizeTokenPath(token.pathKey);
    byPath.set(dotValue, token);
    byPath.set(dotValue.toLowerCase(), token);

    if (token.variableId) {
      byId.set(normalizeVariableId(token.variableId), token);
    }
  }

  return { byPath, byId };
}

function lookupAliasTarget(token, lookup) {
  if (token.aliasTargetId) {
    const byId = lookup.byId.get(normalizeVariableId(token.aliasTargetId));
    if (byId) return byId;
  }

  const candidates = [token.aliasTargetName, token.aliasRefPath]
    .filter(Boolean)
    .map((entry) => normalizeTokenPath(entry));

  for (const candidate of candidates) {
    const match =
      lookup.byPath.get(candidate) ||
      lookup.byPath.get(candidate.toLowerCase());
    if (match) return match;
  }

  return null;
}

function aliasFallbackFromPath(pathName) {
  const key = toKebabCase(String(pathName || "").replace(/[/.]/g, "-"));
  return `var(--${key})`;
}

function resolveAliasCssRef(token, lookup, report) {
  const target = lookupAliasTarget(token, lookup);
  if (!target) {
    report.missingAliasTargets.push(token.path);
    return null;
  }

  if (target === token) {
    report.aliasCycles.push(token.path);
    return null;
  }

  const startRef = token.variableId || token.path;
  let current = target;
  const seen = new Set([startRef]);
  while (current) {
    const currentRef = current.variableId || current.path;
    if (seen.has(currentRef)) {
      report.aliasCycles.push(token.path);
      return null;
    }
    seen.add(currentRef);
    if (
      !(
        current.aliasTargetId ||
        current.aliasTargetName ||
        current.aliasRefPath
      )
    ) {
      break;
    }
    current = lookupAliasTarget(current, lookup);
    if (!current) break;
  }

  if (target.cssVarRef) return target.cssVarRef;
  if (target.cssVarName) return `var(${target.cssVarName})`;
  return aliasFallbackFromPath(target.path);
}

function isBreakpointToken(segments) {
  return String(segments[0] || "").toLowerCase() === "breakpoint";
}

function isContainerToken(segments) {
  return String(segments[0] || "").toLowerCase() === "container";
}

function isLayoutColumnsToken(segments) {
  return (
    String(segments[0] || "").toLowerCase() === "layout" &&
    String(segments[1] || "").toLowerCase() === "columns"
  );
}

function isLayoutPxToken(segments) {
  if (String(segments[0] || "").toLowerCase() !== "layout") return false;
  const second = String(segments[1] || "").toLowerCase();
  return (
    second.includes("max width") ||
    second.includes("column max width") ||
    second.includes("breakpoint")
  );
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

function normalizeColor(value) {
  if (typeof value === "string") return value;
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

function toNumericFontWeight(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (/^\d{1,4}$/.test(trimmed)) {
    return Number(trimmed);
  }

  const normalized = trimmed.toLowerCase().replace(/[\s_]+/g, "-");
  const map = {
    thin: 100,
    "extra-light": 200,
    light: 300,
    normal: 400,
    regular: 400,
    medium: 500,
    "semi-bold": 600,
    bold: 700,
    "extra-bold": 800,
    black: 900,
  };
  return map[normalized] ?? null;
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

function toRem(px) {
  return formatRemValue(px / 16);
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

function formatPx(value) {
  if (typeof value === "number") return `${value}px`;
  return value;
}

function isFontWeightPath(segments) {
  const joined = segments.join(".").toLowerCase();
  return (
    joined.startsWith("font.weight") ||
    joined.endsWith(".font weight") ||
    joined.includes(".font.weight")
  );
}

function formatTokenValue(token, rawValue, tokenKey, segments) {
  const type = String(token.type || "").toLowerCase();
  const lowerKey = tokenKey.toLowerCase();

  if (type === "color") {
    return normalizeColor(rawValue);
  }

  if (isFontWeightPath(segments)) {
    const mapped = toNumericFontWeight(rawValue);
    if (mapped !== null) return mapped;
  }

  if (type === "number") {
    if (lowerKey.startsWith("zindex-") || lowerKey.startsWith("z-index-")) {
      return rawValue;
    }
    if (isLayoutColumnsToken(segments)) {
      return rawValue;
    }
    if (isLayoutPxToken(segments)) {
      return formatPx(rawValue);
    }
    if (isBreakpointToken(segments) || isContainerToken(segments)) {
      return formatPx(rawValue);
    }
    return formatLength(rawValue);
  }

  if (lowerKey.startsWith("zindex-") || lowerKey.startsWith("z-index-")) {
    return rawValue;
  }

  return formatLength(rawValue);
}

function selectorForScope(scope) {
  if (scope.bucket === "brand") {
    return `:root[data-brand="${scope.id}"]`;
  }

  if (scope.bucket === "mode") {
    if (scope.id === "light") return ":root";
    if (scope.id === "dark") return ':root[data-mode="dark"]';
    return `:root[data-mode="${scope.id}"]`;
  }

  return ":root";
}

function fileNameForScope(scope) {
  if (scope.bucket === "brand") {
    return `brand.${scope.id}.tokens.css`;
  }

  if (scope.bucket === "mode") {
    if (scope.id === "light") return "color.light.tokens.css";
    if (scope.id === "dark") return "color.dark.tokens.css";
    return `mode.${scope.id}.tokens.css`;
  }

  const id = scope.id;
  if (["primitives", "core", "core-primitives"].includes(id))
    return "core.tokens.css";
  if (id.includes("semantic")) return "semantic.tokens.css";
  if (id.includes("component")) return "component.tokens.css";
  return `${id}.tokens.css`;
}

function scopePriority(scope) {
  if (scope.bucket === "other" && scope.id === "core") return 0;
  if (scope.bucket === "other" && scope.id === "core-primitives") return 0;
  if (scope.bucket === "other" && scope.id === "primitives") return 0;
  if (scope.bucket === "brand") return 1;
  if (scope.bucket === "other" && scope.id.includes("semantic")) return 2;
  if (scope.bucket === "other" && scope.id.includes("component")) return 3;
  if (scope.bucket === "mode" && scope.id === "light") return 4;
  if (scope.bucket === "mode" && scope.id === "dark") return 5;
  return 9;
}

function sortByScopePriority(scopedFiles) {
  return scopedFiles.sort((a, b) => {
    const p = scopePriority(a.scope) - scopePriority(b.scope);
    if (p !== 0) return p;
    return a.fileName.localeCompare(b.fileName);
  });
}

function clearGeneratedTokenCss(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  for (const entry of fs.readdirSync(dirPath)) {
    const full = path.join(dirPath, entry);
    if (!fs.statSync(full).isFile()) continue;
    if (/\.tokens\.css$/i.test(entry)) {
      fs.unlinkSync(full);
    }
  }
}

async function generateScopedTokenCssFromExports() {
  const files = await fg(EXPORT_PATTERNS, {
    cwd: REPO_ROOT,
    absolute: true,
    onlyFiles: true,
    unique: true,
  });

  if (files.length === 0) {
    throw new Error("No token exports found in figma/exports");
  }

  const report = {
    missingWeb: [],
    invalidWeb: [],
    duplicates: [],
    missingAliasTargets: [],
    aliasCycles: [],
  };

  const allTokens = [];
  const orderRef = { value: 0 };

  for (const filePath of files.sort()) {
    const scope = inferBucketFromFilename(filePath);
    const source = {
      filePath,
      fileName: path.basename(filePath),
      bucket: scope.bucket,
      id: scope.id || "default",
      stem: scope.stem,
      scopeKey: `${scope.bucket}:${scope.id || "default"}`,
    };
    const data = readJsonLike(filePath);
    flattenTokens(data, [], allTokens, source, orderRef);
  }

  assignCssVars(allTokens, report);
  const lookup = createTokenLookup(allTokens);

  const scopedDecls = new Map();
  for (const token of allTokens) {
    const key = token.source.scopeKey;
    if (!scopedDecls.has(key)) {
      scopedDecls.set(key, {
        scope: token.source,
        declarations: new Map(),
      });
    }

    let value = token.value;
    if (token.aliasTargetId || token.aliasTargetName || token.aliasRefPath) {
      const aliasRef = resolveAliasCssRef(token, lookup, report);
      if (aliasRef) {
        value = aliasRef;
      }
    }

    if (!String(value).startsWith("var(--")) {
      value = formatTokenValue(
        token,
        value,
        buildTokenKey(token.pathSegments),
        token.pathSegments,
      );
    }

    scopedDecls.get(key).declarations.set(token.cssVarName, value);
  }

  const lightScope = scopedDecls.get("mode:light");
  const darkScope = scopedDecls.get("mode:dark");
  if (lightScope && darkScope) {
    const filtered = new Map();
    for (const [name, value] of darkScope.declarations.entries()) {
      if (
        !lightScope.declarations.has(name) ||
        lightScope.declarations.get(name) !== value
      ) {
        filtered.set(name, value);
      }
    }
    darkScope.declarations = filtered;
  }

  fs.mkdirSync(DIST_TOKENS_DIR, { recursive: true });
  clearGeneratedTokenCss(DIST_TOKENS_DIR);

  const scopedFiles = [];
  for (const { scope, declarations } of scopedDecls.values()) {
    const selector = selectorForScope(scope);
    const fileName = fileNameForScope(scope);
    const lines = [
      "/* Auto-generated design tokens from Figma exports */",
      `/* Source scope: ${scope.bucket}/${scope.id} */`,
      `/* Generated on ${new Date().toISOString()} */`,
      "",
      `${selector} {`,
    ];

    for (const [name, value] of declarations.entries()) {
      lines.push(`  ${name}: ${value};`);
    }
    lines.push("}", "");

    const css = `${lines.join("\n")}`;
    if (css.includes("var(var(--")) {
      report.invalidWeb.push(`Nested var() detected in ${fileName}`);
    }

    writeFile(path.join(DIST_TOKENS_DIR, fileName), css);
    scopedFiles.push({ fileName, scope });
  }

  const sanityToken = allTokens.find(
    (token) => token.path === "Breakpoint/100",
  );
  if (sanityToken && sanityToken.cssVarName !== "--breakpoint-100") {
    console.warn(
      `⚠️ Sanity check failed: Breakpoint/100 cssVarName is ${sanityToken.cssVarName}`,
    );
  }

  console.log("⚛️  Scoped token CSS generated from figma/exports");
  console.log(`   • ${scopedFiles.length} files`);

  return sortByScopePriority(scopedFiles);
}

function writeModeCssBaseline() {
  const modePath = path.join(DIST_DIR, "core", "themes", "mode.css");
  if (!fs.existsSync(modePath)) return;

  writeFile(
    modePath,
    [
      "@layer themes {",
      "  :root {",
      "    color-scheme: light dark;",
      "  }",
      "}",
      "",
    ].join("\n"),
  );
}

function buildCoreBundle(scopedTokenFiles) {
  copyDir(path.join(REPO_ROOT, "src", "core"), path.join(DIST_DIR, "core"));

  const tokenImports = scopedTokenFiles
    .filter((entry) =>
      fs.existsSync(path.join(DIST_TOKENS_DIR, entry.fileName)),
    )
    .map(
      (entry) =>
        `@import url("../tokens/css/${entry.fileName}") layer(tokens);`,
    );

  writeFile(
    path.join(DIST_DIR, "core", "index.css"),
    [
      '@import url("./base/reset.css") layer(reset);',
      '@import url("./base/fonts.css") layer(base);',
      '@import url("./base/base.css") layer(base);',
      '@import url("./base/typography.css") layer(base);',
      ...tokenImports,
      '@import url("./themes/mode.css") layer(themes);',
      "",
    ].join("\n"),
  );

  writeModeCssBaseline();
}

function buildUiBundle() {
  copyDir(path.join(REPO_ROOT, "src", "ui"), path.join(DIST_DIR, "ui"));
}

function buildReactBundle() {
  copyDir(path.join(REPO_ROOT, "src", "react"), path.join(DIST_DIR, "react"));
}

async function buildDocs() {
  const scopedTokenFiles = await generateScopedTokenCssFromExports();
  buildCoreBundle(scopedTokenFiles);
  buildUiBundle();
  buildReactBundle();
  const coreCss = inlineImports(path.join(DIST_DIR, "core", "index.css"));
  const uiCss = inlineImports(path.join(DIST_DIR, "ui", "index.css"));
  writeFile(path.join(DIST_DIR, "main.css"), `${coreCss}\n${uiCss}`);
  console.log("✅ Dist bundles generated in dist/");
}

buildDocs().catch((error) => {
  console.error("❌ Error building CSS bundles:", error.message);
  process.exit(1);
});
