import type {
  ConfigNormalized,
  RULE_NAMES_MAP,
  DependenciesRuleOptionsNormalized,
} from "@boundaries/config";

import type { NotEvaluatedReason, PolicyRef } from "./engine.types";
import type { ConfigRead } from "./parseConfig.types";

/** The rules whose dependencies the playground evaluates, as they are written in `rules` */
export type EvaluatedRuleName =
  | typeof RULE_NAMES_MAP.DEPENDENCIES
  | typeof RULE_NAMES_MAP.ELEMENT_TYPES;

/** What `selectRule` reads to choose the rule */
export type RuleSelectionInput = {
  /** The config as written */
  readonly config: ConfigRead;
  /** The rules that `normalizeConfig` kept */
  readonly rules: ConfigNormalized["rules"];
  /** Whether no rule of the config fails its options schema or has a policy that cannot be normalized */
  readonly rulesValid: boolean;
};

/** The rule the playground evaluates, ready to decide dependencies, with the places of its policies in the config text */
export type EvaluatedRule = {
  /** How a dependency that the rule disallows is reported, from the severity of the rule: `error`, or `warning` for `warn` */
  readonly level: "error" | "warning";
  /** The options of the rule, normalized, which are the same object while the config text does not change */
  readonly options: DependenciesRuleOptionsNormalized;
  /** One for each policy of the options, in their order */
  readonly policies: readonly PolicyRef[];
  /** The `default` option, which decides when no policy matches */
  readonly defaultPolicy: PolicyRef;
};

/** The rule that decides the dependencies of a sketch, or why none does */
export type RuleSelection =
  | { readonly rule: EvaluatedRule; readonly notEvaluated?: undefined }
  | { readonly rule?: undefined; readonly notEvaluated: NotEvaluatedReason };
