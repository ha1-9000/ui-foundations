import fs from "fs";
import path from "path";
import fg from "fast-glob";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const exportsDir = path.join(repoRoot, "figma", "exports");
const outputDir = path.join(repoRoot, "figma", "import-ready");
const reportPath = path.join(outputDir, "cleaning-report.json");
const localCssDir = path.join(repoRoot, "dist", "tokens", "css");
const uilibSrcDir =
  process.env.UILIB_DIST_DIR || "/Users/Thomas.Bielich@tui.com/Sites/uilib-1/dist";
const componentsOutPath = path.join(outputDir, "Uilib.components.tokens.json");
const missingOutPath = path.join(outputDir, "Uilib.missing-from-figma.tokens.json");

const preferredInputs = ["Primitives.json", "Semantics.json"];

function findInputFiles() {
  if (!fs.existsSync(exportsDir)) {
    throw new Error(`Missing exports directory: ${exportsDir}`);
  }

  const allJson = fs
    .readdirSync(exportsDir)
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .sort();

  const preferred = preferredInputs.filter((name) => allJson.includes(name));
  if (preferred.length) return preferred;
  if (!allJson.length) {
    throw new Error(`No JSON exports found in ${exportsDir}`);
  }
  return allJson;
}

function readFiles(globPattern, cwd) {
  return fg.sync(globPattern, { cwd, absolute: true, onlyFiles: true });
}

function collectVarsAndValues(files) {
  const vars = new Set();
  const values = new Map();
  const re = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    let match;
    while ((match = re.exec(text)) !== null) {
      const name = match[1];
      const value = match[2].trim();
      vars.add(name);
      if (!values.has(name)) values.set(name, value);
    }
  }
  return { vars, values };
}

function normalizeRefPath(raw) {
  if (!raw || typeof raw !== "string") return null;
  return raw
    .trim()
    .replace(/^\{+|\}+$/g, "")
    .replace(/\s*\/\s*/g, ".")
    .replace(/\s+/g, " ")
    .replace(/\.+/g, ".");
}

