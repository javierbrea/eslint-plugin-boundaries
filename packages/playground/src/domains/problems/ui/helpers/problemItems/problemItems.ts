import type { ConfigProblem } from "@/domains/evaluation/helpers/engine";
import {
  getNotEvaluatedSentence,
  getVerdictIcon,
  getVerdictMeta,
  getVerdictTone,
} from "@/domains/evaluation/ui/helpers/verdictText";
import type {
  FailingDependency,
  HighlightFacts,
  ProblemListFacts,
  ProblemSubject,
  ProblemTabFacts,
} from "@/domains/problems/helpers/problemSelectors";
import { toDependencyDetail } from "@/domains/problems/ui/helpers/dependencyDetail";
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
const EMPTY_TEXTS: Readonly<
  Record<Exclude<ProblemSubject["kind"], "dependency">, string>
> = {
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
 * Turns the failing dependencies into rows of the problem list.
 * @param dependencies The dependencies that the rule disallows, as `getProblemList` returns them.
 * @param withLocation Whether a row says the file that has the dependency, as the list of the sketch does; the list of a file is about one file, and its rows start at the line.
 * @returns One row for each dependency, in the same order, with the key `dependency:<path>:<index>`. Each is the level of its verdict, shows the message of the plugin and the policy that disallowed it, and puts the dependency in focus.
 */
export function getDependencyProblemItems(
  dependencies: readonly FailingDependency[],
  withLocation: boolean
): ProblemItem[] {
  return dependencies.map(({ ref, source, verdict }) => ({
    key: `dependency:${ref.path}:${ref.index}`,
    level: verdict.level,
    ...(withLocation ? { location: ref.path } : {}),
    position: `:${ref.index + 1}`,
    source,
    message: verdict.message,
    meta: getVerdictMeta(verdict),
    target: { kind: "dependency", path: ref.path, index: ref.index },
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
 * @returns The text of the tab: `Sketch`, the path of the config, the folder and the name of the file, or `line 3` for a dependency.
 */
function getSubjectLabel(subject: ProblemSubject): string {
  switch (subject.kind) {
    case "sketch":
      return "Sketch";
    case "config":
      return CONFIG_PATH;
    case "file":
      return getTabLabel(subject.path);
    default:
      return `line ${subject.ref.index + 1}`;
  }
}

/**
 * Turns the facts of the tabs of the problems panel into the tabs it draws.
 * @param tabFacts The facts of the tabs, as `getProblemTabs` returns them.
 * @returns One tab for each fact, in the same order. The tab of the sketch is in the sans font and the others in mono; a tab that counts has a badge in the tone of its errors, and the tab of a dependency has the icon and the tone of its verdict instead.
 */
export function toProblemsTabs(
  tabFacts: readonly ProblemTabFacts[]
): ProblemsTab<ProblemsTabId>[] {
  return tabFacts.map(({ id, subject, badge, verdict }) => {
    const tab: ProblemsTab<ProblemsTabId> = {
      id,
      label: getSubjectLabel(subject),
      ...(subject.kind === "sketch" ? {} : { mono: true }),
      ...(verdict === undefined
        ? {}
        : { icon: getVerdictIcon(verdict), iconTone: getVerdictTone(verdict) }),
    };

    return badge === undefined
      ? tab
      : { ...tab, count: badge.count, tone: getCountTone(badge.hasErrors) };
  });
}

/**
 * Writes the sentence of the note about the highlighted policy.
 * @param highlight The policy that is highlighted and the dependency it was opened from.
 * @param highlight.policy
 * @param highlight.dependency
 * @returns A sentence such as `Policy 2 is highlighted, opened from the dependency at line 3 of src/modules/checkout/index.js.`, or `The default is highlighted, …` for the default.
 */
function getHighlightSentence({ policy, dependency }: HighlightFacts): string {
  const subject = policy === null ? "The default" : `Policy ${policy}`;

  return `${subject} is highlighted, opened from the dependency at line ${dependency.index + 1} of ${dependency.path}.`;
}

/**
 * Turns the facts of what the tab that shows lists into what the list draws.
 * @param listFacts The facts of the list, as `getProblemList` returns them.
 * @returns For the sketch, a file and the config, the rows and what to say when there are none, with the notes above them: why no dependency is evaluated, and which policy is highlighted, which says there are no problems in the config first when it has none. For a dependency, its body. The rows are the problems of the config first, then the lines of text mode, then the failing dependencies.
 */
export function toProblemListContent(
  listFacts: ProblemListFacts
): ProblemListContent {
  if ("result" in listFacts) {
    return {
      items: [],
      empty: undefined,
      notes: [],
      detail: toDependencyDetail(listFacts),
    };
  }

  const {
    subject,
    configProblems,
    textProblems,
    dependencies,
    notEvaluated,
    highlight,
  } = listFacts;
  const items = [
    ...getConfigProblemItems(configProblems),
    ...getTextProblemItems(textProblems),
    ...getDependencyProblemItems(dependencies, subject.kind !== "file"),
  ];
  const empty = EMPTY_TEXTS[subject.kind];
  const notes =
    notEvaluated === undefined ? [] : [getNotEvaluatedSentence(notEvaluated)];

  if (highlight === undefined) {
    return { items, empty, notes, detail: undefined };
  }

  // The sentence about the highlighted policy says there are no problems first, in the same note, so that the list does not say it again below
  const sentence = getHighlightSentence(highlight);

  return {
    items,
    empty: items.length === 0 ? undefined : empty,
    notes: [...notes, items.length === 0 ? `${empty} ${sentence}` : sentence],
    detail: undefined,
  };
}
