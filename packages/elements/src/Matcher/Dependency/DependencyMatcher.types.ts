import type { EntitySingleSelectorMatchResult } from "../Entity";

import type { DependencyInfoSingleSelector } from "./DependencySelector.types";

/**
 * The result of matching a single dependency selector, containing the matching results for each selector property (from, to and dependency).
 */
export type DependencySingleSelectorMatchResult = {
  /** The single selector matching result for the 'from' entity. */
  from?: EntitySingleSelectorMatchResult;
  /** The single selector matching result for the 'to' entity. */
  to?: EntitySingleSelectorMatchResult;
  /** The single selector matching result for the dependency information. */
  dependency?: DependencyInfoSingleSelector;
};

/**
 * Result of matching an element selector against an element.
 */
export type DependencyMatchResult = {
  selector: DependencySingleSelectorMatchResult | null;
  /** Whether the dependency matches all the selector properties provided */
  isMatch: boolean;
};
