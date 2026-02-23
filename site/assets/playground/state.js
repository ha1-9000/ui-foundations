(function initPlaygroundState(global) {
  const shared = global.UIPlaygroundShared || {};
  const normalizeHexColorForPicker =
    shared.normalizeHexColorForPicker || ((value) => String(value || ""));

  const queryKeyForControl = (queryPrefix, controlName) =>
    `pg-${queryPrefix}-${controlName}`;

  const parseBoolean = (rawValue) => {
    const normalized = String(rawValue || "").toLowerCase();
    return (
      normalized === "1" ||
      normalized === "true" ||
      normalized === "yes" ||
      normalized === "on"
    );
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

  const parseVisibleWhenExpression = (expression) =>
    String(expression || "")
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

  global.UIPlaygroundState = {
    applyQueryParamsToControls,
    syncControlsToQueryParams,
    readPlaygroundState,
    applyControlVisibility,
    syncColorPickersFromControls,
    setControlValueFromColorPicker,
  };
})(window);
