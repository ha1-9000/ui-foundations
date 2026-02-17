import figma, { html } from "@figma/code-connect/html";
import { ICON_ENUM_OPTIONS } from "./icon-names";

const FIGMA_WEB_ICON_URL =
  "https://www.figma.com/design/uqMsy8fV1fPbQdAzgwlmBA/UI-Foundations?node-id=1-1&m=dev";

function humanizeName(name: string) {
  return String(name || "")
    .replace(/[-_]+/g, " ")
    .trim();
}

figma.connect(FIGMA_WEB_ICON_URL, {
  props: {
    name: figma.enum("Icon", ICON_ENUM_OPTIONS),
    decorative: figma.boolean("Decorative"),
    label: figma.string("Accessible Label"),
  },
  example: ({ name, decorative, label }) => {
    const ariaMarkup = decorative
      ? 'aria-hidden="true"'
      : `role="img" aria-label="${label || humanizeName(name)}"`;

    return html`<span
      class="icon"
      style="--icon-src: url('/assets/icons/${name}.svg')"
      ${ariaMarkup}
    ></span>`;
  },
});
