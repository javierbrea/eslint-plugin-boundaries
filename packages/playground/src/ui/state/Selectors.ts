import type { ConfigProblem, ProblemLevel } from "@/engine";
import { CONFIG_PATH, readTextProblems } from "@/sketch";
import type { TextProblem } from "@/sketch";

import type { Focus } from "./Focus.types";
import {
  getConfigProblemItems,
  getCountTone,
  getTabLabel,
  getTextProblemItems,
} from "./ProblemItems";
import type {
  ProblemCounts,
  ProblemListContent,
  ProblemSummary,
  ProblemsTab,
} from "./Problems.types";
import type { ProblemsTabId } from "./WorkbenchState.types";

/** No lines of text mode to report: the same array each time, so that what is derived from it does not change. */
const NO_TEXT_PROBLEMS: readonly TextProblem[] = [];

/** The problems that name a file or a folder: none until phase 6 evaluates dependencies. */
const NO_PATH_COUNTS: ProblemCounts["byPath"] = new Map();

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
 * Counts the problems and tells how serious they are.
 * @param problems The problems of the config.
 * @param textProblems The lines of text mode that could not be read, each one an error.
 * @returns The counts and tones that the panes show.
 */
export function summarizeProblems(
  problems: readonly ConfigProblem[],
  textProblems: readonly TextProblem[]
): ProblemSummary {
  const configLevels = problems.map(({ level }) => level);
  const textLevels = textProblems.map((): ProblemLevel => "error");

  return {
    configCount: problems.length,
    configTone: getCountTone(configLevels),
    total: problems.length + textProblems.length,
    tone: getCountTone([...configLevels, ...textLevels]),
    configHasErrors: configLevels.includes("error"),
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
 * Gets the tabs of the problems panel: the sketch's, and the one of the node in focus.
 * @param openNode What is in focus.
 * @param summary The summary of the problems.
 * @returns The tabs, in order.
 */
export function getProblemTabs(
  openNode: Focus,
  summary: ProblemSummary
): readonly ProblemsTab<ProblemsTabId>[] {
  const sketchTab: ProblemsTab<ProblemsTabId> = {
    id: "sketch",
    label: "Sketch",
    count: summary.total,
    tone: summary.tone,
  };

  if (openNode.kind === "config") {
    return [
      sketchTab,
      {
        id: "node",
        label: CONFIG_PATH,
        mono: true,
        count: summary.configCount,
        tone: summary.configTone,
      },
    ];
  }
  if (openNode.kind === "file") {
    return [
      sketchTab,
      { id: "node", label: getTabLabel(openNode.path), mono: true },
    ];
  }
  return [sketchTab];
}

/**
 * Gets what the tab that shows lists: the problems of the config and the lines of text mode for the sketch, the problems of the config for the config node, and nothing for a file until phase 6. The note about invalid rule options goes above the lists of the sketch and of the config.
 * @param tab The tab that shows.
 * @param openNode What is in focus.
 * @param problems The problems of the config.
 * @param rulesValid Whether the rule options are valid.
 * @param textProblems The lines of text mode that could not be read.
 * @returns The rows, the text for no rows, and whether the note shows.
 */
export function getProblemList(
  tab: ProblemsTabId,
  openNode: Focus,
  problems: readonly ConfigProblem[],
  rulesValid: boolean,
  textProblems: readonly TextProblem[]
): ProblemListContent {
  if (tab === "sketch" || openNode.kind === "none") {
    return {
      items: [
        ...getConfigProblemItems(problems),
        ...getTextProblemItems(textProblems),
      ],
      empty: "No problems in the sketch.",
      rulesNote: !rulesValid,
    };
  }
  if (openNode.kind === "config") {
    return {
      items: getConfigProblemItems(problems),
      empty: "No problems in the config.",
      rulesNote: !rulesValid,
    };
  }
  return { items: [], empty: "No problems in this file.", rulesNote: false };
}
