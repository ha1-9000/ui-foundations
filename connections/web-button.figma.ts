import figma, { html } from "@figma/code-connect/html";

figma.connect(
  "https://www.figma.com/design/uqMsy8fV1fPbQdAzgwlmBA/UI-Foundations?node-id=1-118&m=dev",
  {
    props: {
      label: figma.string("Label"),
      disabled: figma.boolean("Disabled"),
      variant: figma.enum("Variant", {
        Solid: "Solid",
        Outline: "Outline",
        Ghost: "Ghost",
      }),
      className: figma.className([
        "button",
        figma.enum("Variant", {
          Solid: undefined,
          Outline: "outline",
          Ghost: "ghost",
        }),
      ]),
    },
    example: ({ label, disabled, className }) =>
      html`<button
        type="button"
        class=${className}
        ${disabled ? "disabled" : ""}
      >
        ${label}
      </button>`,
  },
);
