const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const TOKENS_YAML_RELATIVE_PATH = "dist/tokens/tokens.yaml";
const TOKENS_YAML_PATH = path.join(
  __dirname,
  "..",
  "..",
  TOKENS_YAML_RELATIVE_PATH,
);

let didWarnParseError = false;

function loadTokensFromYaml() {
  if (!fs.existsSync(TOKENS_YAML_PATH)) return [];

  try {
    const doc = yaml.load(fs.readFileSync(TOKENS_YAML_PATH, "utf8"));
    return Array.isArray(doc?.tokens) ? doc.tokens : [];
  } catch (error) {
    if (!didWarnParseError) {
      didWarnParseError = true;
      console.warn(
        `[ui-foundations] Failed to parse ${TOKENS_YAML_RELATIVE_PATH}: ${error.message}`,
      );
    }
    return [];
  }
}

module.exports = {
  TOKENS_YAML_RELATIVE_PATH,
  loadTokensFromYaml,
};
