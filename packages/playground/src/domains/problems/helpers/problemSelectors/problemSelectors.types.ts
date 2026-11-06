import type {
  ConfigProblem,
  ConfigToken,
  DependencyResult,
  DependencyVerdict,
  Evaluation,
  FileDescription,
  NotEvaluatedReason,
  TextRange,
} from "@/domains/evaluation/helpers/engine";
import type {
  DependencyRef,
  TextProblem,
} from "@/domains/project/helpers/sketch";
import type {
  Focus,
  PolicyHighlight,
  ProblemsTabId,
} from "@/domains/session/helpers/focus";

/** The verdict of a dependency that the rule disallows. */
export type DisallowedVerdict = Extract<
  DependencyVerdict,
  { status: "disallowed" }
>;

/** A dependency that fails: the rule disallows it, as an error or as a warning. */
export type FailingDependency = DependencyResult & {
  /** Its verdict, which is the one of a disallowed dependency. */
  readonly verdict: DisallowedVerdict;
};

/** How many problems there are and how serious they are, for the status of the bar, the tabs and the badge of the config node. */
export type ProblemSummary = {
  /** Problems of the config. */
  readonly configCount: number;
  /** Whether any problem of the config is an error. */
  readonly configHasErrors: boolean;
  /** Problems of the config, lines of text mode that could not be read and failing dependencies. */
  readonly total: number;
  /** Whether any problem of the config is an error, any line of text mode could not be read, which is always an error, or any failing dependency is an error: a dependency that the rule disallows as a warning is not. */
  readonly hasErrors: boolean;
};

/** The failing dependencies of a file or of a folder. */
export type PathCount = {
  /** How many fail. */
  readonly count: number;
  /** Whether any of them is an error, because the rule has the severity `error`; when none is, they are all warnings. */
  readonly hasErrors: boolean;
};

/** Problems per node of the tree, for its badge. */
export type ProblemCounts = {
  /** Problems of the config. */
  readonly config: number;
  /** Whether the config node turns red. */
  readonly configHasErrors: boolean;
  /** Failing dependencies per file, and per folder as the sum of the files under it, with whether any is an error. A path with none is not in the map. */
  readonly byPath: ReadonlyMap<string, PathCount>;
};

/** What a tab of the problems panel, or the list under it, is about. */
export type ProblemSubject =
  | { readonly kind: "sketch" }
  | { readonly kind: "config" }
  | { readonly kind: "file"; readonly path: string }
  | { readonly kind: "dependency"; readonly ref: DependencyRef };

/** What a tab counts: how many problems it lists, and whether any of them is an error. */
export type ProblemTabBadge = {
  /** How many problems the tab lists. */
  readonly count: number;
  /** Whether any problem the tab counts is an error. */
  readonly hasErrors: boolean;
};

/** The facts of a tab of the problems panel. */
export type ProblemTabFacts = {
  /** Identifies the tab among the tabs of the panel. */
  readonly id: ProblemsTabId;
  /** What the tab is about. */
  readonly subject: ProblemSubject;
  /** What the tab counts. A tab that does not count its problems, such as the one of a dependency, has none. */
  readonly badge?: ProblemTabBadge;
  /** What the engine says about the dependency of the tab, which gives its icon and its tone. The tab of a dependency that the evaluation does not know has none. */
  readonly verdict?: DependencyVerdict;
};

/** What the lists read of the evaluation of the store. */
export type ProblemEvaluation = Pick<
  Evaluation,
  "sketch" | "problems" | "files" | "dependencies" | "notEvaluated"
>;

/** What `getProblemList` reads. */
export type ProblemListInputs = {
  /** The tab that shows. */
  readonly tab: ProblemsTabId;
  /** What is in focus. */
  readonly openNode: Focus;
  /** What the engine says about the sketch. */
  readonly evaluation: ProblemEvaluation;
  /** The lines of text mode that could not be read. */
  readonly textProblems: readonly TextProblem[];
  /** The policy that the user opened from a dependency, if any. */
  readonly highlight: PolicyHighlight | undefined;
};

/** The policy that the config tab keeps highlighted, and the dependency it was opened from. */
export type HighlightFacts = {
  /** The index of the policy in the options, or `null` for the default. */
  readonly policy: number | null;
  /** The dependency that `Open policy in config` came from. */
  readonly dependency: DependencyRef;
};

/** The facts of the lists of the sketch, of the config and of a file: rows, and the notes above them. */
export type ProblemRowsFacts = {
  /** What the list is about. */
  readonly subject: Exclude<ProblemSubject, { readonly kind: "dependency" }>;
  /** The problems of the config that the list holds, in order. */
  readonly configProblems: readonly ConfigProblem[];
  /** The lines of text mode that could not be read that the list holds, in order. */
  readonly textProblems: readonly TextProblem[];
  /** The failing dependencies that the list holds: all of them for the sketch, in the order of the sketch, and the ones of the file for a file. */
  readonly dependencies: readonly FailingDependency[];
  /** Why no dependency is evaluated, for the note above the list of the sketch and of the config. `undefined` when they are, and for the list of a file. */
  readonly notEvaluated: NotEvaluatedReason | undefined;
  /** The policy that is highlighted in the config, for the note above the list of the config. `undefined` when none is, and when no policy of the evaluation is at the highlighted range any more. */
  readonly highlight: HighlightFacts | undefined;
};

/** The policy that decided a dependency, as the card of the dependency tab shows it. */
export type PolicyFacts = {
  /** The index of the policy in the options, or `null` for the default. */
  readonly index: number | null;
  /** Where it is written in the config text. */
  readonly range: TextRange;
  /** Its text as written in the config, without the indentation that it has there, split into the pieces that the card colors as the editor does. The pieces joined are the text. */
  readonly tokens: readonly ConfigToken[];
};

/** The facts of the body of the dependency tab. */
export type DependencyDetailFacts = {
  /** What the body is about. */
  readonly subject: Extract<ProblemSubject, { readonly kind: "dependency" }>;
  /** The dependency with its verdict. */
  readonly result: DependencyResult;
  /** How the plugin describes the file that the dependency points to; `undefined` for an external module. */
  readonly description: FileDescription | undefined;
  /** The policy that decided it; `undefined` when none did, such as for a dependency that is not checked. */
  readonly policy: PolicyFacts | undefined;
};

/** The facts of what the tab that shows lists: rows with their notes, or the body of a dependency. */
export type ProblemListFacts = ProblemRowsFacts | DependencyDetailFacts;