function normalizeSegment(segment) {
  return String(segment)
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function buildWebCssVar(pathSegments) {
  const key = pathSegments
    .map((part) => normalizeSegment(part))
    .filter(Boolean)
    .join("-");
  return `--uilib-${key}`;
}

function buildTokenNameParts(pathSegments) {
  const parts = pathSegments
    .map((part) => normalizeSegment(part))
    .filter(Boolean)
    .flatMap((part) => part.split("-").filter(Boolean));
  const kebab = parts.join("-");
  const snake = kebab.replace(/-/g, "_");
  const camel = parts
    .map((part, index) =>
      index === 0 ? part : `${part.charAt(0).toUpperCase()}${part.slice(1)}`,
    )
    .join("");
  return { kebab, snake, camel };
}

function androidTypePrefix(tokenType) {
  const t = String(tokenType || "").toLowerCase();
  if (t === "color") return "R.color";
  if (t === "number" || t === "dimension" || t === "elevation") return "R.dimen";
  if (t === "motion") return "R.integer";
  return "R.string";
}

function iosTypePrefix(tokenType) {
  const t = String(tokenType || "").toLowerCase();
  if (t === "color") return "ColorToken";
  if (t === "number" || t === "dimension") return "DimensionToken";
  if (t === "elevation") return "ElevationToken";
  if (t === "motion") return "MotionToken";
  return "TypographyToken";
}

function androidRefName(snake) {
  return snake.startsWith("uilib_") ? snake : `uilib_${snake}`;
}

function buildAndroidSyntax(tokenType, names) {
  const t = String(tokenType || "").toLowerCase();
  if (t === "typography") return `UiLibTokens.Typography.${names.camel}`;
  return `${androidTypePrefix(tokenType)}.${androidRefName(names.snake)}`;
}

function buildIosSyntax(tokenType, names) {
  return `${iosTypePrefix(tokenType)}.${names.camel}`;
}

function withUilibPrefix(cssVarName) {
  const raw = String(cssVarName || "").trim().replace(/^--/, "");
  if (!raw) return "--uilib-token";
  if (raw.startsWith("uilib-")) return `--${raw}`;
  return `--uilib-${raw}`;
}

function normalizeWebSyntax(webSyntax, fallbackCssVar, stats) {
  if (typeof webSyntax !== "string" || !webSyntax.trim()) {
    stats.webSyntaxGenerated += 1;
    return `var(${fallbackCssVar})`;
  }

  const raw = webSyntax.trim();
  const varMatch = raw.match(/^var\(\s*(--[a-zA-Z0-9_-]+)\s*\)$/);
  if (varMatch) {
    const prefixed = withUilibPrefix(varMatch[1]);
    if (prefixed !== varMatch[1]) stats.webSyntaxPrefixed += 1;
    return `var(${prefixed})`;
  }

  const bareMatch = raw.match(/^(--[a-zA-Z0-9_-]+)$/);
  if (bareMatch) {
    const prefixed = withUilibPrefix(bareMatch[1]);
    stats.webSyntaxPrefixed += 1;
    return `var(${prefixed})`;
  }

  // Keep complex custom WEB syntax as-is if it cannot be parsed safely.
  return raw;
}

function normalizeCodeSyntax(codeSyntax, fallbackCssVar, tokenType, pathSegments, stats) {
  const out = {};
  let rawWeb = null;
  if (codeSyntax && typeof codeSyntax === "object") {
    for (const [key, value] of Object.entries(codeSyntax)) {
      if (typeof value !== "string" || !value.trim()) continue;
      const upper = key.toUpperCase();
      if (upper === "WEB") {
        rawWeb = value;
        continue;
      }
    }
  }
  const names = buildTokenNameParts(pathSegments);
  out.ANDROID = buildAndroidSyntax(tokenType, names);
  out.iOS = buildIosSyntax(tokenType, names);
  out.WEB = normalizeWebSyntax(rawWeb, fallbackCssVar, stats);
  stats.androidSyntaxGenerated += 1;
  stats.iosSyntaxGenerated += 1;
  return out;
}

function inferTypeFromNameAndValue(varName, rawValue) {
  const name = String(varName || "").toLowerCase();
  const value = String(rawValue || "").trim().toLowerCase();

  if (
    name.endsWith("-color") ||
    name.includes("-color-") ||
    name.endsWith("-bg") ||
    name.includes("-bg-") ||
    name.endsWith("-background") ||
    name.includes("-background-") ||
    name.endsWith("-text") ||
    name.includes("-text-") ||
    value.startsWith("#") ||
    value.startsWith("rgb(") ||
    value.startsWith("rgba(") ||
    value.startsWith("hsl(") ||
    value.startsWith("hsla(") ||
    value.includes("--uilib-color-")
  ) {
    return "color";
  }
  if (name.endsWith("-elevation") || name.includes("-elevation-")) return "elevation";
  if (
    name.endsWith("-duration") ||
    name.endsWith("-delay") ||
    name.includes("-easing-") ||
    name.includes("-duration-") ||
    name.includes("-delay-")
  ) {
    return "motion";
  }
  if (
    name.includes("font-") ||
    name.endsWith("font-family") ||
    name.endsWith("font-size") ||
    name.endsWith("font-weight") ||
    name.endsWith("line-height") ||
    name.endsWith("letter-spacing") ||
    name.includes("typography")
  ) {
    return "typography";
  }
  return "dimension";
}

function extractIconNameFromUrl(raw) {
  const str = String(raw || "").trim();
  const m = str.match(/^url\((['"]?)(.+)\1\)$/i);
  if (!m) return null;
  const cleaned = m[2].trim();
  const basename = cleaned.split("/").pop() || "";
  return basename.replace(/\.[a-z0-9]+$/i, "") || null;
}

function normalizeComponentValue(raw, tokenType) {
  if (typeof raw !== "string") return raw;
  const value = raw.trim();

  const iconName = extractIconNameFromUrl(value);
  if (iconName) return iconName;

  const remMatch = value.match(/^(-?\d*\.?\d+)rem$/i);
  if (remMatch) return Number((Number(remMatch[1]) * 16).toFixed(4));

  const pxMatch = value.match(/^(-?\d*\.?\d+)px$/i);
  if (pxMatch) return Number(pxMatch[1]);

  const motionMsMatch = value.match(/^(-?\d*\.?\d+)ms$/i);
  if (motionMsMatch && tokenType === "motion") return Number(motionMsMatch[1]);

  const motionSMatch = value.match(/^(-?\d*\.?\d+)s$/i);
  if (motionSMatch && tokenType === "motion") {
    return Number((Number(motionSMatch[1]) * 1000).toFixed(4));
  }

  return value;
}

function toTitleCaseWords(input) {
  return String(input)
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function componentLabelFromVar(cssVar) {
  const raw = String(cssVar || "").replace(/^--/, "");
  const withoutUilib = raw.startsWith("uilib-") ? raw.slice("uilib-".length) : raw;
  return toTitleCaseWords(withoutUilib);
}

function tokenNameFromCssVar(cssVar) {
  return String(cssVar || "").replace(/^--/, "");
}

function buildTokenObjectForCssVar(cssVar, rawValue) {
  const tokenName = tokenNameFromCssVar(cssVar);
  const tokenType = inferTypeFromNameAndValue(tokenName, rawValue);
  const names = buildTokenNameParts([tokenName]);
  const normalizedWebVar = withUilibPrefix(`--${tokenName}`);

  return {
    $type: tokenType,
    $value: normalizeComponentValue(rawValue, tokenType),
    $extensions: {
      "com.figma.codeSyntax": {
        WEB: `var(${normalizedWebVar})`,
        ANDROID: buildAndroidSyntax(tokenType, names),
        iOS: buildIosSyntax(tokenType, names),
      },
    },
  };
}

function writeComponentFiles(report) {
  if (!fs.existsSync(localCssDir)) {
    report.componentFiles = {
      generated: false,
      reason: `missing local css dir: ${localCssDir}`,
    };
    return;
  }
  if (!fs.existsSync(uilibSrcDir)) {
    report.componentFiles = {
      generated: false,
      reason: `missing uilib dist dir: ${uilibSrcDir}`,
    };
    return;
  }

  const localFiles = readFiles(["**/*.css"], localCssDir);
  const uilibFiles = readFiles(["**/*.{css,scss}"], uilibSrcDir);
  const localData = collectVarsAndValues(localFiles);
  const uilibData = collectVarsAndValues(uilibFiles);

  const missingInFigma = [...uilibData.vars].filter((v) => !localData.vars.has(v)).sort();
  const componentsOnly = missingInFigma.filter((v) => v.startsWith("--uilib-"));

  const componentsOut = {};
  for (const cssVar of componentsOnly) {
    const label = componentLabelFromVar(cssVar);
    const rawValue = uilibData.values.get(cssVar) || "";
    componentsOut[label] = buildTokenObjectForCssVar(cssVar, rawValue);
  }

  const missingOut = {};
  for (const cssVar of missingInFigma) {
    const label = componentLabelFromVar(cssVar);
    const rawValue = uilibData.values.get(cssVar) || "";
    missingOut[label] = buildTokenObjectForCssVar(cssVar, rawValue);
  }

  fs.writeFileSync(componentsOutPath, `${JSON.stringify(componentsOut, null, 2)}\n`);
  fs.writeFileSync(missingOutPath, `${JSON.stringify(missingOut, null, 2)}\n`);

  report.componentFiles = {
    generated: true,
    localCssDir,
    uilibSrcDir,
    localFiles: localFiles.length,
    uilibFiles: uilibFiles.length,
    missingInFigma: missingInFigma.length,
    componentsGenerated: componentsOnly.length,
    outputs: {
      components: componentsOutPath,
      missingFromFigma: missingOutPath,
    },
  };
}

function cleanTokenNode(node, pathSegments, stats) {
  const cleaned = {};
  if (typeof node.$type === "string") cleaned.$type = node.$type;
  if (typeof node.$description === "string" && node.$description.trim()) {
    cleaned.$description = node.$description.trim();
  }

  const aliasData =
    node.$extensions &&
    node.$extensions["com.figma.aliasData"] &&
    typeof node.$extensions["com.figma.aliasData"] === "object"
      ? node.$extensions["com.figma.aliasData"]
      : null;

  const aliasRef = aliasData ? normalizeRefPath(aliasData.targetVariableName) : null;

  if (aliasRef) {
    // Figma import is more robust with concrete values than DTCG $ref objects.
    stats.aliasesConverted += 1;
  }

  if (node.$type === "color" && node.$value && typeof node.$value === "object") {
    if (typeof node.$value.hex === "string") {
      cleaned.$value = node.$value.hex;
      stats.colorObjectsFlattened += 1;
    } else {
      cleaned.$value = node.$value;
    }
  } else {
    cleaned.$value = node.$value;
  }

  if (node.$extensions) {
    stats.extensionsRemoved += 1;
  }

  const fallbackWebCssVar = buildWebCssVar(pathSegments);
  const codeSyntax =
    node.$extensions &&
    node.$extensions["com.figma.codeSyntax"] &&
    typeof node.$extensions["com.figma.codeSyntax"] === "object"
      ? normalizeCodeSyntax(
          node.$extensions["com.figma.codeSyntax"],
          fallbackWebCssVar,
          node.$type,
          pathSegments,
          stats,
        )
      : normalizeCodeSyntax(null, fallbackWebCssVar, node.$type, pathSegments, stats);
  cleaned.$extensions = {
    "com.figma.codeSyntax": codeSyntax,
  };
  stats.syntaxKept += 1;
  if (codeSyntax.WEB) stats.webSyntaxKept += 1;
  if (codeSyntax.ANDROID) stats.androidSyntaxKept += 1;
  if (codeSyntax.iOS) stats.iosSyntaxKept += 1;

  return cleaned;
}

function walkAndClean(node, pathSegments, stats) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return node;

  const isToken = "$type" in node && "$value" in node;
  if (isToken) {
    stats.tokensSeen += 1;
    return cleanTokenNode(node, pathSegments, stats);
  }

  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    out[key] = walkAndClean(value, [...pathSegments, key], stats);
  }
  return out;
}

function toFigmaStrict(node) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return node;

  const isToken = "$type" in node && "$value" in node;
  if (isToken) {
    const out = {
      $type: node.$type,
      $value: node.$value,
    };
    if (typeof node.$description === "string" && node.$description.trim()) {
      out.$description = node.$description.trim();
    }
    return out;
  }

  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    out[key] = toFigmaStrict(value);
  }
  return out;
}

function hexToColorObject(hex) {
  if (typeof hex !== "string") return null;
  const m = hex.trim().match(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
  if (!m) return null;
  const raw = m[1];
  const hasAlpha = raw.length === 8;
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  const a = hasAlpha ? parseInt(raw.slice(6, 8), 16) / 255 : 1;
  return {
    colorSpace: "srgb",
    components: [r, g, b],
    alpha: a,
    hex: `#${raw.toUpperCase()}`,
  };
}

function toFigmaNativeValue(type, value) {
  if (type !== "color") return value;

  if (value && typeof value === "object" && !Array.isArray(value)) {
    if (Array.isArray(value.components) && value.components.length >= 3) {
      return {
        colorSpace: typeof value.colorSpace === "string" ? value.colorSpace : "srgb",
        components: [Number(value.components[0]), Number(value.components[1]), Number(value.components[2])],
        alpha: typeof value.alpha === "number" ? value.alpha : 1,
        ...(typeof value.hex === "string" ? { hex: value.hex } : {}),
      };
    }
    if (typeof value.hex === "string") {
      const converted = hexToColorObject(value.hex);
      if (converted) return converted;
    }
  }

  if (typeof value === "string") {
    const converted = hexToColorObject(value);
    if (converted) return converted;
  }

  return value;
}

function toFigmaNative(node, options = {}) {
  const keepCodeSyntax = Boolean(options.keepCodeSyntax);
  if (!node || typeof node !== "object" || Array.isArray(node)) return node;

  const isToken = "$type" in node && "$value" in node;
  if (isToken) {
    const out = {
      $type: node.$type,
      $value: toFigmaNativeValue(node.$type, node.$value),
    };
    if (typeof node.$description === "string" && node.$description.trim()) {
      out.$description = node.$description.trim();
    }
    if (
      keepCodeSyntax &&
      node.$extensions &&
      node.$extensions["com.figma.codeSyntax"] &&
      typeof node.$extensions["com.figma.codeSyntax"] === "object"
    ) {
      out.$extensions = {
        "com.figma.codeSyntax": node.$extensions["com.figma.codeSyntax"],
      };
    }
    return out;
  }

  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    out[key] = toFigmaNative(value, options);
  }
  return out;
}

function filterByType(node, allowedTypes) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return null;

  const isToken = "$type" in node && "$value" in node;
  if (isToken) {
    return allowedTypes.has(node.$type) ? node : null;
  }

  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    const filtered = filterByType(value, allowedTypes);
    if (filtered && typeof filtered === "object") {
      if ("$type" in filtered || Object.keys(filtered).length > 0) {
        out[key] = filtered;
      }
    }
  }
  return out;
}

