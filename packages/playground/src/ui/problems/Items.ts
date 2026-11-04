import type { ConfigProblem } from "../../engine";
import { CONFIG_PATH } from "../../sketch";
import type { TextProblem } from "../../sketch";

import type { ProblemItem, ProblemLevel, ProblemTone } from "./Problems.types";

/** Where the problems of text mode are placed: they are about the project as a whole, and not about a file. */
const TEXT_LOCATION = "Project text";

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
 * @returns One row for each problem, in the same order, with the id `config:<index>`.
 */
export function getConfigProblemItems(
  problems: readonly ConfigProblem[]
): ProblemItem[] {
  return problems.map((problem, index) => ({
    id: `config:${index}`,
    level: problem.level,
    location: CONFIG_PATH,
    position: `:${problem.range.line}:${problem.range.column}`,
    message: getConfigMessage(problem),
    meta: getConfigMeta(problem),
  }));
}

/**
 * Turns the lines of text mode that could not be read into rows of the problem list.
 * @param problems The lines that were left out, as `fromText` returns them.
 * @returns One row for each line, in the same order, with the id `text:<index>`. Each is an error that shows the reason and, below it, the line as it was written.
 */
export function getTextProblemItems(
  problems: readonly TextProblem[]
): ProblemItem[] {
  return problems.map(({ line, text, reason }, index) => ({
    id: `text:${index}`,
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
 * @param levels The levels of the problems that are counted.
 * @returns `bad` when any of them is an error, and `warn` otherwise.
 */
export function getCountTone(levels: readonly ProblemLevel[]): ProblemTone {
  return levels.includes("error") ? "bad" : "warn";
}
