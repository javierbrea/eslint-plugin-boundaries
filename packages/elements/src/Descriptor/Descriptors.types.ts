import type { DependencyDescriptorSerializedCache } from "./Dependency";
import type {
  ElementDescriptors,
  ElementsDescriptorSerializedCache,
} from "./Element";
import type { EntitiesDescriptorSerializedCache } from "./Entity";
import type { FileDescriptors, FilesDescriptorSerializedCache } from "./File";
import type { ModulesDescriptorSerializedCache } from "./Module";

/**
 * Descriptors for elements and files, which can be used to describe the structure of a project.
 */
export type DescriptorsConfig = {
  /** Optional element descriptors. If not provided, no abstract layer of elements will be created and only file descriptors will be used to describe the files in the project. */
  elements?: ElementDescriptors;
  /** Optional file descriptors. If not provided, only element descriptors will be used to describe the files in the project. */
  files?: FileDescriptors;
  /** When true, only the first matching descriptor's type is used at each path level. When false (default), an element can match multiple type descriptors at the same path level, accumulating all matched types in the `types` array.
   * @deprecated Use `elementsSingleMatch` instead. Kept as a backward-compatible alias; `elementsSingleMatch` takes precedence when both are set.
   */
  elementsSingleType?: boolean;
  /** Alias of `elementsSingleType`, using vocabulary shared with `filesSingleMatch`. When true, only the first matching descriptor's type is used at each path level. When false (default), an element can match multiple type descriptors at the same path level, accumulating all matched types in the `types` array. Takes precedence over `elementsSingleType` when both are set. */
  elementsSingleMatch?: boolean;
  /** When true, only the first matching file descriptor's category is used; matching stops. When false (default), a file accumulates every category whose descriptor pattern matches it. */
  filesSingleMatch?: boolean;
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
  /** Serialized modules cache */
  modules: ModulesDescriptorSerializedCache;
};
