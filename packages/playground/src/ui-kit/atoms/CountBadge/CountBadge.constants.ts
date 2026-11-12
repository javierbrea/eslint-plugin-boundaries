import type { Tone } from "@/ui-kit/helpers/tone";

/** The color of the number of a badge of each tone. It mixes 30% of `--jsb-ink` into the token of the tone so that the number passes 4.5:1 on the background of the badge in both color schemes, over the card, the paper, a selected row and a hovered one. The background keeps the plain token. */
export const COUNT_BADGE_TEXT_COLORS: Readonly<Record<Tone, string>> = {
  bad: "color-mix(in srgb, var(--jsb-bad) 70%, var(--jsb-ink))",
  warn: "color-mix(in srgb, var(--jsb-warn) 70%, var(--jsb-ink))",
};
