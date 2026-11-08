import { tokenizeConfig } from "@/domains/evaluation/helpers/engine";
import type {
  ConfigProblem,
  DependencyResult,
  DependencyVerdict,
  PolicyRef,
  TextRange,
} from "@/domains/evaluation/helpers/engine";
import {
  getParentPath,
  readTextProblems,
} from "@/domains/project/helpers/sketch";
import type {
  DependencyRef,
  TextProblem,
} from "@/domains/project/helpers/sketch";
import type {
  Focus,
  PolicyHighlight,
  ProblemsTabId,
} from "@/domains/session/helpers/focus";

import type {
  DependencyDetailFacts,
  FailingDependency,
  HighlightFacts,
  PathCount,
  PolicyFacts,
  ProblemCounts,
  ProblemEvaluation,
  ProblemListFacts,
  ProblemListInputs,
  ProblemSummary,
  ProblemTabBadge,
  ProblemTabFacts,
} from "./problemSelectors.types";

/** No lines of text mode to report: the same array each time, so that what is derived from it does not change. */
const NO_TEXT_PROBLEMS: readonly TextProblem[] = [];

/** No problems of the config to report: the same array each time, as for the lines of text mode. */
const NO_CONFIG_PROBLEMS: readonly ConfigProblem[] = [];

/** No failing dependencies to list: the same array each time, as for the lines of text mode. */
const NO_FAILING_DEPENDENCIES: readonly FailingDependency[] = [];

/** The failing dependencies per path when there are none: the same map each time, so that a count that changes does not change it. */
const NO_PATH_COUNTS: ProblemCounts["byPath"] = new Map();

/** The subject of the tab and of the list of the sketch. */
const SKETCH_SUBJECT = { kind: "sketch" } as const;

/** The subject of the tab and of the list of the config. */
const CONFIG_SUBJECT = { kind: "config" } as const;

/**
 * Tells whether a verdict is the one of a dependency that fails.
 * @param result A dependency with its verdict.
 * @returns `true` when the rule disallows it, as an error or as a warning.
 */
function isFailing(result: DependencyResult): result is FailingDependency {
  return result.verdict.status === "disallowed";
}

/**
 * Gets the dependencies that fail.
 * @param dependencies A verdict for every dependency of the sketch.
 * @returns The ones that the rule disallows, in the same order.
 */
function getFailingDependencies(
  dependencies: readonly DependencyResult[]
): readonly FailingDependency[] {
  return dependencies.filter(isFailing);
}

/**
 * Tells whether a failing dependency is an error, which is when the rule has the severity `error`.
 * @param failing A dependency that fails.
 */
function isError(failing: FailingDependency): boolean {
  return failing.verdict.level === "error";
}

/**
 * Finds the verdict of a dependency among the ones of the evaluation.
 * @param dependencies A verdict for every dependency of the sketch.
 * @param ref The file and the position of the dependency.
 * @returns The dependency with its verdict, or `undefined` when the evaluation does not have it.
 */
function findResult(
  dependencies: readonly DependencyResult[],
  ref: DependencyRef
): DependencyResult | undefined {
  return dependencies.find(
    ({ ref: candidate }) =>
      candidate.path === ref.path && candidate.index === ref.index
  );
}

/**
 * Gets the lines of text mode that cannot be read. It reads the draft as the session does, so that the lines it reports are the ones that keep the draft from settling.
 * @param draft What the user typed in text mode, if anything.
 * @param readsDependencies Whether text mode reads the dependency lines, which is when the host lets the user edit dependencies. When it does not, those lines are never problems.
 * @returns The lines that cannot be read, in order; the same empty array when there is no draft.
 */
export function getTextProblems(
  draft: string | undefined,
  readsDependencies: boolean
): readonly TextProblem[] {
  return draft === undefined
    ? NO_TEXT_PROBLEMS
    : readTextProblems(draft, { dependencies: readsDependencies });
}

