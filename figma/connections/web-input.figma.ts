import figma, { html } from "@figma/code-connect/html";

const FIGMA_WEB_INPUT_URL =
  "https://www.figma.com/design/uqMsy8fV1fPbQdAzgwlmBA/UI-Foundations?node-id=1-1&m=dev";

const STATE_CLASS_MAP: Record<string, string> = {
  default: "",
  hover: "is-hover",
  active: "is-active",
  focus: "is-focus-visible",
};

figma.connect(FIGMA_WEB_INPUT_URL, {
  props: {
    type: figma.enum("Type", {
      Text: "text",
      Email: "email",
      Password: "password",
      Search: "search",
    }),
    placeholder: figma.string("Placeholder"),
    value: figma.string("Value"),
    ariaLabel: figma.string("Aria label"),
    disabled: figma.boolean("Disabled"),
    required: figma.boolean("Required"),
    state: figma.enum("State", {
      Default: "default",
      Hover: "hover",
      Active: "active",
      Focus: "focus",
    }),
  },
  example: ({ type, placeholder, value, ariaLabel, disabled, required, state }) => {
    const classes = ["input"];
    const stateClass = STATE_CLASS_MAP[state || "default"];
    if (stateClass) classes.push(stateClass);
    if (disabled) classes.push("is-disabled");

    return html`<input
      class="${classes.join(" ")}"
      type="${type || "text"}"
      placeholder="${placeholder || "Placeholder"}"
      value="${value || ""}"
      aria-label="${ariaLabel || placeholder || "Input"}"
      ${disabled ? "disabled" : ""}
      ${required ? "required" : ""}
    />`;
  },
});
