import type { ElementDescription } from "../Element";
import type { FileDescription } from "../File";

/** Description of an entity, which is the main unit under analysis */
export type EntityDescription = {
  /** The element associated with this entity, or null if none matched */
  element: ElementDescription | null;
  /** The entity file, or null if the entity is not associated with any file (e.g., a Node.js built-in dependency) */
  file: FileDescription | null;
};