function main() {
  const files = findInputFiles();
  fs.mkdirSync(outputDir, { recursive: true });

  const report = {
    createdAt: new Date().toISOString(),
    inputDir: exportsDir,
    outputDir,
    files: [],
    totals: {
      tokensSeen: 0,
      extensionsRemoved: 0,
      aliasesConverted: 0,
      colorObjectsFlattened: 0,
      syntaxKept: 0,
      webSyntaxKept: 0,
      androidSyntaxKept: 0,
      iosSyntaxKept: 0,
      webSyntaxGenerated: 0,
      webSyntaxPrefixed: 0,
      androidSyntaxGenerated: 0,
      iosSyntaxGenerated: 0,
    },
  };

  for (const fileName of files) {
    const inputPath = path.join(exportsDir, fileName);
    const raw = fs.readFileSync(inputPath, "utf8");
    const parsed = JSON.parse(raw);

    const stats = {
      tokensSeen: 0,
      extensionsRemoved: 0,
      aliasesConverted: 0,
      colorObjectsFlattened: 0,
      syntaxKept: 0,
      webSyntaxKept: 0,
      androidSyntaxKept: 0,
      iosSyntaxKept: 0,
      webSyntaxGenerated: 0,
      webSyntaxPrefixed: 0,
      androidSyntaxGenerated: 0,
      iosSyntaxGenerated: 0,
    };
    const cleaned = walkAndClean(parsed, [], stats);

    const outputName = fileName.replace(/\.json$/i, ".cleaned.tokens.json");
    const outputPath = path.join(outputDir, outputName);
    fs.writeFileSync(outputPath, `${JSON.stringify(cleaned, null, 2)}\n`);

    const strict = toFigmaStrict(cleaned);
    const strictOutputName = fileName.replace(/\.json$/i, ".figma.tokens.json");
    const strictOutputPath = path.join(outputDir, strictOutputName);
    fs.writeFileSync(strictOutputPath, `${JSON.stringify(strict, null, 2)}\n`);

    const native = toFigmaNative(cleaned);
    const nativeOutputName = fileName.replace(/\.json$/i, ".figma.native.tokens.json");
    const nativeOutputPath = path.join(outputDir, nativeOutputName);
    fs.writeFileSync(nativeOutputPath, `${JSON.stringify(native, null, 2)}\n`);

    const nativeWithCodeSyntax = toFigmaNative(cleaned, { keepCodeSyntax: true });
    const nativeWithCodeSyntaxOutputName = fileName.replace(
      /\.json$/i,
      ".figma.native.codesyntax.tokens.json",
    );
    const nativeWithCodeSyntaxOutputPath = path.join(
      outputDir,
      nativeWithCodeSyntaxOutputName,
    );
    fs.writeFileSync(
      nativeWithCodeSyntaxOutputPath,
      `${JSON.stringify(nativeWithCodeSyntax, null, 2)}\n`,
    );

    const colorsOnly = filterByType(strict, new Set(["color"])) || {};
    const colorsOutputName = fileName.replace(/\.json$/i, ".colors.figma.tokens.json");
    const colorsOutputPath = path.join(outputDir, colorsOutputName);
    fs.writeFileSync(colorsOutputPath, `${JSON.stringify(colorsOnly, null, 2)}\n`);

    report.files.push({
      input: inputPath,
      output: outputPath,
      strictOutput: strictOutputPath,
      nativeOutput: nativeOutputPath,
      nativeWithCodeSyntaxOutput: nativeWithCodeSyntaxOutputPath,
      colorsOutput: colorsOutputPath,
      ...stats,
    });
    report.totals.tokensSeen += stats.tokensSeen;
    report.totals.extensionsRemoved += stats.extensionsRemoved;
    report.totals.aliasesConverted += stats.aliasesConverted;
    report.totals.colorObjectsFlattened += stats.colorObjectsFlattened;
    report.totals.syntaxKept += stats.syntaxKept;
    report.totals.webSyntaxKept += stats.webSyntaxKept;
    report.totals.androidSyntaxKept += stats.androidSyntaxKept;
    report.totals.iosSyntaxKept += stats.iosSyntaxKept;
    report.totals.webSyntaxGenerated += stats.webSyntaxGenerated;
    report.totals.webSyntaxPrefixed += stats.webSyntaxPrefixed;
    report.totals.androidSyntaxGenerated += stats.androidSyntaxGenerated;
    report.totals.iosSyntaxGenerated += stats.iosSyntaxGenerated;
  }

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  writeComponentFiles(report);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log("✅ Cleaned token files for Figma import");
  for (const entry of report.files) {
    console.log(`- ${path.basename(entry.output)} (tokens: ${entry.tokensSeen})`);
    console.log(`- ${path.basename(entry.strictOutput)} (figma-strict)`);
    console.log(`- ${path.basename(entry.nativeOutput)} (figma-native-color)`);
    console.log(
      `- ${path.basename(entry.nativeWithCodeSyntaxOutput)} (figma-native-color+codesyntax)`,
    );
    console.log(`- ${path.basename(entry.colorsOutput)} (colors-only)`);
  }
  console.log(`📄 Report: ${reportPath}`);
  if (report.componentFiles && report.componentFiles.generated) {
    console.log(`- ${path.basename(componentsOutPath)} (tokens: ${report.componentFiles.componentsGenerated})`);
    console.log(`- ${path.basename(missingOutPath)} (tokens: ${report.componentFiles.missingInFigma})`);
  } else {
    console.log("ℹ️ Skipped component file generation");
  }
}

main();
