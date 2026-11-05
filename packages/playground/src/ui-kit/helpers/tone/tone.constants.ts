import type { Tone } from "./tone.types";

/** The color of each tone, from the host's tokens. */
export const TONE_COLORS: Readonly<Record<Tone, string>> = {
  bad: "var(--jsb-bad)",
  warn: "var(--jsb-warn)",
};
