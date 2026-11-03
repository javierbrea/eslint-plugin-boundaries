import type { DependenciesPolicyNormalized } from "@boundaries/config";
import type { DependencySingleSelectorNormalized } from "@boundaries/elements";

/**
 * A normalized policy with the dependency selectors of its `allow` and `disallow` entries, each one merged with the outer `from`, `to` and `dependency` selectors of the policy.
 */
export type DependenciesPolicyPrecomputed = DependenciesPolicyNormalized & {
  /** The selectors of the `allow` entries */
  precomputedAllow?: DependencySingleSelectorNormalized[];
  /** The selectors of the `disallow` entries */
  precomputedDisallow?: DependencySingleSelectorNormalized[];
};
