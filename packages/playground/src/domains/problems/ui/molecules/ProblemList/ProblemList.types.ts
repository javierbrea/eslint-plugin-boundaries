import type { ProblemItem } from "@/domains/problems/ui/helpers/problemItems";
import type { Target } from "@/domains/session/helpers/focus";

/** Props of {@link ProblemList}. */
export type ProblemListProps = {
  /** The rows, in order. */
  readonly items: readonly ProblemItem[];
  /** Called with the target of the row the user presses. Only a row with a target can be pressed. */
  readonly onOpen: (target: Target) => void;
  /** What to say when there are no rows, such as `No problems.` */
  readonly empty: string;
};

/** The text styles of a row, as its page object reads them. */
export type ProblemRowTextStyle = Pick<
  CSSStyleDeclaration,
  "fontFamily" | "fontSize" | "lineHeight"
>;

/** The styles of the content of a row that opens something, as its page object reads them. */
export type ProblemRowLayout = Pick<
  CSSStyleDeclaration,
  "display" | "alignItems" | "justifyContent"
>;

/** The text styles of the sentence that says there are no rows, as the page object of the list reads them. */
export type ProblemListEmptyStyle = Pick<
  CSSStyleDeclaration,
  "color" | "fontFamily" | "fontSize"
>;