/**
 * Counts the problems and tells whether any is an error.
 * @param problems The problems of the config.
 * @param textProblems The lines of text mode that could not be read, each one an error.
 * @param dependencies A verdict for every dependency of the sketch: the ones that the rule disallows are problems, and errors only when the severity of the rule is `error`.
 * @returns The counts and the errors that the panes show.
 */
export function summarizeProblems(
  problems: readonly ConfigProblem[],
  textProblems: readonly TextProblem[],
  dependencies: readonly DependencyResult[]
): ProblemSummary {
  const configHasErrors = problems.some(({ level }) => level === "error");
  const failing = getFailingDependencies(dependencies);

  return {
    configCount: problems.length,
    configHasErrors,
    total: problems.length + textProblems.length + failing.length,
    hasErrors:
      configHasErrors || textProblems.length > 0 || failing.some(isError),
  };
}

/**
 * Adds one failing dependency to the count of a path.
 * @param counts The counts by path.
 * @param path The path.
 * @param isFailureAnError Whether the dependency is an error, which makes the path have errors.
 */
function increment(
  counts: Map<string, PathCount>,
  path: string,
  isFailureAnError: boolean
): void {
  const known = counts.get(path);

  counts.set(path, {
    count: (known?.count ?? 0) + 1,
    hasErrors: (known?.hasErrors ?? false) || isFailureAnError,
  });
}

/**
 * Counts the failing dependencies of each file and, summed, of each folder above it, and tells which of them have errors.
 * @param failing The dependencies that fail.
 * @returns The counts by path; the shared empty map when there are none.
 */
function countByPath(
  failing: readonly FailingDependency[]
): ProblemCounts["byPath"] {
  const counts = new Map<string, PathCount>();

  for (const dependency of failing) {
    const { ref } = dependency;
    const isFailureAnError = isError(dependency);

    increment(counts, ref.path, isFailureAnError);
    for (
      let folder = getParentPath(ref.path);
      folder !== "";
      folder = getParentPath(folder)
    ) {
      increment(counts, folder, isFailureAnError);
    }
  }
  return counts.size === 0 ? NO_PATH_COUNTS : counts;
}

/**
 * Gets the problems of each node of the tree, for the badges.
 * @param configCount How many problems the config has.
 * @param configHasErrors Whether any of them is an error.
 * @param dependencies A verdict for every dependency of the sketch.
 * @returns The problems of the config, and the failing dependencies of each file and of each folder.
 */
export function getProblemCounts(
  configCount: number,
  configHasErrors: boolean,
  dependencies: readonly DependencyResult[]
): ProblemCounts {
  return {
    config: configCount,
    configHasErrors,
    byPath: countByPath(getFailingDependencies(dependencies)),
  };
}

/**
 * Tells whether two counts say the same: the same problems of the config, and the same count, with the same errors, for each path.
 * @param first The counts.
 * @param second The other counts.
 */
function isSameCounts(first: ProblemCounts, second: ProblemCounts): boolean {
  return (
    first.config === second.config &&
    first.configHasErrors === second.configHasErrors &&
    first.byPath.size === second.byPath.size &&
    Array.from(first.byPath).every(([path, count]) => {
      const other = second.byPath.get(path);

      return (
        other?.count === count.count && other.hasErrors === count.hasErrors
      );
    })
  );
}

/**
 * Creates a function that gives the counts of the nodes of the tree and remembers the last ones, so that counts that say what the last ones said are the same object. An evaluation that changes no count then renders no item of the tree, even though it holds new verdicts.
 * @returns The function, which takes what {@link getProblemCounts} takes.
 */
export function createProblemCountsReader(): (
  configCount: number,
  configHasErrors: boolean,
  dependencies: readonly DependencyResult[]
) => ProblemCounts {
  let previous: ProblemCounts | undefined;

  return (configCount, configHasErrors, dependencies) => {
    const counts = getProblemCounts(configCount, configHasErrors, dependencies);

    if (previous === undefined || !isSameCounts(previous, counts)) {
      previous = counts;
    }
    return previous;
  };
}

