import type { ConfigNormalized, RULE_NAMES_MAP } from "@boundaries/config";

import type {
  EvaluatedRule,
  NotEvaluatedReason,
  ProjectConfig,
} from "./Config.types";

/** The rules whose dependencies the analysis evaluates, as they are written in `rules` */
export type EvaluatedRuleName =
  | typeof RULE_NAMES_MAP.DEPENDENCIES
  | typeof RULE_NAMES_MAP.ELEMENT_TYPES;

/** What `selectRule` reads to choose the rule */
export type RuleSelectionInput = {
  /** The config object as written */
  readonly config: ProjectConfig;
  /** The rules that `normalizeConfig` kept */
  readonly rules: ConfigNormalized["rules"];
  /** Whether no rule of the config fails its options schema or has a policy that cannot be normalized */
  readonly rulesValid: boolean;
};

/** The rule that decides the dependencies of a project, or why none does, and the rule that was chosen either way */
export type RuleSelection = {
  /** The rule that was chosen: the first of `boundaries/dependencies` and the deprecated `boundaries/element-types` that is written and that ESLint runs, and when neither runs, the first that is written. `undefined` when neither is written. It is set whenever a rule is written, also while no dependency is evaluated, so that the rule that says why can be marked */
  readonly ruleName: EvaluatedRuleName | undefined;
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
