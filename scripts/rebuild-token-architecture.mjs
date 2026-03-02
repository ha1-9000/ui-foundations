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
    out.$extensions = {
      "com.figma.codeSyntax": node.$extensions["com.figma.codeSyntax"],
    };
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
