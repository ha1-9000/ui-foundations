import React from "react";
import { LabelContent } from "./label.js";

export function Button({
  variant = "solid",
  className = "",
  type = "button",
  label,
  startIcon,
  endIcon,
  iconOnly,
  ariaLabel,
  children,
  ...props
}) {
  const classes = ["button"];

  if (variant === "outline") classes.push("outline");
  if (variant === "ghost") classes.push("ghost");
  if (className) classes.push(className);

  const content = children ?? label;
  const hasReadableLabel =
    typeof content === "string"
      ? content.trim().length > 0
      : content !== null && content !== undefined && content !== false;
  const resolvedIconOnly = iconOnly ?? !hasReadableLabel;
  const iconStart = resolvedIconOnly ? startIcon || endIcon : startIcon;
  const iconEnd = resolvedIconOnly ? undefined : endIcon;

  if (resolvedIconOnly) classes.push("button--icon-only");

  const buttonProps = {
    type,
    className: classes.join(" "),
    ...props,
  };

  if (resolvedIconOnly && !buttonProps["aria-label"] && ariaLabel) {
    buttonProps["aria-label"] = ariaLabel;
  }

  if (resolvedIconOnly && !buttonProps["aria-label"]) {
    console.warn(
      "[ui-foundations] iconOnly Button should include `ariaLabel` or `aria-label`.",
    );
  }

  return React.createElement(
    "button",
    buttonProps,
    React.createElement(
      LabelContent,
      {
        startIcon: iconStart,
        endIcon: iconEnd,
        iconOnly: resolvedIconOnly,
      },
      content,
    ),
  );
}
