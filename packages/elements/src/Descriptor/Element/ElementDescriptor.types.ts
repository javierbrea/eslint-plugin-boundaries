import type { BaseDescriptor } from "../Shared";

import type {
  ElementDescription,
  ElementDescriptionWithSource,
} from "./ElementDescription.types";

/**
 * Element descriptor, which must define a pattern and a type. The pattern is used to match files and capture values, while the type is used to categorize the element.
 */
export type ElementDescriptor = BaseDescriptor & {
  /** Type of the element (e.g., "service", "component", "util"). */
  type: string;
};

/**
 * Array of element descriptors.
 */
export type ElementDescriptors = ElementDescriptor[];

/**
 * Serialized cache of element descriptions.
 */
export type DescriptionsSerializedCache = Record<
  string,
  ElementDescription | ElementDescriptionWithSource
>;

/**
 * Serialized cache of file elements.
 */
export type FileElementsSerializedCache = Record<string, ElementDescription>;

/**
 * Serialized cache for ElementsDescriptor class.
 */
export type ElementDescriptorSerializedCache = {
  /** Serialized descriptions cache */
  descriptions: DescriptionsSerializedCache;
  /** Serialized files cache */
  files: FileElementsSerializedCache;
};
