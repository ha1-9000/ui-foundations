const quoteAttr = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const queryKeyForControl = (queryPrefix, controlName) =>
  `pg-${queryPrefix}-${controlName}`;

const parseBoolean = (rawValue) => {
  const normalized = String(rawValue || "").toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
};

const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const normalizeHexColorForPicker = (value) => {
  const raw = String(value || "").trim();
  if (!HEX_COLOR_PATTERN.test(raw)) return "#000000";
  if (raw.length === 4) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
  }
  return raw.toLowerCase();
};

const serializeControlValue = (control) => {
  const valueType = control.dataset.valueType || "string";
  if (valueType === "boolean") return control.checked ? "1" : "0";
  return String(control.value || "");
};

const applyQueryParamsToControls = (queryPrefix, controls) => {
  const params = new URLSearchParams(window.location.search);

  for (const control of controls) {
    const key = queryKeyForControl(queryPrefix, control.name);
    if (!params.has(key)) continue;

    const rawValue = params.get(key);
    const valueType = control.dataset.valueType || "string";
    if (valueType === "boolean") {
      control.checked = parseBoolean(rawValue);
      continue;
    }

    control.value = String(rawValue || "");
  }
};

const syncControlsToQueryParams = (queryPrefix, controls) => {
  const url = new URL(window.location.href);
  const keyPrefix = `pg-${queryPrefix}-`;

  const keys = Array.from(url.searchParams.keys());
  for (const key of keys) {
    if (key.startsWith(keyPrefix)) {
      url.searchParams.delete(key);
    }
  }

  for (const control of controls) {
    const key = queryKeyForControl(queryPrefix, control.name);
    url.searchParams.set(key, serializeControlValue(control));
  }

  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, "", next);
};

const readControlValue = (control) => {
  const valueType = control.dataset.valueType || "string";

  if (valueType === "boolean") return control.checked;
  if (valueType === "number") {
    const numeric = Number(control.value);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  return String(control.value || "");
};

const readPlaygroundState = (controls) => {
  const props = {};
  const propEntries = [];
  const meta = {};
  let children;

  for (const control of controls) {
    const field = control.closest("[data-playground-field]");
    if (field && field.hidden) continue;

    const prop = control.dataset.prop || control.name;
    const source = control.dataset.source || "prop";
    const valueType = control.dataset.valueType || "string";
    const value = readControlValue(control);

    if (source === "children") {
      children = String(value);
      continue;
    }
    if (source === "meta") {
      meta[prop] = value;
      continue;
    }

    props[prop] = value;
    propEntries.push({ prop, value, valueType });
  }

  return { props, propEntries, children, meta };
};

const normalizeConditionValue = (value) => {
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value || "").trim();
};

const parseVisibleWhenExpression = (expression) => {
  return String(expression || "")
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const eqIndex = entry.indexOf("=");
      if (eqIndex === -1) return null;
      return {
        controlName: entry.slice(0, eqIndex).trim(),
        expected: entry.slice(eqIndex + 1).trim(),
      };
    })
    .filter(Boolean);
};

const applyControlVisibility = (form, controls) => {
  if (!form) return;

  const fields = Array.from(form.querySelectorAll("[data-playground-field]"));
  const controlsByName = new Map(
    controls.map((control) => [control.name, control]),
  );

  fields.forEach((field) => {
    const expression = field.dataset.visibleWhen || "";
    if (!expression) {
      field.hidden = false;
      return;
    }

    const conditions = parseVisibleWhenExpression(expression);
    const visible = conditions.every((condition) => {
      const targetControl = controlsByName.get(condition.controlName);
      if (!targetControl) return false;

      const actual = normalizeConditionValue(readControlValue(targetControl));
      const expectedValues = condition.expected
        .split("|")
        .map((value) => value.trim())
        .filter(Boolean);
      if (expectedValues.length === 0) return actual.length > 0;

      return expectedValues.includes(actual);
    });

    field.hidden = !visible;
  });
};

const syncColorPickersFromControls = (form) => {
  if (!form) return;

  const pickers = Array.from(
    form.querySelectorAll("[data-playground-color-picker]"),
  );

  pickers.forEach((picker) => {
    const targetId = picker.dataset.targetControl;
    if (!targetId) return;

    const targetControl = form.querySelector(`#${targetId}`);
    if (!targetControl) return;

    picker.value = normalizeHexColorForPicker(targetControl.value);
  });
};

const setControlValueFromColorPicker = (form, picker) => {
  const targetId = picker.dataset.targetControl;
  if (!targetId) return;

  const targetControl = form.querySelector(`#${targetId}`);
  if (!targetControl) return;

  targetControl.value = picker.value;
};

