import type { DependenciesRuleOptions, Diagnostic } from "@boundaries/config";
import type { DependencySingleSelectorMatchResult } from "@boundaries/elements";

/**
 * Map of the reasons why the `dependencies` rule does not evaluate a dependency.
 */
export const DEPENDENCY_SKIP_REASONS_MAP = {
  /** The importing file is ignored */
  FROM_IGNORED: "from-ignored",
  /** The importing file matches no element and no file descriptor */
  FROM_UNKNOWN: "from-unknown",
  /** The target is a local file that is ignored */
  TO_IGNORED: "to-ignored",
  /** The target is external or core, and `checkAllOrigins` is false */
  NOT_LOCAL: "not-local",
  /** The target is local and unknown, and `checkUnknownLocals` is false */
  UNKNOWN_LOCAL: "unknown-local",
  /** Both files belong to the same element, and `checkInternals` is false */
  INTERNAL: "internal",
} as const;

/**
 * Reason why the `dependencies` rule does not evaluate a dependency.
 */
export type DependencySkipReason =
  (typeof DEPENDENCY_SKIP_REASONS_MAP)[keyof typeof DEPENDENCY_SKIP_REASONS_MAP];

/**
 * The options of the `dependencies` rule that decide which dependencies it evaluates, as the user wrote them or normalized. An option that is not set is false.
 */
export type DependencySkipOptions = Pick<
  DependenciesRuleOptions,
  "checkAllOrigins" | "checkUnknownLocals" | "checkInternals"
>;

/**
 * What the evaluation of the policies returns whatever the verdict.
 */
type PolicyEvaluationBase = {
  /** Index in `options.policies` of the policy that decided, or null when no policy matched and `options.default` decided */
  policyIndex: number | null;
  /** What the deciding selector matched, as `@boundaries/elements` returns it; null when `options.default` decided */
  match: DependencySingleSelectorMatchResult | null;
  /** Problems found while matching, such as a selector that makes the matcher throw */
  diagnostics: Diagnostic[];
};

/**
 * Result of evaluating the policies of the `dependencies` rule against a dependency.
 */
export type PolicyEvaluation =
  | (PolicyEvaluationBase & {
      /** The dependency is allowed */
      allowed: true;
      /** Not set when the dependency is allowed */
      message?: undefined;
    })
  | (PolicyEvaluationBase & {
      /** The dependency is not allowed */
      allowed: false;
      /** The message that the ESLint plugin reports */
      message: string;
    });

/**
 * Result of evaluating a dependency as the `dependencies` rule does: either the reason why it is not evaluated, or the evaluation of the policies.
 */
export type DependencyEvaluation =
  | ({ checked: true } & PolicyEvaluation)
  | { checked: false; reason: DependencySkipReason };
