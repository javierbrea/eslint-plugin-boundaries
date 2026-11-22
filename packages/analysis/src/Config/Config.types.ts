import type {
  DependenciesRuleOptionsNormalized,
  Diagnostic,
  SettingsNormalized,
} from "@boundaries/config";

/** The boundaries part of an ESLint config object, as written; only `settings` and `rules` are read */
export type ProjectConfig = {
  /** The settings, such as `boundaries/elements`, as written */
  readonly settings?: unknown;
  /** The rules, such as `boundaries/dependencies`, as written */
  readonly rules?: unknown;
};

/** The path of an entry of the config object from its root, such as `["rules", "boundaries/dependencies", 1, "policies", 0]`; `[]` for the whole config */
export type ConfigPath = readonly (string | number)[];

/** The policy that decided a dependency: one of the policies of the rule, by its index in the options, or the default */
export type PolicyRef = {
  /** Its index in the options, or `null` for the `default` option */
  readonly index: number | null;
  /** Where it is written in the config object: the policy, or the `default` option, whose path is `[<options path>, "default"]` also when `default` is not written */
  readonly path: ConfigPath;
};

/** Why no dependency of the project is evaluated, in the order the analysis checks them. `no-options` is the rule written with no options, such as `"boundaries/dependencies": 2`: the plugin checks nothing then, as the rule runner returns before it reads a dependency */
export type NotEvaluatedReason =
  | "rules-invalid"
  | "no-rule"
  | "rule-off"
  | "no-options";

/** The rule whose dependencies are evaluated, ready to decide them, with the paths of its policies in the config object */
export type EvaluatedRule = {
  /** How a dependency that the rule disallows is reported, from the severity of the rule: `error`, or `warning` for `warn` */
  readonly level: "error" | "warning";
  /** The options of the rule, as `normalizeConfig` normalized them */
  readonly options: DependenciesRuleOptionsNormalized;
  /** One for each policy of the options, in their order */
  readonly policies: readonly PolicyRef[];
  /** The `default` option, which decides when no policy matches. Its path is `[<options path>, "default"]`, also when `default` is not written */
  readonly defaultPolicy: PolicyRef;
};

/** An element descriptor of the settings, with how many files of the project it matches */
export type ElementTypeSummary = {
  /** Position in `settings["boundaries/elements"]`, or in the deprecated `settings["boundaries/types"]` when `boundaries/elements` is not set */
  readonly index: number;
  /** Its `type`, or `#<index>` when it has none */
  readonly type: string;
  /** The patterns its `pattern` writes, the strings among them when it is a list, or `<type>/*` for a legacy descriptor written as a string; none when it has no pattern that is a string */
  readonly patterns: readonly string[];
  /** How many files of the project it gives its type to, so descriptors that share a type count their own files; 0 when it is ignored */
  readonly files: number;
  /** A diagnostic of `@boundaries/config` says it is invalid and ignored */
  readonly ignored: boolean;
  /** Where it is written in the config object */
  readonly path: ConfigPath;
};

/** A file category of the settings, with how many files of the project it matches */
export type FileCategorySummary = {
  /** Position in `settings["boundaries/files"]` */
  readonly index: number;
  /** Its `category` */
  readonly category: string;
  /** The patterns its `pattern` writes, the strings among them when it is a list */
  readonly patterns: readonly string[];
  /** How many files of the project it gives its category to, so descriptors that share a category count their own files */
  readonly files: number;
  /** Where it is written in the config object */
  readonly path: ConfigPath;
};

/** A rule of the plugin in `rules` */
export type RuleSummary = {
  /** As written, such as `boundaries/dependencies` */
  readonly name: string;
  /** Policies of its options, 0 when it has none */
  readonly policies: number;
  /** Its options pass the rule schema, and the selector of every policy can be normalized */
  readonly valid: boolean;
  /** Whether it is the rule whose dependencies the analysis evaluates: the first of `boundaries/dependencies` and the deprecated `boundaries/element-types` that is written and that ESLint runs, so `boundaries/dependencies` when both run, and when neither runs the first that is written, in that order. It says which rule is taken, not that its dependencies are evaluated: `notEvaluated` of the analysis says when they are not, such as when the rule is off */
  readonly evaluated: boolean;
  /** Where it is written in the config object */
  readonly path: ConfigPath;
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
  /** Where it is written in the config object: the policy, or the `default` option, whose path is `[<options path>, "default"]` also when `default` is not written */
  readonly path: ConfigPath;
};

/** What the analysis says about a config, before any file of a project is described */
export type ConfigAnalysis = {
  /** The settings that `normalizeConfig` returned for the config */
  readonly settings: SettingsNormalized;
  /** The diagnostics of the config, with paths from the root of the config object */
  readonly diagnostics: readonly Diagnostic[];
  /** False when an entry of a rule of the plugin fails its schema or has a policy whose selector cannot be normalized: dependencies are not evaluated */
  readonly rulesValid: boolean;
  /** One per element descriptor as written, without the files it matches, which depend on the project */
  readonly elementTypes: readonly Omit<ElementTypeSummary, "files">[];
  /** One per valid file descriptor, without the files it matches, which depend on the project */
  readonly fileCategories: readonly Omit<FileCategorySummary, "files">[];
  /** One per rule of the plugin written in `rules`, in the order they are written */
  readonly rules: readonly RuleSummary[];
  /** The policies of the evaluated rule in their order, then its default, without the dependencies they decided, which depend on the project. [] when no rule is evaluated */
  readonly policies: readonly Omit<
    PolicySummary,
    "decided" | "disallowed" | "errors"
  >[];
} & (
  | {
      /** The rule whose dependencies are evaluated */
      readonly rule: EvaluatedRule;
      /** No reason: the dependencies are evaluated */
      readonly notEvaluated: undefined;
    }
  | {
      /** No rule: no dependency is evaluated */
      readonly rule: undefined;
      /** Why no dependency is evaluated */
      readonly notEvaluated: NotEvaluatedReason;
    }
);
