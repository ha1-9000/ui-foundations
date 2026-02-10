import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

const DIST_CSS_DIR = path.join(REPO_ROOT, "dist", "tokens", "css");
const EXAMPLES_CSS_DIR = path.join(REPO_ROOT, "examples", "css");
const EXAMPLES_TOKENS_DIR = path.join(EXAMPLES_CSS_DIR, "tokens");

const GENERATED_AT = new Date().toISOString();

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function extractVarLines(blockBody) {
  return blockBody
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("--"));
}

function normalizeVarLine(line) {
  const trimmed = line.trim();
  return trimmed.endsWith(";") ? trimmed : `${trimmed};`;
}

function buildRootBlock(varLines, indentLevel = 0) {
  const indent = " ".repeat(indentLevel);
  const innerIndent = `${indent}  `;
  const lines = varLines.map(normalizeVarLine);
  return [
    `${indent}:root {`,
    ...lines.map((line) => `${innerIndent}${line}`),
    `${indent}}`,
  ].join("\n");
}

function buildLayeredFile(varLines, { includeHeader = true } = {}) {
  const header = includeHeader
    ? [
        "  /* Auto-generated design tokens from Figma */",
        `  /* Generated on ${GENERATED_AT} */`,
        "",
      ].join("\n")
    : "";
  const rootBlock = buildRootBlock(varLines, 2);
  const headerBlock = header ? `${header}\n` : "";
  return `@layer tokens {\n${headerBlock}${rootBlock}\n}\n`;
}

function buildLayeredBlocks(blocks, { includeHeader = true } = {}) {
  const header = includeHeader
    ? [
        "  /* Auto-generated design tokens from Figma */",
        `  /* Generated on ${GENERATED_AT} */`,
        "",
      ].join("\n")
    : "";
  const headerBlock = header ? `${header}\n` : "";
  const body = blocks.join("\n");
  return `@layer tokens {\n${headerBlock}${body}\n}\n`;
}

function parseVarNames(varLines) {
  return varLines
    .map((line) => line.match(/^--([^:]+):/))
    .filter(Boolean)
    .map((match) => match[1]);
}

function buildCoreAliases(varNames) {
  const aliases = [];
  const existing = new Set(varNames);
  for (const name of varNames) {
    if (name.startsWith("space-")) {
      const alias = name.startsWith("space-size-")
        ? `size-${name.slice("space-size-".length)}`
        : `size-${name.slice("space-".length)}`;
      if (!existing.has(alias)) {
        aliases.push(`--${alias}: var(--${name});`);
      }
    }
    if (name.startsWith("radius-")) {
      const alias = name.startsWith("radius-size-")
        ? `size-${name.slice("radius-size-".length)}`
        : `size-${name.slice("radius-".length)}`;
      if (!existing.has(alias)) {
        aliases.push(`--${alias}: var(--${name});`);
      }
    }
  }
  return aliases;
}

