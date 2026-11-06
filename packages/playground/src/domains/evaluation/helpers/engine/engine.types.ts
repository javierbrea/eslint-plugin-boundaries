import type { Sketch, SketchDependency } from "@/contract";
import type { DependencyRef } from "@/domains/project/helpers/sketch";

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

/** What a piece of a config text is, so that a code area can color it as the editor does: a `key` of an object, a `string`, a `number` (including `Infinity` and `NaN`), a `literal` (`true`, `false` and `null`), a `comment`, `punctuation` (braces, brackets, colons and commas) or `plain` text, which is the white space between the others and any piece that cannot be read */
export type ConfigTokenKind =
  | "key"
  | "string"
  | "number"
  | "literal"
  | "comment"
  | "punctuation"
  | "plain";

/** A piece of a config text. The pieces of a text, joined, are the text */
export type ConfigToken = {
  readonly kind: ConfigTokenKind;
  /** The piece as written */
  readonly text: string;
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
  /** `parse` for the problem of a text that is not one JSON5 object, and `config` for every other, such as the diagnostics of `@boundaries/config` and the warnings of the playground about what it does not run. No pane reads it */
  readonly source: "parse" | "config";
};

/** What the playground shows of the description that the plugin gives a file, with the names and the values of the plugin. The engine maps it from `@boundaries/elements`, so that no other code depends on the shape of its descriptions */
export type FileDescription = {
  readonly element: {
    /** The types of the element of the file, or `null` when no element descriptor matches it */
    readonly types: readonly string[] | null;
    /** The path of the element, or `null` when no element descriptor matches the file */
    readonly path: string | null;
    /** What the pattern of the element captured, or `null` when it captured nothing */
    readonly captured: Readonly<Record<string, string>> | null;
  };
  readonly file: {
    /** The categories of the file, or `null` when no file descriptor matches it */
    readonly categories: readonly string[] | null;
  };
  readonly module: {
    /** Where the module comes from. Every file of the sketch is local, unless the root path leaves it outside with `outsideRootPath` */
    readonly origin: "local" | "external" | "core";
  };
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
  /** Whether it is the rule whose dependencies the playground evaluates: the first of `boundaries/dependencies` and the deprecated `boundaries/element-types` that is written and that ESLint runs, so `boundaries/dependencies` when both run, and when neither runs the first that is written, in that order. It says which rule is taken, not that its dependencies are evaluated: `Evaluation.notEvaluated` says when they are not, such as when the rule is off */
  readonly evaluated: boolean;
  readonly range: TextRange;
};

/** Why a dependency is not checked: the skip reasons of `@boundaries/policies`, and `not-read` when `boundaries/dependency-nodes` leaves its syntax out, so that the plugin never sees it */
export type SkipReason =
  | "from-ignored"
  | "from-unknown"
  | "to-ignored"
  | "not-local"
  | "unknown-local"
  | "internal"
  | "not-read";

/** Why no dependency of the sketch is evaluated, in the order the engine checks them. `no-options` is the rule written with no options, such as `"boundaries/dependencies": 2`: the plugin checks nothing then, as the rule runner returns before it reads a dependency */
export type NotEvaluatedReason =
  | "config-unparsed"
  | "rules-invalid"
  | "no-rule"
  | "rule-off"
  | "no-options";

/** The policy that decided a dependency: one of the policies of the rule, by its index in the options, or the default */
export type PolicyRef = {
  /** Its index in the options, or `null` for the `default` option */
  readonly index: number | null;
  /** Where it is written in the config text: the policy, or the `default` option (the options when `default` is not written) */
  readonly range: TextRange;
};

/** What the engine says about a dependency */
export type DependencyVerdict =
  | {
      readonly status: "allowed";
      /** The policy that allowed it, or the default */
      readonly policy: PolicyRef;
    }
  | {
      readonly status: "disallowed";
      /** The policy that disallowed it, or the default. It is `undefined` only when a custom message fails to render: `message` is then the error text, and nothing says which policy decided */
      readonly policy: PolicyRef | undefined;
      /** The message that the plugin reports. When a custom message fails to render, or renders to an empty text, it is the text that says so: ESLint stops with an error there instead of reporting */
      readonly message: string;
      /** `error` for the severity `error` of the rule, `warning` for `warn` */
      readonly level: "error" | "warning";
    }
  | {
      /** The rule does not check it, and it counts as no problem */
      readonly status: "not-checked";
      readonly reason: SkipReason;
    }
  | {
      /** No dependency of the sketch is evaluated: `Evaluation.notEvaluated` says why */
      readonly status: "not-evaluated";
    };

