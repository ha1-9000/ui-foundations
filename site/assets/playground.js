const quoteAttr = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

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

    props[prop] = value;
    propEntries.push({ prop, value, valueType });
  }

  return { props, propEntries, children };
};

const renderVanillaButton = ({ props, children }) => {
  const element = document.createElement("button");
  const variant = props.variant || "solid";
  const type = props.type || "button";
  const classes = ["button"];

  if (variant === "outline") classes.push("outline");
  if (variant === "ghost") classes.push("ghost");
  if (props.className) classes.push(String(props.className));

  element.className = classes.join(" ");
  element.type = type;
  element.disabled = Boolean(props.disabled);
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
  const form = container.querySelector(`#${playgroundId}-controls`);
  const mountNode = container.querySelector(`#${playgroundId}-root`);
  const codeNode = document.getElementById(`${playgroundId}-code`);
  if (!form || !mountNode || !codeNode) return;

  const controls = Array.from(form.querySelectorAll("[data-playground-control]"));

  const render = () => {
    const state = readPlaygroundState(controls);
    const result = renderer(state);
    mountNode.innerHTML = "";
    mountNode.append(result.element);
    codeNode.textContent = result.code;
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
