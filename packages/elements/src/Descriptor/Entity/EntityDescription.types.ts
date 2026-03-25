import type { ElementDescription } from "../Element";
import type { FileDescription } from "../File";
import type { OriginDescription } from "../Origin";

/** Description of an entity, which is the main unit under analysis */
export type EntityDescription = {
  /** The element associated with this entity */
  element: ElementDescription;
  /** The entity file */
  file: FileDescription;
  /** Origin of the entity, either local, external, or core (built-in module) */
  origin: OriginDescription;
};
