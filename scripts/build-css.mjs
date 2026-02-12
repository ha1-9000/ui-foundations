import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(REPO_ROOT, "dist");
const DIST_TOKENS_DIR = path.join(DIST_DIR, "tokens", "css");

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

function extractRootBody(cssText) {
  const match = cssText.match(/:root\s*\{([\s\S]*?)\}/);
  return match ? match[1].trim() : "";
}

function writeModeCssWithDarkTokens() {
  const modePath = path.join(DIST_DIR, "core", "themes", "mode.css");
  const darkTokensPath = path.join(DIST_TOKENS_DIR, "color.dark.tokens.css");
  if (!fs.existsSync(modePath) || !fs.existsSync(darkTokensPath)) return;

  const baseModeCss = fs.readFileSync(modePath, "utf8").trimEnd();
  const darkBody = extractRootBody(fs.readFileSync(darkTokensPath, "utf8"));
  if (!darkBody) return;

  const darkModeBlock = [
    "",
    "@layer themes {",
    "  @media (prefers-color-scheme: dark) {",
    "    :root:not([data-mode]) {",
    darkBody
      .split("\n")
      .map((line) => `      ${line.trim()}`)
      .join("\n"),
    "    }",
    "  }",
    "",
    '  :root[data-mode="dark"] {',
    darkBody
      .split("\n")
      .map((line) => `    ${line.trim()}`)
      .join("\n"),
    "  }",
    "}",
    "",
  ].join("\n");

  writeFile(modePath, `${baseModeCss}\n${darkModeBlock}`);
}

function buildCoreBundle() {
  copyDir(path.join(REPO_ROOT, "src", "core"), path.join(DIST_DIR, "core"));
  // Remove legacy derived files to keep dist/tokens/css clean.
  for (const legacyName of ["color.tokens.css", "color.modes.css"]) {
    const legacyPath = path.join(DIST_TOKENS_DIR, legacyName);
    if (fs.existsSync(legacyPath)) fs.unlinkSync(legacyPath);
  }
  const tokenImports = [
    "core.tokens.css",
    "color.light.tokens.css",
    "semantic.tokens.css",
    "component.tokens.css",
  ]
    .filter((fileName) => fs.existsSync(path.join(DIST_TOKENS_DIR, fileName)))
    .map((fileName) => `@import url("../tokens/css/${fileName}") layer(tokens);`);

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
  writeModeCssWithDarkTokens();
}

function buildUiBundle() {
  copyDir(path.join(REPO_ROOT, "src", "ui"), path.join(DIST_DIR, "ui"));
}

function buildReactBundle() {
  copyDir(path.join(REPO_ROOT, "src", "react"), path.join(DIST_DIR, "react"));
}

function buildDocs() {
  buildCoreBundle();
  buildUiBundle();
  buildReactBundle();
  const coreCss = inlineImports(path.join(DIST_DIR, "core", "index.css"));
  const uiCss = inlineImports(path.join(DIST_DIR, "ui", "index.css"));
  writeFile(path.join(DIST_DIR, "main.css"), `${coreCss}\n${uiCss}`);
  console.log("✅ Dist bundles generated in dist/");
}

buildDocs();
