import type { BaseDescriptor } from "../Shared";

import type { ElementDescription } from "./ElementDescription.types";

/**
 * Map of the modes to interpret the pattern in an ElementDescriptor.
 */
export const ELEMENT_DESCRIPTOR_MODES_MAP = {
  /** Mode to interpret the pattern as a folder */
  FOLDER: "folder",
  /** Mode to interpret the pattern as a file */
  FILE: "file",
  /** Mode to interpret the pattern as a full path */
  FULL: "full",
} as const;

/**
 * Mode to interpret the pattern in an ElementDescriptor.
 */
export type ElementDescriptorMode =
  (typeof ELEMENT_DESCRIPTOR_MODES_MAP)[keyof typeof ELEMENT_DESCRIPTOR_MODES_MAP];

/**
 * Element descriptor, which must define a pattern and a type. The pattern is used to match files and capture values, while the type is used to categorize the element.
 */
export type ElementDescriptor = BaseDescriptor & {
  /** Type of the element (e.g., "service", "component", "util"). */
  type?: string;

  /**
   * Category of the element
   * @deprecated The category property is deprecated and will be removed in future versions. Use the category property in file descriptors instead to add multiple categories to different files in the same element, instead of categorizing the whole element with a single category. This allows for more flexibility and better organization of files within an element.
   **/
  category?: string;

  /**
   * The mode to interpret the pattern in the descriptor. It can be "folder", "file", or "full".
   * @deprecated The mode property is deprecated and will be removed in future versions. For file descriptors, the mode is always "file". For element descriptors, the mode is always "folder". Use the `requireFullMatch` property in element descriptors to require full path matching instead.
   */
  mode?: ElementDescriptorMode;
  /**
   * Optional micromatch pattern. If provided, the left side of the descriptor path must match also with this pattern from the root of the project (like if pattern is [basePattern]/** /[pattern]).
   * This option is only useful when `fullMatch` is false (default), but capturing fragments from the rest of the full path is also needed.
   **/
  basePattern?: string;
  /**
   * Like capture, but for the basePattern.
   * This allows to capture values from the left side of the path, which is useful when using the basePattern option.
   * The captured values will be merged with the ones from the capture option. If the same name is used in both captures, the value from capture will take precedence.
   */
  baseCapture?: string[];
};

/**
 * Array of element descriptors.
 */
export type ElementDescriptors = ElementDescriptor[];

/**
 * Serialized cache of ElementsDescriptor class, which is a record of element descriptions indexed by their paths.
 */
export type ElementsDescriptorSerializedCache = Record<
  string,
  ElementDescription
>;
