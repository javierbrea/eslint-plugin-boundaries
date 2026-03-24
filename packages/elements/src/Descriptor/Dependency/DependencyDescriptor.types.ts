import type {
  DependencyDescription,
  DependencyKind,
} from "./DependencyDescription.types";

/**
 * Serialized cache of dependency descriptor.
 */
export type DependencyDescriptorSerializedCache = Record<
  string,
  DependencyDescription
>;

/** Options for describing a dependency between two items */
export type DependencyDescriptorOptions = {
  /** Path of the element where the dependency originates */
  from: string;
  /** Path of the element where the dependency points to */
  to?: string;
  /** Source of the dependency (import/export path) */
  source: string;
  /** Kind of the dependency (type, runtime) */
  kind: DependencyKind;
  /** Type of the node creating the dependency in the dependent element */
  nodeKind?: string;
  /** Specifiers imported or exported in the dependency */
  specifiers?: string[];
};