const normalizeIconName = (rawValue) => {
  const value = String(rawValue || "").trim();
  if (!value) return "";
  return value;
};

const HTML_VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const formatHtmlSnippet = (input) => {
  const compact = String(input || "")
    .replace(/\r\n/g, "\n")
    .replace(/>\s+</g, "><")
    .trim();
  if (!compact) return "";

  const tokens = compact.match(/<\/?[^>]+>|[^<]+/g) || [];
  const lines = [];
  let depth = 0;

  tokens.forEach((rawToken) => {
    const token = rawToken.trim();
    if (!token) return;

    if (token.startsWith("</")) {
      depth = Math.max(depth - 1, 0);
      lines.push(`${"  ".repeat(depth)}${token}`);
      return;
    }

    if (token.startsWith("<")) {
      lines.push(`${"  ".repeat(depth)}${token}`);

      const isSelfClosing = token.endsWith("/>");
      const tagMatch = token.match(/^<([a-zA-Z0-9-]+)/);
      const tagName = tagMatch ? tagMatch[1].toLowerCase() : "";
      if (!isSelfClosing && !HTML_VOID_TAGS.has(tagName)) {
        depth += 1;
      }
      return;
    }

    lines.push(`${"  ".repeat(depth)}${token}`);
  });

  return lines.join("\n");
};

const iconLabelFromName = (name) =>
  String(name || "")
    .replace(/[-_]+/g, " ")
    .trim();

const iconSrcFromName = (name) => `/assets/icons/${name}.svg`;

const createIconElement = ({ name, decorative = true, label, color }) => {
  const normalizedName = normalizeIconName(name);
  if (!normalizedName) return null;

  const element = document.createElement("span");
  element.className = "icon";
  element.style.setProperty(
    "--icon-src",
    `url("${iconSrcFromName(normalizedName)}")`,
  );
  element.style.color = color || "inherit";

  if (decorative) {
    element.setAttribute("aria-hidden", "true");
  } else {
    element.setAttribute("role", "img");
    element.setAttribute("aria-label", label || iconLabelFromName(normalizedName));
  }

  return element;
};

const iconCode = ({ name, decorative = true, label, color }) => {
  const normalizedName = normalizeIconName(name);
  if (!normalizedName) return "";

  const styleEntries = [`--icon-src: url('/assets/icons/${quoteAttr(normalizedName)}.svg')`];
  if (color) {
    styleEntries.push(`color: ${color}`);
  }

  const attrs = [
    'class="icon"',
    `style="${quoteAttr(styleEntries.join("; "))}"`,
  ];

  if (decorative) {
    attrs.push('aria-hidden="true"');
  } else {
    attrs.push('role="img"');
    attrs.push(`aria-label="${quoteAttr(label || iconLabelFromName(normalizedName))}"`);
  }

  return `<span ${attrs.join(" ")}></span>`;
};

const createLabelIconSlot = (name, position) => {
  const icon = createIconElement({ name, decorative: true });
  if (!icon) return null;

  icon.setAttribute("data-slot", position);
  return icon;
};

const labelIconCode = (name, position) => {
  const iconMarkup = iconCode({ name, decorative: true });
  if (!iconMarkup) return "";
  return iconMarkup.replace(
    'class="icon"',
    `class="icon" data-slot="${position}"`,
  );
};

