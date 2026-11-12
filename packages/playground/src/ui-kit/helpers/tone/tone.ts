import type { Tone } from "./tone.types";

/**
 * Chooses the color of a count.
 * @param hasErrors Whether any of the problems that are counted is an error.
 * @returns `bad` when any of them is an error, and `warn` otherwise.
 */
export function getCountTone(hasErrors: boolean): Tone {
  return hasErrors ? "bad" : "warn";
}
