const fs = require("fs");
const path = require("path");

const ICONS_DIR = path.join(__dirname, "..", "..", "src", "assets", "icons");

function loadIconNames() {
  if (!fs.existsSync(ICONS_DIR)) return [];

  const names = fs
    .readdirSync(ICONS_DIR)
    .filter((file) => file.endsWith(".svg"))
    .map((file) => file.replace(/\.svg$/i, ""))
    .sort((a, b) => a.localeCompare(b));

  return [...new Set(names)];
}

module.exports = () => {
  const names = loadIconNames();
  const withNone = [
    { label: "none", value: "" },
    ...names.map((name) => ({ label: name, value: name })),
  ];

  return {
    names,
    withNone,
    count: names.length,
    sourceDir: "src/assets/icons",
  };
};
