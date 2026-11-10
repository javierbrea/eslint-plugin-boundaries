/** Class of the root element of the playground, the scope of every MUI variable and style */
export const ROOT_CLASS = "jsb-play-root";

/** Key of the Emotion cache of the playground, the prefix of its class names */
export const CACHE_KEY = "jsb-play";

/** Keyboard focus ring of every button, tab and toggle. A pane that draws a ring of its own, such as a scrolling panel or a row of the tree, uses it too, with the offset that suits where it sits */
export const FOCUS_RING = "2px solid var(--jsb-accent)";

/** Hover over a row or a toggle: the soft accent, fainter than a selection */
export const HOVER_BACKGROUND =
  "color-mix(in srgb, var(--jsb-accent-soft) 60%, transparent)";

/** The style of a region whose content is out of date: it fades, and comes back when the content is up to date. */
export const DIMMED = {
  opacity: 0.5,
  transition: "opacity 120ms ease-out",
} as const;

/** The style of the same region while its content is up to date, which `DIMMED` fades from. */
export const UNDIMMED = {
  opacity: 1,
  transition: DIMMED.transition,
} as const;