/** The verdict of a dependency that the rule disallows, as an error or as a warning */
export type DisallowedVerdict = Extract<
  DependencyVerdict,
  { status: "disallowed" }
>;

/** A dependency of the sketch with its verdict */
export type DependencyResult = {
  readonly dependency: SketchDependency;
  /** Its file and its position among the dependencies of that file */
  readonly ref: DependencyRef;
  /** The source its statement writes, the one passed to `describeDependency` */
  readonly source: string;
  readonly verdict: DependencyVerdict;
};

/** A policy of the evaluated rule, or its default, with the dependencies it decided */
export type PolicySummary = {
  /** Its index in the options, or `null` for the default */
  readonly index: number | null;
  /** `disallow` when the policy has a `disallow` and no `allow`, `allow` when it has an `allow` and no `disallow`, `both` otherwise; the value of `default` for the default */
  readonly action: "allow" | "disallow" | "both";
  /** The element types and file categories that its `from` selectors name, in order and without duplicates: those of its own `from`, then those of the `from` of the dependency selectors of its `allow` and `disallow`. Empty when it names none; always empty for the default */
  readonly from: readonly string[];
  /** The same, for its own `to` and the `to` selectors of its `allow` and `disallow`, which are entity selectors or the `to` of dependency selectors */
  readonly to: readonly string[];
  /** How many dependencies it decided. A dependency whose custom message fails to render counts for nobody, as the policy that decided it is not known */
  readonly decided: number;
  /** How many of them it disallowed */
  readonly disallowed: number;
  /** How many of the disallowed ones are errors, because the rule has the severity `error`; the others are warnings */
  readonly errors: number;
  /** Where it is written in the config text: the policy, or the `default` option (the options when `default` is not written) */
  readonly range: TextRange;
};

/** What the engine says about a sketch */
export type Evaluation = {
  readonly sketch: Sketch;
  readonly configParsed: boolean;
  /** One per diagnostic path, parse problem first, in the order of `normalizeConfig`, and last the warning that the playground does not run the selectors of `boundaries/additional-dependency-nodes`, when it keeps a valid node */
  readonly problems: readonly ConfigProblem[];
  /** False when an entry of a rule of the plugin fails its schema or has a policy whose selector cannot be normalized: dependencies are not evaluated */
  readonly rulesValid: boolean;
  /** Every file of the tree, by path */
  readonly files: ReadonlyMap<string, FileDescription>;
  readonly elementTypes: readonly ElementTypeSummary[];
  readonly fileCategories: readonly FileCategorySummary[];
  readonly rules: readonly RuleSummary[];
  /** A verdict for every dependency of the sketch, in the order of `Sketch.dependencies` */
  readonly dependencies: readonly DependencyResult[];
  /** Why no dependency is evaluated, when none is: every verdict is then `not-evaluated`. `undefined` when they are */
  readonly notEvaluated: NotEvaluatedReason | undefined;
  /** The policies of the evaluated rule in their order, then its default, with the dependencies each one decided. Empty when `notEvaluated` is set */
  readonly policies: readonly PolicySummary[];
};

/** Evaluates sketches, and remembers what it did so that an edit that does not touch the config does not read it again. Each playground has its own, so playgrounds on one page share nothing */
export type Engine = {
  /**
   * Evaluates a sketch: reads its config and places the problems in its text, describes every file of its tree as the plugin does, and decides every dependency as the `dependencies` rule does. It is pure and memoized, so evaluating the same sketch object again returns the same evaluation, and a sketch with the same config text as the last one does not read the config again.
   * @param sketch The sketch to evaluate.
   * @returns What the engine says about the sketch.
   */
  readonly evaluate: (sketch: Sketch) => Evaluation;
};
