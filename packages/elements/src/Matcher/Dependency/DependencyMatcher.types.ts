import type { EntitySingleSelector } from "../Entity";

import type { DependencyInfoSelector } from "./DependencySelector.types";

/**
 * Result of matching an element selector against an element.
 */
export type DependencyMatchResult = {
  /** The selector matching result for the 'from' element. */
  from: EntitySingleSelector | null;
  /** The selector matching result for the 'to' element. */
  to: EntitySingleSelector | null;
  /** The selector matching result for the dependency metadata. */
  dependency: DependencyInfoSelector | null;
  /** Whether the dependency matches all the selector properties provided */
  isMatch: boolean;
};