/**
 * Gets the tab of the problems panel that shows: the selected one, the sketch's when nothing is in focus, which has no tab of its own, and the node's when the dependency's is selected but no dependency is in focus.
 * @param openNode What is in focus.
 * @param tab The selected tab.
 * @returns The id of the tab that shows.
 */
export function getShownTab(
  openNode: Focus,
  tab: ProblemsTabId
): ProblemsTabId {
  if (openNode.kind === "none") {
    return "sketch";
  }
  return tab === "dependency" && openNode.kind !== "dependency" ? "node" : tab;
}

/**
 * Counts the failing dependencies of a file.
 * @param dependencies A verdict for every dependency of the sketch.
 * @param path The path of the file.
 * @returns How many fail, and whether any is an error.
 */
function getFileBadge(
  dependencies: readonly DependencyResult[],
  path: string
): ProblemTabBadge {
  const failing = getFailingDependencies(dependencies).filter(
    ({ ref }) => ref.path === path
  );

  return { count: failing.length, hasErrors: failing.some(isError) };
}

/**
 * Gets the facts of the tabs of the problems panel: the sketch's, the one of the node in focus (a file, which is the file of a dependency in focus too, or the config) and, for a dependency in focus, its own.
 * @param openNode What is in focus.
 * @param summary The summary of the problems.
 * @param dependencies A verdict for every dependency of the sketch.
 * @returns The tabs, in order.
 */
export function getProblemTabs(
  openNode: Focus,
  summary: ProblemSummary,
  dependencies: readonly DependencyResult[]
): readonly ProblemTabFacts[] {
  const sketchTab: ProblemTabFacts = {
    id: "sketch",
    subject: SKETCH_SUBJECT,
    badge: { count: summary.total, hasErrors: summary.hasErrors },
  };

  if (openNode.kind === "config") {
    return [
      sketchTab,
      {
        id: "node",
        subject: CONFIG_SUBJECT,
        badge: {
          count: summary.configCount,
          hasErrors: summary.configHasErrors,
        },
      },
    ];
  }

  if (openNode.kind === "none") {
    return [sketchTab];
  }

  const { path } = openNode;
  const fileTab: ProblemTabFacts = {
    id: "node",
    subject: { kind: "file", path },
    badge: getFileBadge(dependencies, path),
  };

  if (openNode.kind === "file") {
    return [sketchTab, fileTab];
  }

  const ref = { path, index: openNode.index };

  return [
    sketchTab,
    fileTab,
    {
      id: "dependency",
      subject: { kind: "dependency", ref },
      verdict: findResult(dependencies, ref)?.verdict,
    },
  ];
}

/**
 * Gets the policy that decided a dependency.
 * @param verdict What the engine says about the dependency.
 * @returns The policy of an allowed or a disallowed dependency, and `undefined` for the others and for one whose custom message failed to render.
 */
function getPolicyRef(verdict: DependencyVerdict): PolicyRef | undefined {
  return verdict.status === "allowed" || verdict.status === "disallowed"
    ? verdict.policy
    : undefined;
}

/**
 * Reads the text of a policy from the config text, as the policy card shows it: the lines after the first lose the indentation that the policy has in the config, which is its column.
 * @param config The config text that the ranges belong to.
 * @param range Where the policy is written.
 * @returns The text at the range, in lines of `\n` with the indentation of the first line taken from all of them.
 */
function getPolicyText(config: string, range: TextRange): string {
  const indent = new RegExp(`^[ \\t]{0,${range.column - 1}}`);

  return config
    .slice(range.from, range.to)
    .split(/\r?\n/)
    .map((line, index) => (index === 0 ? line : line.replace(indent, "")))
    .join("\n");
}

