import type { EntityDescription } from "@boundaries/elements";

import type { Sketch } from "../contract";

/** A range of the config text: offsets for the editor, and the line and column of its start for the problem list */
export type TextRange = {
  /** Offset of the first character, from 0 */
  readonly from: number;
  /** Offset after the last character */
  readonly to: number;
  /** Line of `from`, from 1 */
  readonly line: number;
  /** Column of `from`, from 1 */
  readonly column: number;
};

/** How serious a problem is. A deprecation is shown as a warning */
export type ProblemLevel = "error" | "warning" | "deprecation";

/** A problem of the config, placed in its text */
export type ConfigProblem = {
  readonly level: ProblemLevel;
  /** The diagnostic title, or for a parse problem what the config accepts, with the parser message in `detail` */
  readonly title: string;
  /** What the diagnostic says besides the title, trimmed and without its links. `undefined` when there is no text besides the links */
  readonly detail?: string;
  /** The URLs that the detail pointed to, such as the docs page of a setting, in the order they were written and without the `More info:` label in front of them */
  readonly links: readonly string[];
  /** The entry it is about, from the config object; `[]` for the whole config */
  readonly path: readonly (string | number)[];
  /** The value at `path`; the parse position for a parse error */
  readonly range: TextRange;
  readonly source: "parse" | "config";
};

/** An element descriptor of the settings, with how many files of the sketch it matches */
export type ElementTypeSummary = {
  /** Position in `settings["boundaries/elements"]` */
  readonly index: number;
  /** Its `type`, or `#<index>` when it has none */
  readonly type: string;
  readonly patterns: readonly string[];
  readonly files: number;
  /** A diagnostic of `config` says it is invalid and ignored, or describing the files with it throws and the engine leaves it out */
  readonly ignored: boolean;
  readonly range: TextRange;
};

/** A file category of the settings, with how many files of the sketch it matches */
export type FileCategorySummary = {
  /** Position in `settings["boundaries/files"]` */
  readonly index: number;
  readonly category: string;
  readonly patterns: readonly string[];
  readonly files: number;
  readonly range: TextRange;
};

/** A rule of the plugin in `rules` */
export type RuleSummary = {
  /** As written, such as `boundaries/dependencies` */
  readonly name: string;
  /** Policies of its options, 0 when it has none */
  readonly policies: number;
  /** Its options pass the rule schema, and the selector of every policy can be normalized */
  readonly valid: boolean;
  readonly range: TextRange;
};

/** What the engine says about a sketch */
export type Evaluation = {
  readonly sketch: Sketch;
  readonly configParsed: boolean;
  /** One per diagnostic path, parse problem first, in the order of `normalizeConfig`, then an error at each descriptor that makes describing the files throw */
  readonly problems: readonly ConfigProblem[];
  /** False when an entry of a rule of the plugin fails its schema or has a policy whose selector cannot be normalized: dependencies are not evaluated */
  readonly rulesValid: boolean;
  /** Every file of the tree, by path */
  readonly files: ReadonlyMap<string, EntityDescription>;
  readonly elementTypes: readonly ElementTypeSummary[];
  readonly fileCategories: readonly FileCategorySummary[];
  readonly rules: readonly RuleSummary[];
};

/** Evaluates sketches, and remembers what it did so that an edit that does not touch the config does not read it again. Each playground has its own, so playgrounds on one page share nothing */
export type Engine = {
  /**
   * Evaluates a sketch: reads its config and places the problems in its text, and describes every file of its tree as the plugin does. It is pure and memoized, so evaluating the same sketch object again returns the same evaluation, and a sketch with the same config text as the last one does not read the config again.
   * @param sketch The sketch to evaluate.
   * @returns What the engine says about the sketch.
   */
  readonly evaluate: (sketch: Sketch) => Evaluation;
};
