const {
  toKebabCase,
  normalizeVariableId,
  normalizeTokenPath,
} = require("./extract-tokens.utils.js");

function aliasToCssVar(pathName) {
  const key = toKebabCase(String(pathName || "").replace(/[/.]/g, "-"));
  return `var(--${key})`;
}

function createTokenLookup(tokenList) {
  const byPath = new Map();
  const byId = new Map();

  for (const token of tokenList) {
    const normalizedPath = normalizeTokenPath(token.path);
    byPath.set(normalizedPath, token);
    byPath.set(normalizedPath.toLowerCase(), token);
    byPath.set(normalizeTokenPath(token.pathKey), token);
    byPath.set(normalizeTokenPath(token.pathKey).toLowerCase(), token);
    if (token.variableId) {
      byId.set(normalizeVariableId(token.variableId), token);
    }
  }

  return { byPath, byId };
}

function lookupAliasTarget(token, lookup) {
  const byId = lookup.byId;
  const byPath = lookup.byPath;

  if (token.aliasTargetId) {
    const idMatch = byId.get(normalizeVariableId(token.aliasTargetId));
    if (idMatch) return idMatch;
  }

  const pathCandidates = [token.aliasTargetName, token.aliasRefPath]
    .filter(Boolean)
    .map((entry) => normalizeTokenPath(entry));

  for (const candidate of pathCandidates) {
    const direct = byPath.get(candidate) || byPath.get(candidate.toLowerCase());
    if (direct) return direct;
  }

  return null;
}

function resolveAliasRef(token, lookup, report = null) {
  const target = lookupAliasTarget(token, lookup);
  if (!target) {
    if (report) {
      report.missingAliasTargets.push(token.path);
    }
    return null;
  }

  const startRef = token.variableId || token.path;
  let current = target;
  const seen = new Set([startRef]);
  while (current) {
    const currentRef = current.variableId || current.path;
    if (seen.has(currentRef)) {
      if (report) {
        report.aliasCycles.push(token.path);
      }
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
  if (target.cssVar) return `var(${target.cssVar})`;
  return aliasToCssVar(target.path);
}

module.exports = {
  createTokenLookup,
  resolveAliasRef,
};
