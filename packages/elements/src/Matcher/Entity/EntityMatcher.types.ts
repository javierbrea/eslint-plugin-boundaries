import type { ElementSingleSelector } from "../Element";
import type { FileSingleSelector } from "../File";
import type { OriginSingleSelector } from "../Origin";

/**
 * The result of matching a single entity selector, containing the matching results for each selector property (element, file and origin).
 */
export type EntitySingleSelectorMatchResult = {
  /** The single selector matching result for the element. */
  element?: ElementSingleSelector;
  /** The single selector matching result for the file. */
  file?: FileSingleSelector;
  /** The single selector matching result for the origin. */
  origin?: OriginSingleSelector;
};

/**
 * Result of matching an entity selector against an entity.
 */
export type EntityMatchResult = {
  selector: EntitySingleSelectorMatchResult | null;
  /** Whether the entity matches all the selector properties provided */
  isMatch: boolean;
};
