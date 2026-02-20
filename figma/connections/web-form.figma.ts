import figma, { html } from "@figma/code-connect/html";

const FIGMA_WEB_FORM_URL =
  "https://www.figma.com/design/uqMsy8fV1fPbQdAzgwlmBA/UI-Foundations?node-id=2068-369&m=dev&focus-id=2070-587";

function renderFieldLabel(
  text: string,
  forId: string,
  required: boolean,
  lineHeight = "24px",
) {
  const requiredMarkup = required
    ? '<span class="field-label__required" aria-hidden="true">*</span><span class="field-label__required-text"> (required)</span>'
    : "";

  return `<label class="field-label" for="${forId}" style="line-height: ${lineHeight};">
    <span class="label-content">
      <span class="label-content__text">${text}</span>
    </span>
    ${requiredMarkup}
  </label>`;
}

figma.connect(FIGMA_WEB_FORM_URL, {
  props: {
    title: figma.string("Title"),
    intro: figma.string("Intro"),
    emailLabel: figma.string("Email Label"),
    emailPlaceholder: figma.string("Email Placeholder"),
    emailRequired: figma.boolean("Email Required"),
    passwordLabel: figma.string("Password Label"),
    passwordPlaceholder: figma.string("Password Placeholder"),
    passwordRequired: figma.boolean("Password Required"),
    submitLabel: figma.string("Submit Label"),
  },
  example: ({
    title,
    intro,
    emailLabel,
    emailPlaceholder,
    emailRequired,
    passwordLabel,
    passwordPlaceholder,
    passwordRequired,
    submitLabel,
  }) => {
    const resolvedTitle = title || "Sign in";
    const resolvedIntro = intro || "Use your account email and password.";
    const resolvedEmailLabel = emailLabel || "Email address";
    const resolvedPasswordLabel = passwordLabel || "Password";

    return html`<form class="form" action="#" method="post" novalidate>
      <fieldset class="form__group">
        <legend class="form__group-title">${resolvedTitle}</legend>
        <p class="form__intro">${resolvedIntro}</p>

        <div class="form__field">
          ${renderFieldLabel(
            resolvedEmailLabel,
            "form-email",
            emailRequired,
          )}
          <input
            class="input"
            type="email"
            id="form-email"
            name="email"
            placeholder="${emailPlaceholder || "name@example.com"}"
            ${emailRequired ? "required" : ""}
          />
        </div>

        <div class="form__field">
          ${renderFieldLabel(
            resolvedPasswordLabel,
            "form-password",
            passwordRequired,
          )}
          <input
            class="input"
            type="password"
            id="form-password"
            name="password"
            placeholder="${passwordPlaceholder || "Enter password"}"
            ${passwordRequired ? "required" : ""}
          />
        </div>
      </fieldset>

      <div class="form__actions" style="padding-top: 4px;">
        <button type="submit" class="button">${submitLabel || "Sign in"}</button>
      </div>
    </form>`;
  },
});
