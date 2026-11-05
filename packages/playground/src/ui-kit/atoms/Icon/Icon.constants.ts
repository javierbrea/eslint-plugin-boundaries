import type { IconName } from "./Icon.types";

/** Paths of the icons in a 16×16 view box, as the approved mockup draws them. `collapse` and `chevron-down` draw the same path. */
export const ICON_PATHS: Readonly<Record<IconName, string>> = {
  check: "M3 8.5l3.2 3L13 4.5",
  cross: "M4 4l8 8M12 4l-8 8",
  warn: "M8 2.5l6 11H2z M8 7v3 M8 12v.01",
  skip: "M4 8h8",
  "chevron-right": "M6 4l4 4-4 4",
  "chevron-down": "M4 6l4 4 4-4",
  plus: "M8 3v10M3 8h10",
  edit: "M10.5 2.5l3 3L6 13H3v-3z",
  trash: "M3 4.5h10 M6.5 4.5V3h3v1.5 M4.5 4.5l.6 8.5h5.8l.6-8.5",
  arrow: "M3 8h10M9 4l4 4-4 4",
  share: "M8 10V2.5M5 5.5l3-3 3 3 M3 9v4.5h10V9",
  reset: "M3 8a5 5 0 1 0 1.5-3.5 M3 2.5V5h2.5",
  collapse: "M4 6l4 4 4-4",
  help: "M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z M6.1 6.1a2 2 0 0 1 3.9.5c0 1.4-2 1.6-2 3 M8 11.9v.01",
  info: "M8 7.5v4 M8 4.5v.01 M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z",
};
