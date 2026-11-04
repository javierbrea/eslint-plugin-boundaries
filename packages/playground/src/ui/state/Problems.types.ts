import type { ProblemLevel } from "../../engine";
import type { Tone } from "../common";
import type { IconName } from "../icons";

import type { Target } from "./Focus.types";

/** A tab of the problems panel: one level of what is in focus. */
export type ProblemsTab<Id extends string = string> = {
  /** Identifies the tab among the tabs of the panel. It is what `onSelect` receives and what `selected` holds. */
  readonly id: Id;
  /** The text of the tab. */
  readonly label: string;
  /** Draws the label in the mono font, for paths and `line 3`. */
  readonly mono?: boolean;
  /** How many problems the tab lists. The badge is drawn for a positive count only. */
  readonly count?: number;
  /** The color of the badge and of the icon. The badge is `bad` when it is unset, and the icon takes the color of the label. */
  readonly tone?: Tone;
  /** An icon after the label, drawn in the tone of the tab. */
  readonly icon?: IconName;
};

/** A row of the problem list. */
export type ProblemItem = {
  /** Identifies the row among the rows of the list. */
  readonly key: string;
  /** How serious the problem is: the icon of the row follows it. */
  readonly level: ProblemLevel;
  /** What the problem is about, such as `eslint.config.js`, drawn in mono. */
  readonly location: string;
  /** Where in the location, such as `:15:16`, drawn in mono next to it. */
  readonly position?: string;
  /** What is wrong, as a sentence. */
  readonly message: string;
  /** The line below the message, in the muted color: the level and the path of the config entry, or the line of text that could not be read. */
  readonly meta: string;
  /** What the row opens. A row without one, such as a line of text mode that is already in front of the user, opens nothing. */
  readonly target?: Target;
};

/** What the panes show of the problems: how many there are and how serious they are, for the status of the bar, the tabs and the badge of the config node. */
export type ProblemSummary = {
  /** Problems of the config. */
  readonly configCount: number;
  /** The color of the count of the config. */
  readonly configTone: Tone;
  /** Problems of the config and lines of text mode that could not be read. */
  readonly total: number;
  /** The color of the total. */
  readonly tone: Tone;
  /** Whether any problem of the config is an error. */
  readonly configHasErrors: boolean;
};

/** Problems per node of the tree, for its badge. */
export type ProblemCounts = {
  /** Problems of the config. */
  readonly config: number;
  /** Whether the config node turns red. */
  readonly configHasErrors: boolean;
  /** Failing dependencies per file and folder; empty until phase 6. */
  readonly byPath: ReadonlyMap<string, number>;
};

/** What the selected tab of the problems panel shows. */
export type ProblemListContent = {
  /** The rows, in order. */
  readonly items: readonly ProblemItem[];
  /** What to say when there are no rows. */
  readonly empty: string;
  /** Whether the note that the rule options are invalid goes above the rows. */
  readonly rulesNote: boolean;
};
