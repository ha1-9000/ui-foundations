(function initPlaygroundShared(global) {
  const quoteAttr = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/\"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

  const normalizeHexColorForPicker = (value) => {
    const raw = String(value || "").trim();
    if (!HEX_COLOR_PATTERN.test(raw)) return "#000000";
    if (raw.length === 4) {
      return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
    }
    return raw.toLowerCase();
  };

  const normalizeIconName = (rawValue) => {
    const value = String(rawValue || "").trim();
    if (!value) return "";
    return value;
  };

  global.UIPlaygroundShared = {
    quoteAttr,
    normalizeHexColorForPicker,
    normalizeIconName,
  };
})(window);
