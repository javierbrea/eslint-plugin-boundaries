import type { ReactNode } from "react";

import { ICON_PATHS } from "./Icon.constants";
import type { IconProps } from "./Icon.types";

/**
 * Draws an icon of the playground: a 2 px stroke with round caps in `currentColor`, so that the icon takes the color of the element around it.
 * @param props Icon props.
 * @param props.name Which icon to draw.
 * @param props.size Side of the icon in pixels, 14 by default.
 * @param props.label What the icon says. Without it, the icon is hidden from assistive technology.
 * @returns The SVG element.
 */
export function Icon({
  name: iconName,
  size = 14,
  label,
}: Readonly<IconProps>): ReactNode {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      // Never shrunk by a flex container: the buttons and rows that hold it are rows of flex items
      style={{ flexShrink: 0 }}
      {...(label === undefined
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": label })}
    >
      <path d={ICON_PATHS[iconName]} />
    </svg>
  );
}
