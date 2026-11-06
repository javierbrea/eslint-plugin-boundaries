import type { StateTone } from "./theme.types";

/** Class of the root element of the playground, the scope of every MUI variable and style */
export const ROOT_CLASS = "jsb-play-root";

/** Key of the Emotion cache of the playground, the prefix of its class names */
export const CACHE_KEY = "jsb-play";

/** Keyboard focus ring of every button, tab and toggle. A pane that draws a ring of its own, such as a scrolling panel or a row of the tree, uses it too, with the offset that suits where it sits */
export const FOCUS_RING = "2px solid var(--jsb-accent)";

/** Hover over a row or a toggle: the soft accent, fainter than a selection */
export const HOVER_BACKGROUND =
  "color-mix(in srgb, var(--jsb-accent-soft) 60%, transparent)";

/** Text in the color of a state outside a code area. It mixes 15% of `--jsb-ink` into the token of the state so that it passes 4.5:1 on `--jsb-card` in both color schemes, and not-checked text is `--jsb-muted`. Icons, count badges, dots and outlines keep the plain tokens, which are meant for shapes, and code areas have their own colors. */
export const STATE_TEXT: Readonly<Record<StateTone, string>> = {
  ok: "color-mix(in srgb, var(--jsb-ok) 85%, var(--jsb-ink))",
  bad: "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))",
  warn: "color-mix(in srgb, var(--jsb-warn) 85%, var(--jsb-ink))",
  faint: "var(--jsb-muted)",
};
