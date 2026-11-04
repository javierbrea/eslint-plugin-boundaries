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

/** A problem of the config, placed in its text */
export type ConfigProblem = {
  readonly level: "error" | "warning" | "deprecation";
  /** The diagnostic title, or for a parse problem what the config accepts, with the parser message in `detail` */
  readonly title: string;
  readonly detail?: string;
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
  /** A diagnostic of `config` says it is invalid and ignored */
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
  /** One per diagnostic path, parse problem first, in the order of `normalizeConfig` */
  readonly problems: readonly ConfigProblem[];
  /** False when an entry of a rule of the plugin fails its schema or has a policy whose selector cannot be normalized: dependencies are not evaluated */
  readonly rulesValid: boolean;
  /** Every file of the tree, by path */
  readonly files: ReadonlyMap<string, EntityDescription>;
  readonly elementTypes: readonly ElementTypeSummary[];
  readonly fileCategories: readonly FileCategorySummary[];
  readonly rules: readonly RuleSummary[];
  /** The value at a path of the config; phase 6 places policies with it. `undefined` when the config is not parsed */
  readonly rangeOf: (
    path: readonly (string | number)[]
  ) => TextRange | undefined;
};