const renderVanillaButton = ({ props, children, meta }) => {
  const element = document.createElement("button");
  const variant = props.variant || "solid";
  const type = props.type || "button";
  const previewState = String(meta.state || "default");
  const startIcon = normalizeIconName(props.startIcon);
  const endIcon = normalizeIconName(props.endIcon);
  const iconOnly = Boolean(props.iconOnly);
  const rawLabel = typeof children === "undefined" ? "Button" : String(children || "");
  const hasText = rawLabel.trim().length > 0;
  const resolvedIconOnly = iconOnly || !hasText;
  const ariaLabel = String(props.ariaLabel || "").trim();
  const iconStart = resolvedIconOnly ? startIcon || endIcon || "none" : startIcon;
  const iconEnd = resolvedIconOnly ? "" : endIcon;
  const classes = ["button"];

  if (variant === "outline") classes.push("outline");
  if (variant === "ghost") classes.push("ghost");
  if (resolvedIconOnly) classes.push("button--icon-only");
  if (previewState === "hover") classes.push("is-hover");
  if (previewState === "active") classes.push("is-active");
  if (previewState === "focus") classes.push("is-focus-visible");
  if (props.className) classes.push(String(props.className));

  element.className = classes.join(" ");
  element.type = type;
  element.disabled = previewState === "disabled" || Boolean(props.disabled);
  if (resolvedIconOnly) {
    element.setAttribute("aria-label", ariaLabel || "Button");
  }

  const content = document.createElement("span");
  const contentClasses = ["label-content"];
  if (resolvedIconOnly) contentClasses.push("is-icon-only");
  content.className = contentClasses.join(" ");

  const startSlot = createLabelIconSlot(iconStart, "start");
  if (startSlot) content.append(startSlot);

  if (!resolvedIconOnly && hasText) {
    const textNode = document.createElement("span");
    textNode.className = "label-content__text";
    textNode.textContent = rawLabel;
    content.append(textNode);
  }

  const endSlot = createLabelIconSlot(iconEnd, "end");
  if (endSlot) content.append(endSlot);

  element.append(content);

  const attrs = [`class="${quoteAttr(element.className)}"`, `type="${quoteAttr(type)}"`];
  if (element.disabled) attrs.push("disabled");
  if (resolvedIconOnly) {
    attrs.push(`aria-label="${quoteAttr(ariaLabel || "Button")}"`);
  }

  const codeContent = [
    labelIconCode(iconStart, "start"),
    !resolvedIconOnly && hasText
      ? `<span class="label-content__text">${quoteAttr(rawLabel)}</span>`
      : "",
    labelIconCode(iconEnd, "end"),
  ]
    .filter(Boolean)
    .join("");

  const codeContentClasses = ["label-content"];
  if (resolvedIconOnly) codeContentClasses.push("is-icon-only");

  const code = `<button ${attrs.join(" ")}><span class="${quoteAttr(codeContentClasses.join(" "))}">${codeContent}</span></button>`;

  return { element, code };
};

const renderVanillaIcon = ({ props }) => {
  const name = normalizeIconName(props.name) || "search";
  const lineHeight = String(props.lineHeight || "24px");
  const color = String(props.color || "").trim();
  const resolvedColor =
    color && color.toLowerCase() !== "currentcolor" ? color : "";
  const decorative = Boolean(props.decorative);
  const label = String(props.label || "").trim();

  const host = document.createElement("span");
  host.style.lineHeight = lineHeight;
  const icon = createIconElement({
    name,
    decorative,
    label,
    color: resolvedColor,
  });
  if (icon) host.append(icon);

  const hostStyleEntries = [`line-height: ${lineHeight}`];
  const hostCode = `<span style="${quoteAttr(hostStyleEntries.join("; "))}">${iconCode({ name, decorative, label, color: resolvedColor })}</span>`;

  return { element: host, code: hostCode };
};

const renderVanillaLabel = ({ props, children, meta }) => {
  const mode = String(meta.mode || "content");
  const iconOnly = Boolean(props.iconOnly);
  const required = Boolean(props.required);
  const text = typeof children === "undefined" ? "Continue" : String(children || "");
  const startIcon = normalizeIconName(props.startIcon);
  const endIcon = normalizeIconName(props.endIcon);
  const iconStart = iconOnly ? startIcon || endIcon || "none" : startIcon;
  const iconEnd = iconOnly ? "" : endIcon;
  const lineHeight = String(props.lineHeight || "24px");
  const color = String(props.color || "").trim();
  const forId = String(props.forId || "field-id");

  const host = document.createElement(mode === "field" ? "label" : "span");
  if (mode === "field") {
    host.className = "field-label";
    host.setAttribute("for", forId);
  }
  host.style.lineHeight = lineHeight;
  if (color) host.style.color = color;

  const labelContent = document.createElement("span");
  labelContent.className = "label-content";

  const hasText = text.trim().length > 0;
  if (iconOnly || !hasText) {
    labelContent.classList.add("is-icon-only");
  }

  const startSlot = createLabelIconSlot(iconStart, "start");
  if (startSlot) labelContent.append(startSlot);

  if (!iconOnly && hasText) {
    const textElement = document.createElement("span");
    textElement.className = "label-content__text";
    textElement.textContent = text;
    labelContent.append(textElement);
  }

  const endSlot = createLabelIconSlot(iconEnd, "end");
  if (endSlot) labelContent.append(endSlot);

  host.append(labelContent);

  if (mode === "field" && required) {
    const requiredMarker = document.createElement("span");
    requiredMarker.className = "field-label__required";
    requiredMarker.setAttribute("aria-hidden", "true");
    requiredMarker.textContent = "*";
    host.append(requiredMarker);

    const requiredText = document.createElement("span");
    requiredText.className = "field-label__required-text";
    requiredText.textContent = " (required)";
    host.append(requiredText);
  }

  const hostStyleEntries = [`line-height: ${lineHeight}`];
  if (color) hostStyleEntries.push(`color: ${color}`);

  const contentClasses = ["label-content"];
  if (iconOnly || !hasText) contentClasses.push("is-icon-only");
  const contentMarkup = [
    labelIconCode(iconStart, "start"),
    !iconOnly && hasText
      ? `<span class="label-content__text">${quoteAttr(text)}</span>`
      : "",
    labelIconCode(iconEnd, "end"),
  ]
    .filter(Boolean)
    .join("");

  if (mode === "field") {
    const requiredMarkup = required
      ? '<span class="field-label__required" aria-hidden="true">*</span><span class="field-label__required-text"> (required)</span>'
      : "";
    const code = `<label for="${quoteAttr(forId)}" class="field-label" style="${quoteAttr(hostStyleEntries.join("; "))}"><span class="${quoteAttr(contentClasses.join(" "))}">${contentMarkup}</span>${requiredMarkup}</label>`;
    return { element: host, code };
  }

  const code = `<span style="${quoteAttr(hostStyleEntries.join("; "))}"><span class="${quoteAttr(contentClasses.join(" "))}">${contentMarkup}</span></span>`;
  return { element: host, code };
};

