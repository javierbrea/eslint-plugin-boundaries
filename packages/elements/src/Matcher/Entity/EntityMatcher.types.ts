import type { ElementSingleSelector } from "../Element";
import type { FileSingleSelector } from "../File";
import type { OriginSingleSelector } from "../Origin";

/**
 * Result of matching an entity selector against an entity.
 */
export type EntityMatchResult = {
  /** The selector matching result for the 'element' associated with the entity. */
  element: ElementSingleSelector | null;
  /** The selector matching result for the 'file' associated with the entity. */
  file: FileSingleSelector | null;
  /** The selector matching result for the 'origin' associated with the entity. */
  origin: OriginSingleSelector | null;
  /** Whether the entity matches all the selector properties provided */
  isMatch: boolean;
};