/**
 * Gets the facts of the body of the dependency tab. The text of the policy is split into the pieces that the card colors, with the engine, which is the only code that reads the config text as JSON5.
 * @param evaluation What the engine says about the sketch.
 * @param ref The dependency in focus.
 * @returns The facts, or `undefined` when the evaluation does not have the dependency.
 */
function getDependencyDetail(
  evaluation: ProblemEvaluation,
  ref: DependencyRef
): DependencyDetailFacts | undefined {
  const result = findResult(evaluation.dependencies, ref);

  if (result === undefined) {
    return undefined;
  }

  const { target } = result.dependency;
  const policyRef = getPolicyRef(result.verdict);
  const policy: PolicyFacts | undefined =
    policyRef === undefined
      ? undefined
      : {
          index: policyRef.index,
          range: policyRef.range,
          tokens: tokenizeConfig(
            getPolicyText(evaluation.sketch.config, policyRef.range)
          ),
        };

  return {
    subject: { kind: "dependency", ref },
    result,
    description:
      target.kind === "node" ? evaluation.files.get(target.path) : undefined,
    policy,
  };
}

/**
 * Gives the policy that a highlight names. The highlight carries the index of its policy, which the session finds again by the range of the highlight each time the config is evaluated, so that the note keeps saying which policy it is when the user adds or deletes one before it; the index is `undefined` when no policy of the evaluation starts at the range, and the note leaves the number out.
 * @param highlight The policy that the user opened from a dependency, if any.
 * @returns The policy, which can be unknown, and the dependency, or `undefined` when there is no highlight.
 */
function getHighlightFacts(
  highlight: PolicyHighlight | undefined
): HighlightFacts | undefined {
  return highlight === undefined
    ? undefined
    : { policy: highlight.policy, dependency: highlight.dependency };
}

/**
 * Gets the facts of what the tab that shows lists. The sketch lists the problems of the config, the lines of text mode and the failing dependencies; a file lists its failing dependencies; the config lists its problems; a dependency gives its verdict, the file it points to and its policy. The note about why no dependency is evaluated goes above the lists of the sketch and of the config, and the one about the highlighted policy above the list of the config.
 * @param inputs The tab that shows, what is in focus, what the engine says about the sketch, the lines of text mode that could not be read and the highlighted policy.
 * @param inputs.tab
 * @param inputs.openNode
 * @param inputs.evaluation
 * @param inputs.textProblems
 * @param inputs.highlight
 * @returns What the list is about and what it holds.
 */
export function getProblemList({
  tab,
  openNode,
  evaluation,
  textProblems,
  highlight,
}: ProblemListInputs): ProblemListFacts {
  const { problems, dependencies, notEvaluated } = evaluation;
  const failing = getFailingDependencies(dependencies);

  if (tab === "sketch" || openNode.kind === "none") {
    return {
      subject: SKETCH_SUBJECT,
      configProblems: problems,
      textProblems,
      dependencies: failing,
      notEvaluated,
      highlight: undefined,
    };
  }
  if (openNode.kind === "config") {
    return {
      subject: CONFIG_SUBJECT,
      configProblems: problems,
      textProblems: NO_TEXT_PROBLEMS,
      dependencies: NO_FAILING_DEPENDENCIES,
      notEvaluated,
      highlight: getHighlightFacts(highlight),
    };
  }

  const detail =
    tab === "dependency" && openNode.kind === "dependency"
      ? getDependencyDetail(evaluation, {
          path: openNode.path,
          index: openNode.index,
        })
      : undefined;

  return (
    detail ?? {
      subject: { kind: "file", path: openNode.path },
      configProblems: NO_CONFIG_PROBLEMS,
      textProblems: NO_TEXT_PROBLEMS,
      dependencies: failing.filter(({ ref }) => ref.path === openNode.path),
      notEvaluated: undefined,
      highlight: undefined,
    }
  );
}
