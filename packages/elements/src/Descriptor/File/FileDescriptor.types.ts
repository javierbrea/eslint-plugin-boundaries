import type { BaseDescriptor } from "../Shared";

import type { FileDescription } from "./FileDescription.types";

/**
 * File descriptor, which must define a pattern and a category. The pattern is used to match files and capture values, while the category is used to categorize the file.
 */
export type FileDescriptor = BaseDescriptor & {
  /** Category of the file (e.g., "service", "component", "util"). */
  category: string;
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
