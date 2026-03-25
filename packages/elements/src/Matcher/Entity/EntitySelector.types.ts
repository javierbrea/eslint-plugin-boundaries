import type { ElementSelector } from "../Element";
import type { FileSelector } from "../File";

/** Single selector for an entity, which is the main unit under analysis */
export type EntitySingleSelector = {
  /** The element associated with this entity, or null to match entities without an associated element, or undefined to ignore the element in the matching process */
  element?: ElementSelector | null;
  /** The file associated with this entity, or null to match entities without an associated file, or undefined to ignore the file in the matching process */
  file?: FileSelector | null;
};

/** Selector for an entity, which is the main unit under analysis */
export type EntitySelector = EntitySingleSelector | EntitySingleSelector[];
