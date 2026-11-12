import { DEPENDENCIES_RULE_EXAMPLE } from "./dependenciesRule";
import type { Example } from "./examples.types";
import { OVERVIEW_EXAMPLE } from "./overview";
import { POLICIES_EXAMPLE } from "./policies";
import { QUICK_START_EXAMPLE } from "./quickStart";

/**
 * Every example the playground ships with, in the order a picker shows them: the quick start first, then the examples of the docs that fit a sketch, from the smallest to the largest. Between them they exercise everything that the inspector shows of a file and of a dependency. The quick start has element types, file categories and a package that the rule does not check. The overview has a policy about the origin of a module (the package `axios`). The policies page has custom messages, captured values and a policy that overrides another. The page of the rule `boundaries/dependencies` has captured values that a policy compares, and files with several categories.
 */
export const EXAMPLES: readonly Example[] = [
  QUICK_START_EXAMPLE,
  OVERVIEW_EXAMPLE,
  POLICIES_EXAMPLE,
  DEPENDENCIES_RULE_EXAMPLE,
];
