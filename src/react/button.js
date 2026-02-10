import React from "react";

export function Button({
  variant = "solid",
  className = "",
  type = "button",
  ...props
}) {
  const classes = ["button"];

  if (variant === "outline") classes.push("outline");
  if (variant === "ghost") classes.push("ghost");
  if (className) classes.push(className);

  return React.createElement("button", {
    type,
    className: classes.join(" "),
    ...props,
  });
}
