import type { ConfigProblem } from "@/domains/evaluation/helpers/engine";
import type { TextProblem } from "@/domains/project/helpers/sketch";
import type { ProblemsTabId } from "@/domains/session/helpers/focus";

/** How many problems there are and how serious they are, for the status of the bar, the tabs and the badge of the config node. */
export type ProblemSummary = {
  /** Problems of the config. */
  readonly configCount: number;
  /** Whether any problem of the config is an error. */
  readonly configHasErrors: boolean;
  /** Problems of the config and lines of text mode that could not be read. */
  readonly total: number;
  /** Whether any problem of the config is an error, or any line of text mode could not be read, which is always an error. */
  readonly hasErrors: boolean;
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

/** What a tab of the problems panel, or the list under it, is about. */
export type ProblemSubject =
  | { readonly kind: "sketch" }
  | { readonly kind: "config" }
  | { readonly kind: "file"; readonly path: string };

/** The facts of a tab of the problems panel. */
export type ProblemTabFacts = {
  /** Identifies the tab among the tabs of the panel. */
  readonly id: ProblemsTabId;
  /** What the tab is about. */
  readonly subject: ProblemSubject;
  /** How many problems the tab lists. A tab that does not count them, such as the one of a file, has none. */
  readonly count?: number;
  /** Whether any problem the tab counts is an error. A tab that does not count them has none. */
  readonly hasErrors?: boolean;
};

/** The facts of what the tab that shows lists. */
export type ProblemListFacts = {
  /** What the list is about. */
  readonly subject: ProblemSubject;
  /** The problems of the config that the list holds, in order. */
  readonly configProblems: readonly ConfigProblem[];
  /** The lines of text mode that could not be read that the list holds, in order. */
  readonly textProblems: readonly TextProblem[];
  /** Whether the note that the rule options are invalid goes above the list. */
  readonly rulesNote: boolean;
};
