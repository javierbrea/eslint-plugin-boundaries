import type { BaseDescriptor } from "../Shared";

import type { FileDescription } from "./FileDescription.types";

/**
 * File descriptor, which must define a pattern and a category. The pattern is used to match files and capture values, while the category is used to categorize the file.
 */
export type FileDescriptor = BaseDescriptor & {
  /** Category of the file (e.g., "service", "component", "util"). */
  category: string;

  /**
   * @deprecated Backward compatibility with legacy element descriptors with mode "file". This option will be removed in future versions.
   **/
  type?: string;

  /**
   * Optional micromatch pattern. If provided, the left side of the descriptor path must match also with this pattern from the root of the project (like if pattern is [basePattern]/** /[pattern]).
   * This option is only useful when `fullMatch` is false (default), but capturing fragments from the rest of the full path is also needed.
   * @deprecated Used only internally for backward compatibility with legacy element descriptors with mode "file". This option will be removed in future versions.
   **/
  basePattern?: string;
  /**
   * Like capture, but for the basePattern.
   * This allows to capture values from the left side of the path, which is useful when using the basePattern option.
   * The captured values will be merged with the ones from the capture option. If the same name is used in both captures, the value from capture will take precedence.
   * @deprecated Used only internally for backward compatibility with legacy element descriptors with mode "file". This option will be removed in future versions.
   */
  baseCapture?: string[];
};

/**
 * Array of file descriptors.
 */
export type FileDescriptors = FileDescriptor[];

/**
 * Serialized cache of file descriptions.
 */
export type FileDescriptionsSerializedCache = Record<string, FileDescription>;

/**
 * Serialized cache for FilesDescriptor class.
 */
export type FilesDescriptorSerializedCache = {
  /** Serialized descriptions cache */
  descriptions: FileDescriptionsSerializedCache;
};
