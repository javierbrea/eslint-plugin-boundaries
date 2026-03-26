import type { ElementSelector, ElementSelectorNormalized } from "../Element";
import type { FileSelector, FileSelectorNormalized } from "../File";
import type { OriginSelector, OriginSelectorNormalized } from "../Origin";

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
