import type { EntityMatchResult } from "../Entity";

import type { DependencyInfoSingleSelector } from "./DependencySelector.types";

/**
 * Result of matching an element selector against an element.
 */
export type DependencyMatchResult = {
  /** The selector matching result for the 'from' element. */
  from: Omit<EntityMatchResult, "isMatch"> | null;
  /** The selector matching result for the 'to' element. */
  to: Omit<EntityMatchResult, "isMatch"> | null;
  /** The selector matching result for the dependency metadata. */
  dependency: DependencyInfoSingleSelector | null;
  /** Whether the dependency matches all the selector properties provided */
  isMatch: boolean;
};
