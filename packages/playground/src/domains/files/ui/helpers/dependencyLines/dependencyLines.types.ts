import type {
  VerdictIcon,
  VerdictTone,
} from "@/domains/evaluation/ui/helpers/verdictText";
import type { StatementToken } from "@/domains/project/helpers/sketch";

/** A line of the dependency list of a file: its statement and what the engine says about it. */
export type DependencyLine = {
  /** Stable among the lines of a list: the file and the position of the dependency in it. */
  readonly id: string;
  /** The pieces of the statement that creates the dependency, so that the list colors them. */
  readonly tokens: readonly StatementToken[];
  /** The icon of the verdict. */
  readonly icon: VerdictIcon;
  /** What the icon says to assistive technology, which the text of the verdict does not: `allowed` or `disallowed`. It is `undefined` for the icon of a dependency that is not checked or not evaluated, which the text already says, and then the icon is decoration. */
  readonly iconLabel: string | undefined;
  /** The color of the verdict. */
  readonly tone: VerdictTone;
  /** What the verdict reads after its icon, such as `policy 2` or `not checked · external`. */
  readonly label: string;
  /** Why the rule does not check the dependency, in a sentence, for the tooltip of a dependency that is not checked. It is `undefined` for any other verdict. */
  readonly hint: string | undefined;
};
