import React from "react";

export function Input({ className = "", type = "text", ...props }) {
  const classes = ["input"];
  if (className) classes.push(className);

  return React.createElement("input", {
    type,
    className: classes.join(" "),
    ...props,
  });
}
