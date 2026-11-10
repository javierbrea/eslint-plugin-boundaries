import type { VerdictIcon } from "@/domains/evaluation/ui/helpers/verdictText";
import type { StatementToken } from "@/domains/project/helpers/sketch";
import type { StateTone } from "@/ui-kit/helpers/tone";

/** A line of the dependency list of a file: its statement and what the engine says about it. */
export type DependencyLine = {
  /** Stable among the lines of a list: the file and the position of the dependency in it. */
  readonly id: string;
  /** The pieces of the statement that creates the dependency, so that the list colors them. */
  readonly tokens: readonly StatementToken[];
  /** The icon of the verdict, or `undefined` when the line shows no verdict yet. */
  readonly icon: VerdictIcon | undefined;
  /** What the icon says to assistive technology, which the text of the verdict does not: `allowed` or `disallowed`. It is `undefined` for the icon of a dependency that is not checked or not evaluated, which the text already says, and then the icon is decoration. */
  readonly iconLabel: string | undefined;
  /** The color of the verdict. */
  readonly tone: StateTone;
  /** What the verdict reads after its icon, such as `policy 2` or `not checked · external`, or an empty text when the line shows no verdict yet. */
  readonly label: string;
  /** Why the rule does not check the dependency, in a sentence, for the tooltip of a dependency that is not checked. It is `undefined` for any other verdict. */
  readonly hint: string | undefined;
  /** Whether the verdict is of an evaluation that is out of date and late, stopped or failed, which fades it. */
  readonly dimmed: boolean;
};
