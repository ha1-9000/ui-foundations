import fs from "fs";
import path from "path";
import fg from "fast-glob";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const localCssDir = path.join(repoRoot, "dist", "tokens", "css");
const uilibSrcDir = "/tmp/uilib/src";
const outputPath = path.join(repoRoot, "mapping-report.md");

function readFiles(globPattern, cwd) {
  return fg.sync(globPattern, { cwd, absolute: true, onlyFiles: true });
}

function extractVarsFromText(text) {
  const vars = new Set();
  const re = /--[a-zA-Z0-9_-]+/g;
  let match;
  while ((match = re.exec(text))) {
    vars.add(match[0]);
  }
  return vars;
}

function collectVars(files) {
  const vars = new Set();
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const v of extractVarsFromText(text)) vars.add(v);
  }
  return vars;
}

function tokenize(name) {
  return name
    .replace(/^--/, "")
    .toLowerCase()
    .split(/[-_]+/)
    .filter(Boolean);
}

function groupForVar(name) {
  const lower = name.toLowerCase();
  if (
    lower.startsWith("--color-") ||
    lower.startsWith("--brand-color-") ||
    lower.includes("-color-")
  )
    return "colors";
  if (
    lower.startsWith("--typography-") ||
    lower.startsWith("--font-") ||
    lower.startsWith("--line-height-") ||
    lower.startsWith("--letter-spacing-") ||
    lower.includes("-typography-") ||
    lower.includes("-font-")
  )
    return "typography";
  if (
    lower.startsWith("--spacing-") ||
    lower.startsWith("--space-") ||
    lower.startsWith("--size-spacing-") ||
    lower.includes("-spacing-")
  )
    return "spacing";
  if (
    lower.startsWith("--radius-") ||
    lower.startsWith("--corner-") ||
    lower.startsWith("--border-radius-") ||
    lower.includes("-radius-") ||
    lower.includes("-corner-")
  )
    return "radii";
  if (lower.startsWith("--shadow-") || lower.includes("-shadow-"))
    return "shadows";
  if (lower.startsWith("--breakpoint-") || lower.includes("-breakpoint-"))
    return "breakpoints";
  if (lower.startsWith("--container-") || lower.includes("-container-"))
    return "containers";
  if (lower.startsWith("--opacity-") || lower.includes("-opacity-"))
    return "opacity";
  if (lower.startsWith("--component-") || lower.includes("-component-"))
    return "components";
  return "other";
}

function groupVars(vars) {
  const groups = new Map();
  for (const v of vars) {
    const g = groupForVar(v);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(v);
  }
  for (const list of groups.values()) list.sort();
  return groups;
}

function similarity(a, b) {
  const ta = tokenize(a);
  const tb = tokenize(b);
  const setA = new Set(ta);
  const setB = new Set(tb);
  let overlap = 0;
  for (const t of setA) if (setB.has(t)) overlap++;
  const denom = Math.max(setA.size, setB.size) || 1;
  return overlap / denom;
}

function suggestRenames(missing, candidates, limit = 3, minScore = 0.6) {
  const suggestions = [];
  for (const name of missing) {
    const scored = [];
    for (const cand of candidates) {
      const score = similarity(name, cand);
      if (score >= minScore) scored.push({ cand, score });
    }
    scored.sort((a, b) => b.score - a.score);
    if (scored.length) {
      suggestions.push({ name, picks: scored.slice(0, limit) });
    }
  }
  return suggestions;
}

function writeGroupedSection(lines, title, groups) {
  lines.push(`## ${title}`);
  const order = [
    "colors",
    "typography",
    "spacing",
    "radii",
    "shadows",
    "breakpoints",
    "containers",
    "opacity",
    "components",
    "other",
  ];
  for (const key of order) {
    if (!groups.has(key)) continue;
    const items = groups.get(key);
    if (!items.length) continue;
    lines.push(`### ${key}`);
    for (const v of items) lines.push(`- \`${v}\``);
    lines.push("");
  }
}

function writeReport({
  localVars,
  uilibVars,
  matches,
  missingInUilib,
  missingInLocal,
  suggestions,
}) {
  const lines = [];
  lines.push("# Token Mapping Report (CSS Variables)");
  lines.push("");
  lines.push("|  | @tui/design-system | Figma Library |");
  lines.push("| --- | --- | --- |");
  lines.push(`| Variables | ${uilibVars.size} | ${localVars.size} |`);
  lines.push(`| Missing | ${missingInUilib.length} | ${missingInLocal.length} |`);
  lines.push("");
  lines.push(`=> Matches ${matches.length} : ${matches.length}`);
  lines.push("");

  writeGroupedSection(lines, "Matches", groupVars(matches));
  writeGroupedSection(
    lines,
    "Missing In @tui/design-system",
    groupVars(missingInUilib),
  );
  writeGroupedSection(
    lines,
    "Missing In Figma Library",
    groupVars(missingInLocal),
  );

  lines.push("## Potential Renames (Heuristic)");
  if (suggestions.length === 0) {
    lines.push("- None detected");
  } else {
    for (const item of suggestions) {
      lines.push(`- \`${item.name}\``);
      for (const pick of item.picks) {
        const scorePct = Math.round(pick.score * 100);
        lines.push(`- suggestion: \`${pick.cand}\` (${scorePct}%)`);
      }
    }
  }
  lines.push("");

  fs.writeFileSync(outputPath, lines.join("\n"));
}

if (!fs.existsSync(localCssDir)) {
  console.error(`Missing local CSS dir: ${localCssDir}`);
  process.exit(1);
}
if (!fs.existsSync(uilibSrcDir)) {
  console.error(`Missing uilib src dir: ${uilibSrcDir}`);
  process.exit(1);
}

const localFiles = readFiles(["**/*.css"], localCssDir);
const uilibFiles = readFiles(["**/*.{css,scss}"], uilibSrcDir);

const localVars = collectVars(localFiles);
const uilibVars = collectVars(uilibFiles);

const matches = [...localVars].filter((v) => uilibVars.has(v)).sort();
const missingInUilib = [...localVars].filter((v) => !uilibVars.has(v)).sort();
const missingInLocal = [...uilibVars].filter((v) => !localVars.has(v)).sort();
const suggestions = suggestRenames(missingInUilib, missingInLocal);

writeReport({
  localVars,
  uilibVars,
  matches,
  missingInUilib,
  missingInLocal,
  suggestions,
});

console.log(`✅ Wrote mapping report to ${outputPath}`);
