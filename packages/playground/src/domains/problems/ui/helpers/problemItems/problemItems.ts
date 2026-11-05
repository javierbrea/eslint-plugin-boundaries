import type { ConfigProblem } from "@/domains/evaluation/helpers/engine";
import type {
  ProblemListFacts,
  ProblemSubject,
  ProblemTabFacts,
} from "@/domains/problems/helpers/problemSelectors";
import { CONFIG_PATH } from "@/domains/project/helpers/sketch";
import type { TextProblem } from "@/domains/project/helpers/sketch";
import type { ProblemsTabId } from "@/domains/session/helpers/focus";
import type { Tone } from "@/ui-kit/helpers/tone";

import type {
  ProblemItem,
  ProblemListContent,
  ProblemsTab,
} from "./problemItems.types";

/** Where the problems of text mode are placed: they are about the project as a whole, and not about a file. */
const TEXT_LOCATION = "Project text";

/** What to say when a list has no rows, by what the list is about. */
const EMPTY_TEXTS: Readonly<Record<ProblemSubject["kind"], string>> = {
  sketch: "No problems in the sketch.",
  config: "No problems in the config.",
  file: "No problems in this file.",
};

/**
 * Writes the message of a config problem: its title and its detail as one sentence. A row of the list is a button, which cannot hold a link, so the links of the problem are left out; the editor shows them in the tooltip.
 * @param problem The problem.
 * @returns The title, followed by the detail when it has one.
 */
function getConfigMessage(problem: ConfigProblem): string {
  return problem.detail === undefined
    ? problem.title
    : `${problem.title} ${problem.detail}`;
}

/**
 * Writes the meta line of a config problem: its level and the path of the entry it is about.
 * @param problem The problem.
 * @returns The level, followed by the path joined with ` › `. A problem about the whole config has no path.
 */
function getConfigMeta(problem: ConfigProblem): string {
  return problem.path.length === 0
    ? problem.level
    : `${problem.level} · ${problem.path.join(" › ")}`;
}

/**
 * Turns the problems of the config into rows of the problem list.
 * @param problems The problems of the config, as the engine returns them.
 * @returns One row for each problem, in the same order, with the key `config:<index>`. Each opens the config at the range of its problem.
 */
export function getConfigProblemItems(
  problems: readonly ConfigProblem[]
): ProblemItem[] {
  return problems.map((problem, index) => ({
    key: `config:${index}`,
    level: problem.level,
    location: CONFIG_PATH,
    position: `:${problem.range.line}:${problem.range.column}`,
    message: getConfigMessage(problem),
    meta: getConfigMeta(problem),
    target: { kind: "config", range: problem.range },
  }));
}

/**
 * Turns the lines of text mode that could not be read into rows of the problem list.
 * @param problems The lines that were left out, as `fromText` returns them.
 * @returns One row for each line, in the same order, with the key `text:<index>`. Each is an error that shows the reason and, below it, the line as it was written. It opens nothing: the line is already in front of the user, in the text it is about.
 */
export function getTextProblemItems(
  problems: readonly TextProblem[]
): ProblemItem[] {
  return problems.map(({ line, text, reason }, index) => ({
    key: `text:${index}`,
    level: "error",
    location: TEXT_LOCATION,
    position: `:${line}`,
    message: reason,
    meta: text,
  }));
}

/**
 * Names the tab of a file: the folder that holds it and its name, which tell it apart from files of the same name elsewhere without the whole path.
 * @param path The path of the file, from the root of the sketch.
 * @returns The last two segments of the path joined by `/`, such as `checkout/index.js`; the name alone for a file at the root.
 */
export function getTabLabel(path: string): string {
  return path.split("/").slice(-2).join("/");
}

/**
 * Chooses the color of a count.
 * @param hasErrors Whether any of the problems that are counted is an error.
 * @returns `bad` when any of them is an error, and `warn` otherwise.
 */
export function getCountTone(hasErrors: boolean): Tone {
  return hasErrors ? "bad" : "warn";
}

/**
 * Names the tab of a subject.
 * @param subject What the tab is about.
 * @returns The text of the tab: `Sketch`, the path of the config, or the folder and the name of the file.
 */
function getSubjectLabel(subject: ProblemSubject): string {
  if (subject.kind === "sketch") {
    return "Sketch";
  }
  return subject.kind === "config" ? CONFIG_PATH : getTabLabel(subject.path);
}

/**
 * Turns the facts of the tabs of the problems panel into the tabs it draws.
 * @param tabFacts The facts of the tabs, as `getProblemTabs` returns them.
 * @returns One tab for each fact, in the same order. The tab of the sketch is in the sans font and the others in mono; a tab that counts has a badge in the tone of its errors.
 */
export function toProblemsTabs(
  tabFacts: readonly ProblemTabFacts[]
): ProblemsTab<ProblemsTabId>[] {
  return tabFacts.map(({ id, subject, count, hasErrors }) => {
    const tab: ProblemsTab<ProblemsTabId> = {
      id,
      label: getSubjectLabel(subject),
      ...(subject.kind === "sketch" ? {} : { mono: true }),
    };

    return count === undefined
      ? tab
      : { ...tab, count, tone: getCountTone(hasErrors === true) };
  });
}

/**
 * Turns the facts of what the tab that shows lists into what the list draws.
 * @param listFacts The facts of the list, as `getProblemList` returns them.
 * @returns The rows, with the problems of the config first, and what to say when there are none.
 */
export function toProblemListContent(
  listFacts: ProblemListFacts
): ProblemListContent {
  const { subject, configProblems, textProblems, rulesNote } = listFacts;

  return {
    items: [
      ...getConfigProblemItems(configProblems),
      ...getTextProblemItems(textProblems),
    ],
    empty: EMPTY_TEXTS[subject.kind],
    rulesNote,
  };
}
