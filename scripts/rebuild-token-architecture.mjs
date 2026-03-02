import fs from "fs";
import path from "path";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const exportsDir = path.join(repoRoot, "figma", "exports");
const outDir = path.join(repoRoot, "figma", "cleaned");

const sourceFileCandidates = {
  primitives: ["Primitives.tokens.json", "Primitives.json"],
  semantics: ["Semantics.tokens.json", "Semantics.json"],
  components: ["Components.tokens.json", "Uilib.components.tokens.json"],
};

const moveFromComponentsToPrimitives = new Set([
  "Aspect",
  "Border",
  "Breakpoints",
  "Color",
  "Elevation",
  "Font",
  "Grid",
  "Layer",
  "Layout",
  "Line",
  "Media",
  "Motion",
  "Spacing",
  "Stroke",
  "Theme",
]);

const moveFromComponentsToSemantics = new Set(["Typography"]);

function findSourceFile(candidates) {
  for (const file of candidates) {
    const full = path.join(exportsDir, file);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isTokenNode(node) {
  return Boolean(node && typeof node === "object" && "$type" in node && "$value" in node);
}

function cloneTokenNode(node) {
  const out = {
    $type: node.$type,
    $value: node.$value,
  };
  if (typeof node.$description === "string" && node.$description.trim()) {
    out.$description = node.$description.trim();
  }
  if (
    node.$extensions &&
    node.$extensions["com.figma.codeSyntax"] &&
    typeof node.$extensions["com.figma.codeSyntax"] === "object"
  ) {
    const normalizedCodeSyntax = normalizeCodeSyntax(node.$type, node.$extensions["com.figma.codeSyntax"]);
    out.$extensions = {
      "com.figma.codeSyntax": normalizedCodeSyntax,
    };
  }
  return out;
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function dedupeLeadingRepeatedChunk(parts) {
  if (!Array.isArray(parts) || parts.length < 2) return parts;
  const maxK = Math.floor(parts.length / 2);
  for (let k = maxK; k >= 1; k -= 1) {
    const first = parts.slice(0, k);
    const second = parts.slice(k, 2 * k);
    if (arraysEqual(first, second)) {
      return [...first, ...parts.slice(2 * k)];
    }
  }
  return parts;
}

function normalizeColorVarName(name) {
  if (typeof name !== "string") return name;
  const lower = name.toLowerCase();
  const webPrefix = "--uilib-color-";
  const androidPrefix = "uilib_color_";

  if (lower.startsWith(webPrefix)) {
    const suffix = name.slice(webPrefix.length);
    const parts = suffix.split("-").filter(Boolean);
    const deduped = dedupeLeadingRepeatedChunk(parts);
    return `${webPrefix}${deduped.join("-")}`;
  }

  if (lower.startsWith(androidPrefix)) {
    const suffix = name.slice(androidPrefix.length);
    const parts = suffix.split("_").filter(Boolean);
    const deduped = dedupeLeadingRepeatedChunk(parts);
    return `${androidPrefix}${deduped.join("_")}`;
  }

  return name;
}

function splitCamelWords(input) {
  if (typeof input !== "string" || !input) return [];
  const matches = input.match(/[A-Z]?[a-z]+|[A-Z]+(?![a-z])|\d+/g);
  return matches || [input];
}

function toCamel(words) {
  if (!words.length) return "";
  const normalized = words.map((w) => String(w));
  const first = normalized[0].charAt(0).toLowerCase() + normalized[0].slice(1);
  const rest = normalized.slice(1).map((w) => {
    if (/^\d+$/.test(w)) return w;
    return w.charAt(0).toUpperCase() + w.slice(1);
  });
  return [first, ...rest].join("");
}

function normalizeColorIosRef(ref) {
  if (typeof ref !== "string") return ref;
  const prefix = "ColorToken.";
  if (!ref.startsWith(prefix)) return ref;
  const token = ref.slice(prefix.length);
  const words = splitCamelWords(token);
  if (words.length < 3) return ref;
  const [first, ...rest] = words;
  const dedupedRest = dedupeLeadingRepeatedChunk(rest);
  return `${prefix}${toCamel([first, ...dedupedRest])}`;
}

function normalizeCodeSyntax(tokenType, codeSyntax) {
  if (!codeSyntax || typeof codeSyntax !== "object") return codeSyntax;
  const out = { ...codeSyntax };
  if (String(tokenType).toLowerCase() !== "color") return out;

  if (typeof out.WEB === "string") {
    const m = out.WEB.match(/^var\(\s*(--[a-zA-Z0-9_-]+)\s*\)$/);
    if (m) {
      out.WEB = `var(${normalizeColorVarName(m[1])})`;
    }
  }

  if (typeof out.ANDROID === "string") {
    const m = out.ANDROID.match(/^R\.color\.(uilib_color_[a-zA-Z0-9_]+)$/);
    if (m) {
      out.ANDROID = `R.color.${normalizeColorVarName(m[1])}`;
    }
  }

  if (typeof out.iOS === "string") {
    out.iOS = normalizeColorIosRef(out.iOS);
  }

  return out;
}

function walkTokens(node, pathSegs, visitor) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return;
  if (isTokenNode(node)) {
    visitor(pathSegs, node);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    walkTokens(value, [...pathSegs, key], visitor);
  }
}

function ensureParent(root, pathSegs) {
  let cur = root;
  for (let i = 0; i < pathSegs.length - 1; i += 1) {
    const seg = pathSegs[i];
    if (!cur[seg] || typeof cur[seg] !== "object" || Array.isArray(cur[seg])) {
      cur[seg] = {};
    }
    cur = cur[seg];
  }
  return cur;
}

function normalizeRefPath(raw) {
  if (!raw || typeof raw !== "string") return null;
  return raw
    .trim()
    .replace(/^\{+|\}+$/g, "")
    .replace(/\s*\/\s*/g, ".")
    .replace(/\.+/g, ".")
    .trim();
}

function tokenCanonicalId(pathSegs, tokenNode) {
  const webSyntax =
    tokenNode.$extensions &&
    tokenNode.$extensions["com.figma.codeSyntax"] &&
    tokenNode.$extensions["com.figma.codeSyntax"].WEB;
  if (typeof webSyntax === "string" && webSyntax.trim()) {
    return `web:${webSyntax.trim().toLowerCase()}`;
  }
  const aliasName =
    tokenNode.$extensions &&
    tokenNode.$extensions["com.figma.aliasData"] &&
    tokenNode.$extensions["com.figma.aliasData"].targetVariableName;
  const aliasPath = normalizeRefPath(aliasName);
  if (aliasPath) return `alias:${aliasPath.toLowerCase()}`;
  return `path:${pathSegs.join(".").toLowerCase()}`;
}

function hasSameToken(existing, next) {
  return JSON.stringify(existing) === JSON.stringify(next);
}

function routeComponentPath(pathSegs) {
  const top = pathSegs[0];
  if (moveFromComponentsToPrimitives.has(top)) return "primitives";
  if (moveFromComponentsToSemantics.has(top)) return "semantics";
  return "components";
}

function findPrimitiveSpacingTargets(primitivesRoot) {
  const byWeb = new Map();
  const byNumberValue = new Map();

  const spacingRoot = primitivesRoot.Spacing;
  if (!spacingRoot || typeof spacingRoot !== "object") {
    return { byWeb, byNumberValue };
  }

  walkTokens(spacingRoot, ["Spacing"], (pathSegs, token) => {
    if (token.$type !== "number") return;
    const web =
      token.$extensions &&
      token.$extensions["com.figma.codeSyntax"] &&
      token.$extensions["com.figma.codeSyntax"].WEB;
    if (typeof web === "string" && web.trim()) {
      byWeb.set(web.trim().toLowerCase(), pathSegs.join("."));
    }
    const valueKey = String(token.$value);
    if (!byNumberValue.has(valueKey)) byNumberValue.set(valueKey, pathSegs.join("."));
  });

  return { byWeb, byNumberValue };
}

function aliasSemanticSpacingToPrimitives(semanticsRoot, primitivesRoot, stats) {
  const semSpacing = semanticsRoot.Spacing;
  if (!semSpacing || typeof semSpacing !== "object") return;

  const targets = findPrimitiveSpacingTargets(primitivesRoot);

  walkTokens(semSpacing, ["Spacing"], (pathSegs, token) => {
    if (token.$type !== "number") return;
    if (token.$value && typeof token.$value === "object" && "$ref" in token.$value) return;

    const semWeb =
      token.$extensions &&
      token.$extensions["com.figma.codeSyntax"] &&
      token.$extensions["com.figma.codeSyntax"].WEB;

    let targetRef = null;
    if (typeof semWeb === "string" && semWeb.trim()) {
      targetRef = targets.byWeb.get(semWeb.trim().toLowerCase()) || null;
    }
    if (!targetRef) {
      targetRef = targets.byNumberValue.get(String(token.$value)) || null;
    }
    if (!targetRef) return;

    token.$value = { $ref: targetRef };
    stats.aliasing.semanticSpacingAliases += 1;
  });
}

function main() {
  const primitivePath = findSourceFile(sourceFileCandidates.primitives);
  const semanticPath = findSourceFile(sourceFileCandidates.semantics);
  const componentPath = findSourceFile(sourceFileCandidates.components);

  if (!primitivePath || !semanticPath || !componentPath) {
    throw new Error(
      `Missing source files in ${exportsDir}. Found: ${JSON.stringify({
        primitivePath,
        semanticPath,
        componentPath,
      })}`,
    );
  }

  const primitiveSrc = readJson(primitivePath);
  const semanticSrc = readJson(semanticPath);
  const componentSrc = readJson(componentPath);

  const out = {
    primitives: {},
    semantics: {},
    components: {},
  };

  const idsByLayer = {
    primitives: new Set(),
    semantics: new Set(),
    components: new Set(),
  };

  const stats = {
    primitives: { kept: 0, duplicatesSkipped: 0 },
    semantics: { kept: 0, duplicatesSkipped: 0 },
    components: { kept: 0, duplicatesSkipped: 0 },
    movedFromComponents: {
      toPrimitives: 0,
      toSemantics: 0,
      keptInComponents: 0,
    },
    sourceTokens: {
      primitives: 0,
      semantics: 0,
      components: 0,
    },
    aliasing: {
      semanticSpacingAliases: 0,
    },
  };

  function insertToken(layer, pathSegs, rawToken) {
    const token = cloneTokenNode(rawToken);
    const canonical = tokenCanonicalId(pathSegs, rawToken);
    if (idsByLayer[layer].has(canonical)) {
      stats[layer].duplicatesSkipped += 1;
      return;
    }
    const parent = ensureParent(out[layer], pathSegs);
    const key = pathSegs[pathSegs.length - 1];
    if (key in parent) {
      if (hasSameToken(parent[key], token)) {
        stats[layer].duplicatesSkipped += 1;
        return;
      }
      // Keep first write to avoid hidden overrides.
      stats[layer].duplicatesSkipped += 1;
      return;
    }
    parent[key] = token;
    idsByLayer[layer].add(canonical);
    stats[layer].kept += 1;
  }

  walkTokens(primitiveSrc, [], (pathSegs, token) => {
    stats.sourceTokens.primitives += 1;
    insertToken("primitives", pathSegs, token);
  });

  walkTokens(semanticSrc, [], (pathSegs, token) => {
    stats.sourceTokens.semantics += 1;
    insertToken("semantics", pathSegs, token);
  });

  walkTokens(componentSrc, [], (pathSegs, token) => {
    stats.sourceTokens.components += 1;
    const route = routeComponentPath(pathSegs);
    if (route === "primitives") stats.movedFromComponents.toPrimitives += 1;
    if (route === "semantics") stats.movedFromComponents.toSemantics += 1;
    if (route === "components") stats.movedFromComponents.keptInComponents += 1;
    insertToken(route, pathSegs, token);
  });

  aliasSemanticSpacingToPrimitives(out.semantics, out.primitives, stats);

  fs.mkdirSync(outDir, { recursive: true });

  const primitiveOut = path.join(outDir, "Primitives.cleaned.tokens.json");
  const semanticOut = path.join(outDir, "Semantics.cleaned.tokens.json");
  const componentOut = path.join(outDir, "Components.cleaned.tokens.json");
  const reportOut = path.join(outDir, "architecture-cleaning-report.json");

  fs.writeFileSync(primitiveOut, `${JSON.stringify(out.primitives, null, 2)}\n`);
  fs.writeFileSync(semanticOut, `${JSON.stringify(out.semantics, null, 2)}\n`);
  fs.writeFileSync(componentOut, `${JSON.stringify(out.components, null, 2)}\n`);

  const report = {
    createdAt: new Date().toISOString(),
    input: {
      primitives: primitivePath,
      semantics: semanticPath,
      components: componentPath,
    },
    output: {
      primitives: primitiveOut,
      semantics: semanticOut,
      components: componentOut,
    },
    stats,
    routingRules: {
      movedFromComponentsToPrimitives: [...moveFromComponentsToPrimitives],
      movedFromComponentsToSemantics: [...moveFromComponentsToSemantics],
    },
  };
  fs.writeFileSync(reportOut, `${JSON.stringify(report, null, 2)}\n`);

  console.log("✅ Rebuilt token architecture");
  console.log(`- Primitives: ${primitiveOut}`);
  console.log(`- Semantics: ${semanticOut}`);
  console.log(`- Components: ${componentOut}`);
  console.log(`- Report: ${reportOut}`);
  console.log(
    `- Moved from components -> primitives: ${stats.movedFromComponents.toPrimitives}, semantics: ${stats.movedFromComponents.toSemantics}, kept: ${stats.movedFromComponents.keptInComponents}`,
  );
}

main();
