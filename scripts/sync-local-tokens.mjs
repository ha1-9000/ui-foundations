import fs from 'node:fs/promises';
import path from 'node:path';

const INPUT_DIR = path.resolve('figma');
const OUTPUT_FILE = path.resolve('tokens/_from-local.json');

const INPUT_FILES = {
  variables: 'variables.json',
  collections: 'collections.json',
  modes: 'modes.json'
};

function nowIso() {
  return new Date().toISOString();
}

async function readJson(filePath) {
  const text = await fs.readFile(filePath, 'utf8');
  return JSON.parse(text);
}

async function main() {
  try {
    const data = {};
    for (const [key, filename] of Object.entries(INPUT_FILES)) {
      const fullPath = path.join(INPUT_DIR, filename);
      data[key] = await readJson(fullPath);
    }

    const output = {
      _source: {
        type: 'local-figma-files',
        directory: 'figma',
        files: INPUT_FILES,
        exportedAt: nowIso()
      },
      data
    };

    await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n');

    console.log('Local token snapshot written:');
    console.log(`- ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Failed to read local Figma token files.');
    console.error('Expected files in figma/: variables.json, collections.json, modes.json');
    console.error(String(error?.message || error));
    process.exit(1);
  }
}

main();
