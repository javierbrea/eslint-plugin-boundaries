import type { ProblemLevel } from "@/domains/evaluation/helpers/engine";
import type {
  VerdictIcon,
  VerdictTone,
} from "@/domains/evaluation/ui/helpers/verdictText";
import type { DependencyDetailContent } from "@/domains/problems/ui/helpers/dependencyDetail";
import type { Target } from "@/domains/session/helpers/focus";
import type { Tone } from "@/ui-kit/helpers/tone";

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
  /** The color of the badge, and of the icon when the tab has no `iconTone`. The badge is `bad` when it is unset. */
  readonly tone?: Tone;
  /** An icon after the label, such as the one of the verdict of a dependency. */
  readonly icon?: VerdictIcon;
  /** The color of the icon, which a verdict gives in more tones than a count has. The icon takes the `tone` of the tab when it is unset. */
  readonly iconTone?: VerdictTone;
};

/** A row of the problem list. */
export type ProblemItem = {
  /** Identifies the row among the rows of the list. */
  readonly key: string;
  /** How serious the problem is: the icon of the row follows it. */
  readonly level: ProblemLevel;
  /** What the problem is about, such as `eslint.config.js`, drawn in mono. A row of a list that is about one file, such as the failing dependencies of that file, has none. */
  readonly location?: string;
  /** Where in the location, such as `:15:16`, or the line of a dependency, such as `:3`, drawn in mono next to it. */
  readonly position?: string;
  /** The source that the statement of a dependency writes, drawn in mono after the position. An arrow introduces it when the row has a location. */
  readonly source?: string;
  /** What is wrong, as a sentence. */
  readonly message: string;
  /** The line below the message, in the muted color: the level and the path of the config entry, the policy that disallowed a dependency, or the line of text that could not be read. */
  readonly meta: string;
  /** What the row opens. A row without one, such as a line of text mode that is already in front of the user, opens nothing. */
  readonly target?: Target;
};

/** What the selected tab of the problems panel shows. */
export type ProblemListContent = {
  /** The rows, in order. */
  readonly items: readonly ProblemItem[];
  /** What to say when there are no rows. `undefined` when a note says it, and for the body of a dependency, which has no rows. */
  readonly empty: string | undefined;
  /** The notes above the rows, in order, each one a sentence: why no dependency is evaluated, and which policy of the config is highlighted. */
  readonly notes: readonly string[];
  /** The body of the tab of a dependency, which replaces the notes and the rows. */
  readonly detail: DependencyDetailContent | undefined;
};
