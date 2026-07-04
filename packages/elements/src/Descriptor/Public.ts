export {
  DEPENDENCY_KIND_TYPE,
  DEPENDENCY_KIND_VALUE,
  DEPENDENCY_KIND_TYPEOF,
  DEPENDENCY_KINDS_MAP,
  DEPENDENCY_KINDS_SET,
  DEPENDENCY_RELATIONSHIPS_MAP,
  DEPENDENCY_RELATIONSHIPS_SET,
  DEPENDENCY_RELATIONSHIPS_INVERTED_MAP,
} from "./Dependency";
export {
  isDependencyKind,
  isDependencyDescription,
  isDependencyWithInternalRelationship,
} from "./Dependency";
export { DependenciesDescriptor } from "./Dependency";
export type {
  DependencyKind,
  DependencyRelationshipType,
  DependencyRelationship,
  DependencyInfoDescription,
  DependencyDescription,
  DependencyDescriptorSerializedCache,
  DependencyDescriptorOptions,
} from "./Dependency";

export { ELEMENT_DESCRIPTOR_MODES_MAP } from "./Element";
export {
  isElementDescription,
  isUnknownElementDescription,
  isKnownElementDescription,
  isIgnoredElementDescription,
  isElementDescriptor,
} from "./Element";
export { ElementsDescriptor } from "./Element";
export type {
  ElementDescription,
  ElementParent,
  IgnoredElementDescription,
  UnknownElementDescription,
  KnownElementDescription,
  ElementDescriptorMode,
  ElementDescriptor,
  ElementDescriptors,
  ElementsDescriptorSerializedCache,
} from "./Element";

export { isEntityDescription } from "./Entity";
export { EntitiesDescriptor } from "./Entity";
export type {
  EntityDescription,
  EntityDescriptionsSerializedCache,
  EntitiesDescriptorSerializedCache,
} from "./Entity";

export {
  isFileDescription,
  isUnknownFileDescription,
  isKnownFileDescription,
  isIgnoredFileDescription,
  isFileDescriptor,
} from "./File";
export { FilesDescriptor } from "./File";
export type {
  FileDescription,
  IgnoredFileDescription,
  UnknownFileDescription,
  KnownFileDescription,
  FileDescriptor,
  FileDescriptors,
  FileDescriptionsSerializedCache,
  FilesDescriptorSerializedCache,
} from "./File";

export { ORIGINS_MAP, ORIGINS_SET } from "./Module";
export { isOriginDescription } from "./Module";
export { ModulesDescriptor } from "./Module";
export type {
  Origin,
  ModuleDescription,
  ModuleDescriptionsSerializedCache,
  ModulesDescriptorSerializedCache,
} from "./Module";

export type {
  CapturedValues,
  BaseDescription,
  BaseIgnoredDescription,
  BaseKnownDescription,
  BaseUnknownDescription,
  DescriptorPattern,
  BaseDescriptor,
} from "./Shared";

export { Descriptors } from "./Descriptors";
export type {
  DescriptorsConfig,
  DescriptorsSerializedCache,
} from "./Descriptors.types";
