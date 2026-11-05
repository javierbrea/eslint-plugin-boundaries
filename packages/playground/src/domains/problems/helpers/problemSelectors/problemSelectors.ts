import type { ConfigProblem } from "@/domains/evaluation/helpers/engine";
import { readTextProblems } from "@/domains/project/helpers/sketch";
import type { TextProblem } from "@/domains/project/helpers/sketch";
import type { Focus, ProblemsTabId } from "@/domains/session/helpers/focus";

import type {
  ProblemCounts,
  ProblemListFacts,
  ProblemSubject,
  ProblemSummary,
  ProblemTabFacts,
} from "./problemSelectors.types";

/** No lines of text mode to report: the same array each time, so that what is derived from it does not change. */
const NO_TEXT_PROBLEMS: readonly TextProblem[] = [];

/** The problems that name a file or a folder: none until phase 6 evaluates dependencies. */
const NO_PATH_COUNTS: ProblemCounts["byPath"] = new Map();

/** The subject of the tab and of the list of the sketch. */
const SKETCH_SUBJECT: ProblemSubject = { kind: "sketch" };

/** The subject of the tab and of the list of the config. */
const CONFIG_SUBJECT: ProblemSubject = { kind: "config" };

/**
 * Gets the lines of text mode that cannot be read.
 * @param draft What the user typed in text mode, if anything.
 * @returns The lines that cannot be read, in order; the same empty array when there is no draft.
 */
export function getTextProblems(
  draft: string | undefined
): readonly TextProblem[] {
  return draft === undefined ? NO_TEXT_PROBLEMS : readTextProblems(draft);
}

/**
 * Counts the problems and tells whether any is an error.
 * @param problems The problems of the config.
 * @param textProblems The lines of text mode that could not be read, each one an error.
 * @returns The counts and the errors that the panes show.
 */
export function summarizeProblems(
  problems: readonly ConfigProblem[],
  textProblems: readonly TextProblem[]
): ProblemSummary {
  const configHasErrors = problems.some(({ level }) => level === "error");

  return {
    configCount: problems.length,
    configHasErrors,
    total: problems.length + textProblems.length,
    hasErrors: configHasErrors || textProblems.length > 0,
  };
}

/**
 * Gets the problems of each node of the tree, for the badges.
 * @param configCount How many problems the config has.
 * @param configHasErrors Whether any of them is an error.
 * @returns The problems of the config; the failing dependencies per path come with phase 6.
 */
export function getProblemCounts(
  configCount: number,
  configHasErrors: boolean
): ProblemCounts {
  return { config: configCount, configHasErrors, byPath: NO_PATH_COUNTS };
}

/**
 * Gets the tab of the problems panel that shows: the selected one, or the sketch's when nothing is in focus, which has no tab of its own.
 * @param openNode What is in focus.
 * @param tab The selected tab.
 * @returns The id of the tab that shows.
 */
export function getShownTab(
  openNode: Focus,
  tab: ProblemsTabId
): ProblemsTabId {
  return openNode.kind === "none" ? "sketch" : tab;
}

/**
 * Gets the facts of the tabs of the problems panel: the sketch's, and the one of the node in focus.
 * @param openNode What is in focus.
 * @param summary The summary of the problems.
 * @returns The tabs, in order.
 */
export function getProblemTabs(
  openNode: Focus,
  summary: ProblemSummary
): readonly ProblemTabFacts[] {
  const sketchTab: ProblemTabFacts = {
    id: "sketch",
    subject: SKETCH_SUBJECT,
    count: summary.total,
    hasErrors: summary.hasErrors,
  };

  if (openNode.kind === "config") {
    return [
      sketchTab,
      {
        id: "node",
        subject: CONFIG_SUBJECT,
        count: summary.configCount,
        hasErrors: summary.configHasErrors,
      },
    ];
  }
  if (openNode.kind === "file") {
    return [
      sketchTab,
      { id: "node", subject: { kind: "file", path: openNode.path } },
    ];
  }
  return [sketchTab];
}

/**
 * Gets the facts of what the tab that shows lists: the problems of the config and the lines of text mode for the sketch, the problems of the config for the config node, and nothing for a file until phase 6. The note about invalid rule options goes above the lists of the sketch and of the config.
 * @param tab The tab that shows.
 * @param openNode What is in focus.
 * @param problems The problems of the config.
 * @param rulesValid Whether the rule options are valid.
 * @param textProblems The lines of text mode that could not be read.
 * @returns What the list is about, the problems it holds, and whether the note shows.
 */
export function getProblemList(
  tab: ProblemsTabId,
  openNode: Focus,
  problems: readonly ConfigProblem[],
  rulesValid: boolean,
  textProblems: readonly TextProblem[]
): ProblemListFacts {
  if (tab === "sketch" || openNode.kind === "none") {
    return {
      subject: SKETCH_SUBJECT,
      configProblems: problems,
      textProblems,
      rulesNote: !rulesValid,
    };
  }
  if (openNode.kind === "config") {
    return {
      subject: CONFIG_SUBJECT,
      configProblems: problems,
      textProblems: NO_TEXT_PROBLEMS,
      rulesNote: !rulesValid,
    };
  }
  return {
    subject: { kind: "file", path: openNode.path },
    configProblems: [],
    textProblems: NO_TEXT_PROBLEMS,
    rulesNote: false,
  };
}
