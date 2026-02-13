const DEFAULT_FOCUSABLE =
  "a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";

export function focusFirst(container, selector = DEFAULT_FOCUSABLE) {
  if (!container) return null;
  const target = container.querySelector(selector);
  if (target) target.focus();
  return target || null;
}

export function onEscape(target, handler) {
  if (!target) return () => {};
  const onKeyDown = (event) => {
    if (event.key === "Escape") handler(event);
  };
  target.addEventListener("keydown", onKeyDown);
  return () => target.removeEventListener("keydown", onKeyDown);
}

export function setAriaExpanded(element, expanded) {
  if (!element) return;
  element.setAttribute("aria-expanded", expanded ? "true" : "false");
}

export function createRovingTabindex(container, options = {}) {
  if (!container) {
    return {
      update() {},
      destroy() {},
    };
  }

  const { itemSelector = "[data-roving-item]", loop = true } = options;
  let items = Array.from(container.querySelectorAll(itemSelector));
  let currentIndex = Math.max(
    0,
    items.findIndex((item) => item.tabIndex === 0),
  );

  const setTabindex = (nextIndex) => {
    items.forEach((item, index) => {
      item.tabIndex = index === nextIndex ? 0 : -1;
    });
    currentIndex = nextIndex;
  };

  if (items.length) setTabindex(currentIndex);

  const onKeyDown = (event) => {
    if (!items.length) return;
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

    const direction = event.key === "ArrowRight" ? 1 : -1;
    let nextIndex = currentIndex + direction;

    if (nextIndex >= items.length) nextIndex = loop ? 0 : items.length - 1;
    if (nextIndex < 0) nextIndex = loop ? items.length - 1 : 0;

    setTabindex(nextIndex);
    items[nextIndex].focus();
    event.preventDefault();
  };

  container.addEventListener("keydown", onKeyDown);

  return {
    update() {
      items = Array.from(container.querySelectorAll(itemSelector));
      if (items.length) setTabindex(Math.min(currentIndex, items.length - 1));
    },
    destroy() {
      container.removeEventListener("keydown", onKeyDown);
    },
  };
}
