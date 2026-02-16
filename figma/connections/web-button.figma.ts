import figma, { html } from "@figma/code-connect/html";
import { ICON_ENUM_OPTIONS_WITH_NONE } from "./icon-names";

function renderIcon(name: string, position: "start" | "end") {
  if (!name) return "";

  return `<span class="label-content__icon label-content__icon--${position}">
    <span class="icon" style="--icon-src: url('/assets/icons/${name}.svg')" aria-hidden="true"></span>
  </span>`;
}

figma.connect(
  "https://www.figma.com/design/uqMsy8fV1fPbQdAzgwlmBA/UI-Foundations?node-id=1-118&m=dev",
  {
    props: {
      label: figma.string("Label"),
      disabled: figma.boolean("Disabled"),
      iconOnly: figma.boolean("Icon only"),
      ariaLabel: figma.string("Aria label"),
      startIcon: figma.enum("Start Icon", ICON_ENUM_OPTIONS_WITH_NONE),
      endIcon: figma.enum("End Icon", ICON_ENUM_OPTIONS_WITH_NONE),
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
    example: ({ label, disabled, className, iconOnly, ariaLabel, startIcon, endIcon }) => {
      const resolvedIconOnly = iconOnly || !label;
      const contentClasses = resolvedIconOnly
        ? "label-content is-icon-only"
        : "label-content";
      const textMarkup =
        resolvedIconOnly || !label
          ? ""
          : `<span class="label-content__text">${label}</span>`;
      const resolvedAriaLabel = ariaLabel || label || "Button";

      return html`<button
        type="button"
        class="${className}${resolvedIconOnly ? " button--icon-only" : ""}"
        ${disabled ? "disabled" : ""}
        ${resolvedIconOnly ? `aria-label="${resolvedAriaLabel}"` : ""}
      >
        <span class="${contentClasses}">
          ${renderIcon(startIcon, "start")}
          ${textMarkup}
          ${renderIcon(endIcon, "end")}
        </span>
      </button>`;
    },
  },
);
