import type { BaseDescription } from "../Shared/BaseDescription.types";

/**
 * Origins of an element
 */
export const ELEMENT_ORIGINS_MAP = {
  /** Origin of local elements (files) */
  LOCAL: "local",
  /** Origin of external elements (libraries) */
  EXTERNAL: "external",
  /** Origin of core elements */
  CORE: "core",
} as const;

/**
 * Kind of element origin, either local, external, or core.
 */
export type ElementOrigin =
  (typeof ELEMENT_ORIGINS_MAP)[keyof typeof ELEMENT_ORIGINS_MAP];

/**
 * Base element properties related to captured values
 */
export type ElementDescription = BaseDescription & {
  /** Path in elements can't be null, because in case there is no match, no element description will be created, and the file will be marked as unknown with a null path. */
  path: string;
  /** Type of the element */
  type: string;
  /** Parent elements */
  parents: ElementParent[];
};

/**
 * Parent elements
 */
export type ElementParent = Pick<
  ElementDescription,
  "type" | "path" | "captured"
>;
