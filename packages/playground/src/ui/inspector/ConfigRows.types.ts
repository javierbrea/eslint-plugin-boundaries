import type { Tone } from "../common";
import type { Target } from "../state";

/** What a row of the config inspector says about an entry of the config. */
export type ConfigRow = {
  /** Stable among the rows of a list. */
  readonly key: string;
  /** The type, the category or the rule. */
  readonly name: string;
  /** The color of the name, when the entry itself is what the user has to look at, such as an ignored descriptor. */
  readonly nameTone?: Tone;
  /** At the end of the row: how many files or policies, or what is wrong. */
  readonly status: string;
  /** The color of the status; muted when it is unset. */
  readonly statusTone?: Tone;
  /** Below the name: its patterns, or what is wrong. */
  readonly detail?: string;
  /** What the row opens: the entry in the config text. */
  readonly target: Target;
};
