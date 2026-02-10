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

function ensureColorTokens() {
  const colorTokensPath = path.join(DIST_TOKENS_DIR, "color.tokens.css");
  if (fs.existsSync(colorTokensPath)) return;
  const lightPath = path.join(DIST_TOKENS_DIR, "color.light.tokens.css");
  const darkPath = path.join(DIST_TOKENS_DIR, "color.dark.tokens.css");
  const content = `${fs.readFileSync(lightPath, "utf8")}\n${fs.readFileSync(darkPath, "utf8")}\n`;
  writeFile(colorTokensPath, content);
}

function ensureColorModes() {
  const lightPath = path.join(DIST_TOKENS_DIR, "color.light.tokens.css");
  const darkPath = path.join(DIST_TOKENS_DIR, "color.dark.tokens.css");
  const modesPath = path.join(DIST_TOKENS_DIR, "color.modes.css");

  const lightCss = fs.readFileSync(lightPath, "utf8");
  const darkCss = fs.readFileSync(darkPath, "utf8");

  const lightBody = extractRootBody(lightCss);
  const darkBody = extractRootBody(darkCss);
  if (lightBody && darkBody) {
    writeFile(
      modesPath,
      [
        ':root[data-mode="light"] {',
        lightBody,
        "}",
        "",
        ':root[data-mode="dark"] {',
        darkBody,
        "}",
        "",
      ].join("\n"),
    );
  }
}

function buildCoreBundle() {
  ensureColorTokens();
  ensureColorModes();
  copyDir(path.join(REPO_ROOT, "src", "core"), path.join(DIST_DIR, "core"));
  writeFile(
    path.join(DIST_DIR, "core", "index.css"),
    [
      '@import url("./base/reset.css") layer(reset);',
      '@import url("./base/fonts.css") layer(base);',
      '@import url("./base/base.css") layer(base);',
      '@import url("./base/typography.css") layer(base);',
      '@import url("../tokens/css/core.tokens.css") layer(tokens);',
      '@import url("../tokens/css/color.modes.css") layer(tokens);',
      '@import url("../tokens/css/semantic.tokens.css") layer(tokens);',
      '@import url("../tokens/css/component.tokens.css") layer(tokens);',
      '@import url("./themes/mode.css") layer(themes);',
      "",
    ].join("\n"),
  );
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
