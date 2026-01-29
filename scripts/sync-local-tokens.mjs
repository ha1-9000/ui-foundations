import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import { parse } from "jsonc-parser";

const SRC_FIGMA_DIR = path.resolve("src/figma-exports");
const TOKENS_FIGMA_DIR = path.resolve("tokens/figma");
const INDEX_FILE = path.resolve("tokens/index.json");

async function readJsonLike(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  const normalized = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const errors = [];
  const data = parse(normalized, errors, {
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

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

async function convertSrcFigmaTokens() {
  const patterns = [
    "src/figma-exports/*.token.json",
    "src/figma-exports/*.tokens.json",
    "src/figma-exports/*.token.jsonc",
    "src/figma-exports/*.tokens.jsonc",
  ];

  const files = await fg(patterns, {
    absolute: true,
    onlyFiles: true,
    unique: true,
  });

  const index = {};

  for (const filePath of files) {
    const data = await readJsonLike(filePath);
    const relPath = path.relative(SRC_FIGMA_DIR, filePath);
    const relNoExt = relPath.replace(/\.jsonc?$/i, "");
    const outRel = relPath.replace(/\.jsonc$/i, ".json");
    const outPath = path.join(TOKENS_FIGMA_DIR, outRel);

    await writeJson(outPath, data);

    const key = `figma/${relNoExt.split(path.sep).join("/")}`;
    index[key] = data;
  }

  await writeJson(INDEX_FILE, index);

  console.log(
    `✔ Converted src/figma-exports -> tokens/figma: ${files.length} files`,
  );
  console.log(`✔ Merged index written: tokens/index.json`);

  return { count: files.length };
}

async function main() {
  try {
    await convertSrcFigmaTokens();
  } catch (error) {
    console.error(String(error?.message || error));
    process.exit(1);
  }
}

main();