function renameSemanticVarLines(varLines) {
  return varLines.map((line) => {
    const match = line.match(/^--([^:]+):\s*(.+);?$/);
    if (!match) return line;
    const name = match[1];
    let value = match[2].replace(/;+$/, "").trim();
    value = value
      .replace(/var\(--brand-/g, "var(--color-brand-")
      .replace(/var\(--neutral-/g, "var(--color-neutral-")
      .replace(/var\(--overlay-/g, "var(--color-overlay-");
    if (name.startsWith("color-color-")) {
      const renamed = `color-${name.slice("color-color-".length)}`;
      return `--${renamed}: ${value};`;
    }
    return `--${name}: ${value};`;
  });
}

function buildColorAliases(varNames) {
  return [];
}

function buildComponentAliases(varNames) {
  const aliases = [];
  const existing = new Set(varNames);
  const map = new Map([
    [
      "button-solid-container-background-default",
      "color-button-solid-container-background-default",
    ],
    [
      "button-solid-container-border-color-default",
      "color-button-solid-border-color-default",
    ],
    ["button-solid-label-text-color-default", "color-button-solid-text-color"],
    [
      "button-outline-container-background-default",
      "color-button-outline-container-background-default",
    ],
    [
      "button-outline-container-border-color-default",
      "color-button-outline-border-color-default",
    ],
    [
      "button-outline-label-text-color-default",
      "color-button-outline-text-color",
    ],
  ]);

  for (const [alias, source] of map.entries()) {
    if (existing.has(source) && !existing.has(alias)) {
      aliases.push(`--${alias}: var(--${source});`);
    }
  }

  return aliases;
}

function extractRootBlocks(cssText) {
  const blocks = [];
  const regex = /:root\s*\{([\s\S]*?)\}/g;
  let match;
  while ((match = regex.exec(cssText)) !== null) {
    blocks.push({
      index: match.index,
      full: match[0],
      body: match[1],
      indent: match[0].match(/^\s*/)[0].length,
    });
  }
  return blocks;
}

function injectAliasesIntoFirstVarsRoot(cssText, aliasLines) {
  const blocks = extractRootBlocks(cssText);
  const target = blocks.find((block) => extractVarLines(block.body).length > 0);
  if (!target || aliasLines.length === 0) return cssText;

  const existingVars = extractVarLines(target.body);
  const updatedRoot = buildRootBlock(
    [...existingVars, ...aliasLines],
    target.indent,
  );

  return [
    cssText.slice(0, target.index),
    updatedRoot,
    cssText.slice(target.index + target.full.length),
  ].join("");
}

function extractColorVarsFromModes(cssText) {
  const blocks = extractRootBlocks(cssText);
  const varBlocks = blocks
    .map((block) => extractVarLines(block.body))
    .filter((lines) => lines.length > 0);
  return {
    light: varBlocks[0] || [],
    dark: varBlocks[1] || [],
  };
}

function buildExamplesTokens() {
  const coreCss = readFile(path.join(DIST_CSS_DIR, "core.tokens.css"));
  const coreVars = extractVarLines(
    coreCss.match(/:root\s*\{([\s\S]*?)\}/)?.[1] || "",
  );
  const coreAliases = buildCoreAliases(parseVarNames(coreVars));
  writeFile(
    path.join(EXAMPLES_TOKENS_DIR, "core.css"),
    buildLayeredFile([...coreVars, ...coreAliases]),
  );

  const semanticCss = readFile(path.join(DIST_CSS_DIR, "semantic.tokens.css"));
  const semanticVars = extractVarLines(
    semanticCss.match(/:root\s*\{([\s\S]*?)\}/)?.[1] || "",
  );
  const semanticRenamed = renameSemanticVarLines(semanticVars);
  writeFile(
    path.join(EXAMPLES_TOKENS_DIR, "semantic.css"),
    buildLayeredFile(semanticRenamed),
  );

  const componentCss = readFile(
    path.join(DIST_CSS_DIR, "component.tokens.css"),
  );
  const componentVars = extractVarLines(
    componentCss.match(/:root\s*\{([\s\S]*?)\}/)?.[1] || "",
  );
  const componentAliases = buildComponentAliases(parseVarNames(componentVars));
  writeFile(
    path.join(EXAMPLES_TOKENS_DIR, "components.css"),
    buildLayeredFile([...componentAliases, ...componentVars]),
  );

  const colorModesCss = readFile(path.join(DIST_CSS_DIR, "color.tokens.css"));
  const { light, dark } = extractColorVarsFromModes(colorModesCss);
  const colorAliases = buildColorAliases(parseVarNames(light));
  const lightVars = [...light, ...colorAliases];
  const darkVars = [...dark, ...colorAliases];

  const lightBlocks = [
    buildRootBlock(lightVars, 2).replace(":root", ':root[data-mode="light"]'),
  ];
  writeFile(
    path.join(EXAMPLES_TOKENS_DIR, "color.light.css"),
    buildLayeredBlocks(lightBlocks),
  );

  const darkBlocks = [
    buildRootBlock(darkVars, 2).replace(":root", ':root[data-mode="dark"]'),
  ];
  writeFile(
    path.join(EXAMPLES_TOKENS_DIR, "color.dark.css"),
    buildLayeredBlocks(darkBlocks),
  );

  const deprecatedModesPath = path.join(EXAMPLES_TOKENS_DIR, "color.modes.css");
  if (fs.existsSync(deprecatedModesPath)) {
    fs.unlinkSync(deprecatedModesPath);
  }
}

function buildExamplesIndex() {
  const imports = [
    '@import url("./base/reset.css") layer(reset);',
    '@import url("./base/base.css") layer(base);',
    '@import url("./base/typography.css") layer(base);',
    '@import url("./tokens/core.css") layer(tokens);',
    '@import url("./tokens/color.light.css") layer(tokens);',
    '@import url("./tokens/color.dark.css") layer(tokens);',
    '@import url("./tokens/semantic.css") layer(tokens);',
    '@import url("./tokens/components.css") layer(tokens);',
    '@import url("./themes/mode.css") layer(themes);',
    '@import url("./recipes/layout.css") layer(components);',
    '@import url("./patterns/button.css") layer(components);',
  ];

  const content = `${imports.join("\n")}\n`;
  writeFile(path.join(EXAMPLES_CSS_DIR, "index.css"), content);
}

function buildExamples() {
  buildExamplesTokens();
  buildExamplesIndex();
  console.log("✅ Examples CSS generated in examples/css/");
}

buildExamples();
