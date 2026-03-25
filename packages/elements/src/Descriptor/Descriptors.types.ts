import type { DependencyDescriptorSerializedCache } from "./Dependency";
import type {
  ElementDescriptors,
  ElementsDescriptorSerializedCache,
} from "./Element";
import type { EntitiesDescriptorSerializedCache } from "./Entity";
import type { FileDescriptors, FilesDescriptorSerializedCache } from "./File";
import type { OriginsDescriptorSerializedCache } from "./Origin";

/**
 * Descriptors for elements and files, which can be used to describe the structure of a project.
 */
export type DescriptorsConfig = {
  /** Optional element descriptors. If not provided, no abstract layer of elements will be created and only file descriptors will be used to describe the files in the project. */
  elements?: ElementDescriptors;
  /** Optional file descriptors. If not provided, only element descriptors will be used to describe the files in the project. */
  files?: FileDescriptors;
};

/**
 * Serialized cache for Descriptors class.
 */
export type DescriptorsSerializedCache = {
  /** Serialized elements cache */
  elements: ElementsDescriptorSerializedCache;
  /** Serialized files cache */
  files: FilesDescriptorSerializedCache;
  /** Serialized entities cache */
  entities: EntitiesDescriptorSerializedCache;
  /** Serialized dependencies cache */
  dependencies: DependencyDescriptorSerializedCache;
  /** Serialized origins cache */
  origins: OriginsDescriptorSerializedCache;
};
