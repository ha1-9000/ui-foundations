import figma, { html } from "@figma/code-connect/html";
import { ICON_ENUM_OPTIONS_WITH_NONE } from "./icon-names";

const FIGMA_WEB_LABEL_URL =
  "https://www.figma.com/design/uqMsy8fV1fPbQdAzgwlmBA/UI-Foundations?node-id=1-1&m=dev";

function renderIcon(name: string, position: "start" | "end") {
  if (!name) return "";

  return `<span
    class="icon label-content__icon label-content__icon--${position}"
    style="--icon-src: url('/assets/icons/${name}.svg')"
    aria-hidden="true"
  ></span>`;
}

figma.connect(FIGMA_WEB_LABEL_URL, {
  props: {
    mode: figma.enum("Mode", {
      Content: "content",
      Field: "field",
    }),
    label: figma.string("Label"),
    iconOnly: figma.boolean("Icon only"),
    required: figma.boolean("Required"),
    forId: figma.string("For ID"),
    startIcon: figma.enum("Start Icon", ICON_ENUM_OPTIONS_WITH_NONE),
    endIcon: figma.enum("End Icon", ICON_ENUM_OPTIONS_WITH_NONE),
  },
  example: ({ mode, label, iconOnly, required, forId, startIcon, endIcon }) => {
    const hasText = Boolean(label && label.trim());
    const resolvedIconOnly = iconOnly || !hasText;
    const iconStart = resolvedIconOnly ? startIcon || endIcon : startIcon;
    const iconEnd = resolvedIconOnly ? "" : endIcon;
    const contentClasses = resolvedIconOnly
      ? "label-content is-icon-only"
      : "label-content";
    const textMarkup =
      resolvedIconOnly || !hasText
        ? ""
        : `<span class="label-content__text">${label}</span>`;
    const contentMarkup = `${renderIcon(iconStart, "start")}${textMarkup}${renderIcon(iconEnd, "end")}`;

    if (mode === "field") {
      const requiredMarkup = required
        ? '<span class="field-label__required" aria-hidden="true">*</span><span class="field-label__required-text"> (required)</span>'
        : "";

      return html`<label
        class="field-label"
        for="${forId || "field-id"}"
        style="line-height: 24px;"
      >
        <span class="${contentClasses}">${contentMarkup}</span>${requiredMarkup}
      </label>`;
    }

    return html`<span style="line-height: 24px;">
      <span class="${contentClasses}">${contentMarkup}</span>
    </span>`;
  },
});
