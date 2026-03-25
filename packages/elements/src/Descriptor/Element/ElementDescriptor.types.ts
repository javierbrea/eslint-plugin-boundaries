import type { BaseDescriptor } from "../Shared";

import type { ElementDescription } from "./ElementDescription.types";

/**
 * Element descriptor, which must define a pattern and a type. The pattern is used to match files and capture values, while the type is used to categorize the element.
 */
export type ElementDescriptor = BaseDescriptor & {
  /** Type of the element (e.g., "service", "component", "util"). */
  type: string;
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

  /** If true, the descriptor will only match files that fully match the pattern, to ensure that only the exact file or folder is matched, without matching from the right side of the path. */
  fullMatch?: boolean;
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
