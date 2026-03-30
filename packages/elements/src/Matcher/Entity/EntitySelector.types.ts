import type {
  ElementSelector,
  ElementSelectorNormalized,
  LegacyElementSelector,
} from "../Element";
import type { FileSelector, FileSelectorNormalized } from "../File";
import type { OriginSelector, OriginSelectorNormalized } from "../Origin";

/**
 * Legacy selector for an entity, which can contain element selectors in any legacy format.
 */
export type LegacyEntitySingleSelector =
  | {
      /** The element associated with this entity, or undefined to ignore the element in the matching process */
      element?: LegacyElementSelector | ElementSelector;
      /** The file associated with this entity, or undefined to ignore the file in the matching process */
      file?: FileSelector;
      /** The origin associated with this entity, or undefined to ignore the origin in the matching process */
      origin?: OriginSelector;
    }
  | LegacyElementSelector
  | ElementSelector;

/** Legacy entity Selector, which can be a single legacy entity selector or an array of legacy entity selectors */
export type LegacyEntitySelector =
  | LegacyEntitySingleSelector
  | LegacyEntitySingleSelector[];

/** Single selector for an entity, which is the main unit under analysis */
export type EntitySingleSelector = {
  /** The element associated with this entity, or undefined to ignore the element in the matching process */
  element?: ElementSelector;
  /** The file associated with this entity, or undefined to ignore the file in the matching process */
  file?: FileSelector;
  /** The origin associated with this entity, or undefined to ignore the origin in the matching process */
  origin?: OriginSelector;
};

/** Selector for an entity, which is the main unit under analysis */
export type EntitySelector = EntitySingleSelector | EntitySingleSelector[];

/** Backward compatible single selector for an entity, which can be either a legacy entity single selector or a new entity single selector. This type is used to allow functions that accept entity single selectors to also accept legacy entity single selectors for backward compatibility. */
export type BackwardCompatibleEntitySingleSelector =
  | LegacyEntitySingleSelector
  | EntitySingleSelector;

/** Backward compatible selector for an entity, which can contain either legacy entity selectors or new entity selectors. This type is used to allow functions that accept entity selectors to also accept legacy entity selectors for backward compatibility. */
export type BackwardCompatibleEntitySelector =
  | BackwardCompatibleEntitySingleSelector
  | BackwardCompatibleEntitySingleSelector[];

export type EntitySingleSelectorNormalized = {
  /** The element associated with this entity, or undefined to ignore the element in the matching process */
  element?: ElementSelectorNormalized;
  /** The file associated with this entity, or undefined to ignore the file in the matching process */
  file?: FileSelectorNormalized;
  /** The origin associated with this entity, or undefined to ignore the origin in the matching process */
  origin?: OriginSelectorNormalized;
};

/** Normalized selector for an entity, being always an array of single selectors */
export type EntitySelectorNormalized = EntitySingleSelectorNormalized[];