const renderers = {
  button: renderVanillaButton,
  icon: renderVanillaIcon,
  label: renderVanillaLabel,
};

const initVanillaPlayground = (container) => {
  const rendererId = container.dataset.renderer;
  const renderer = renderers[rendererId];
  if (!renderer) return;

  const playgroundId = container.dataset.playgroundId;
  const queryPrefix = container.dataset.queryPrefix || playgroundId;
  const form = container.querySelector(`#${playgroundId}-controls`);
  const mountNode = container.querySelector(`#${playgroundId}-root`);
  const codeNode = document.getElementById(`${playgroundId}-code`);
  const resetButton = form
    ? form.querySelector("[data-playground-reset]")
    : null;
  if (!form || !mountNode || !codeNode) return;

  const controls = Array.from(form.querySelectorAll("[data-playground-control]"));
  const queryControls = controls.filter((control) => control.dataset.queryParam === "1");
  applyQueryParamsToControls(queryPrefix, queryControls);
  applyControlVisibility(form, controls);
  syncColorPickersFromControls(form);

  const colorButtons = Array.from(
    form.querySelectorAll("[data-playground-color-button]"),
  );
  const colorPickers = Array.from(
    form.querySelectorAll("[data-playground-color-picker]"),
  );

  colorButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.targetControl;
      if (!targetId) return;

      const picker = form.querySelector(
        `[data-playground-color-picker][data-target-control="${targetId}"]`,
      );
      if (!picker) return;
      picker.click();
    });
  });

  colorPickers.forEach((picker) => {
    picker.addEventListener("input", () => {
      setControlValueFromColorPicker(form, picker);
      render();
    });
    picker.addEventListener("change", () => {
      setControlValueFromColorPicker(form, picker);
      render();
    });
  });

  const render = () => {
    applyControlVisibility(form, controls);
    const state = readPlaygroundState(controls);
    const result = renderer(state);
    mountNode.innerHTML = "";
    mountNode.append(result.element);
    const formattedCode = formatHtmlSnippet(result.code);
    if (
      window.Prism &&
      window.Prism.languages &&
      window.Prism.languages.markup &&
      typeof window.Prism.highlight === "function"
    ) {
      codeNode.innerHTML = window.Prism.highlight(
        formattedCode,
        window.Prism.languages.markup,
        "markup",
      );
    } else {
      codeNode.textContent = formattedCode;
    }
    syncColorPickersFromControls(form);
    syncControlsToQueryParams(queryPrefix, queryControls);
  };

  form.addEventListener("input", (event) => {
    if (event.target?.matches?.("[data-playground-color-picker]")) return;
    render();
  });
  form.addEventListener("change", (event) => {
    if (event.target?.matches?.("[data-playground-color-picker]")) return;
    render();
  });
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      form.reset();
      syncColorPickersFromControls(form);
      render();
    });
  }
  render();
};

const containers = Array.from(document.querySelectorAll("[data-playground]"));
containers.forEach((container) => {
  const runtime = container.dataset.runtime || "vanilla";
  if (runtime === "vanilla") {
    initVanillaPlayground(container);
  }
});
