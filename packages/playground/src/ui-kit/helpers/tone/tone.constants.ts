import type { StateTone } from "./tone.types";

/** The color of each tone for a shape, such as an icon, a count badge, a dot or an outline, from the tokens of the host. */
export const TONE_COLORS: Readonly<Record<StateTone, string>> = {
  ok: "var(--jsb-ok)",
  bad: "var(--jsb-bad)",
  warn: "var(--jsb-warn)",
  faint: "var(--jsb-faint)",
};

/** Text in the color of a tone outside a code area. It mixes 15% of `--jsb-ink` into the token of the tone so that it passes 4.5:1 on `--jsb-card` in both color schemes, and not-checked text is `--jsb-muted`. Icons, count badges, dots and outlines keep the plain tokens of {@link TONE_COLORS}, which are meant for shapes, and code areas have their own colors. */
export const STATE_TEXT: Readonly<Record<StateTone, string>> = {
  ok: "color-mix(in srgb, var(--jsb-ok) 85%, var(--jsb-ink))",
  bad: "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))",
  warn: "color-mix(in srgb, var(--jsb-warn) 85%, var(--jsb-ink))",
  faint: "var(--jsb-muted)",
};
