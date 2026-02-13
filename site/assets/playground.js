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

const renderVanillaButton = ({ props, children, meta }) => {
  const element = document.createElement("button");
  const variant = props.variant || "solid";
  const type = props.type || "button";
  const previewState = String(meta.state || "default");
  const classes = ["button"];

  if (variant === "outline") classes.push("outline");
  if (variant === "ghost") classes.push("ghost");
  if (previewState === "hover") classes.push("is-hover");
  if (previewState === "active") classes.push("is-active");
  if (previewState === "focus") classes.push("is-focus-visible");
  if (props.className) classes.push(String(props.className));

  element.className = classes.join(" ");
  element.type = type;
  element.disabled = previewState === "disabled" || Boolean(props.disabled);
  element.textContent = typeof children === "undefined" ? "Button" : children;

  const attrs = [`class="${quoteAttr(element.className)}"`, `type="${quoteAttr(type)}"`];
  if (element.disabled) attrs.push("disabled");
  const code = `<button ${attrs.join(" ")}>${quoteAttr(element.textContent)}</button>`;

  return { element, code };
};

const renderers = {
  button: renderVanillaButton,
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
  if (!form || !mountNode || !codeNode) return;

  const controls = Array.from(form.querySelectorAll("[data-playground-control]"));
  const queryControls = controls.filter((control) => control.dataset.queryParam === "1");
  applyQueryParamsToControls(queryPrefix, queryControls);

  const render = () => {
    const state = readPlaygroundState(controls);
    const result = renderer(state);
    mountNode.innerHTML = "";
    mountNode.append(result.element);
    codeNode.textContent = result.code;
    syncControlsToQueryParams(queryPrefix, queryControls);
  };

  form.addEventListener("input", render);
  form.addEventListener("change", render);
  render();
};

const containers = Array.from(document.querySelectorAll("[data-playground]"));
containers.forEach((container) => {
  const runtime = container.dataset.runtime || "vanilla";
  if (runtime === "vanilla") {
    initVanillaPlayground(container);
  }
});
