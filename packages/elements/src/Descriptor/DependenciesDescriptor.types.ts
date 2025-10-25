import type {
  DependencyElement,
  FileElement,
} from "./ElementsDescriptor.types";

export const DEPENDENCY_KIND_TYPE = "type" as const;
export const DEPENDENCY_KIND_VALUE = "value" as const;

/** Map of the kinds of dependency, either a type dependency or a value dependency */
export const DEPENDENCY_KINDS_MAP = {
  /** Type import, e.g., `import type { X } from 'module'` */
  TYPE: DEPENDENCY_KIND_TYPE,

  /** Value import, e.g., `import { X } from 'module'` */
  VALUE: DEPENDENCY_KIND_VALUE,
} as const;

/** Kind of dependency, either a type dependency or a value dependency */
export type DependencyKind =
  (typeof DEPENDENCY_KINDS_MAP)[keyof typeof DEPENDENCY_KINDS_MAP];

/** Map of possible kinds of relationships between elements being dependencies */
export const DEPENDENCY_RELATIONSHIPS_MAP = {
  /** The dependency is internal to the element */
  INTERNAL: "internal",
  /** The dependency is a child of the element */
  CHILD: "child",
  /** The dependency is a descendant of the element */
  DESCENDANT: "descendant",
  /**
   * The dependency is a brother of the element
   * @deprecated Use SIBLING instead
   **/
  BROTHER: "brother",
  /** The dependency is a sibling of the element (both have the same parent) */
  SIBLING: "sibling",
  /** The dependency is a parent of the element */
  PARENT: "parent",
  /** The dependency is an uncle of the element */
  UNCLE: "uncle",
  // TODO: Implement nephew detection
  /** The dependency is a nephew of the element */
  NEPHEW: "nephew",
  /** The dependency is an ancestor of the element */
  ANCESTOR: "ancestor",
} as const;

export const DEPENDENCY_RELATIONSHIPS_INVERTED_MAP = {
  [DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL]:
    DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL,
  [DEPENDENCY_RELATIONSHIPS_MAP.CHILD]: DEPENDENCY_RELATIONSHIPS_MAP.PARENT,
  [DEPENDENCY_RELATIONSHIPS_MAP.DESCENDANT]:
    DEPENDENCY_RELATIONSHIPS_MAP.ANCESTOR,
  /** @deprecated Use sibling instead */
  [DEPENDENCY_RELATIONSHIPS_MAP.BROTHER]: DEPENDENCY_RELATIONSHIPS_MAP.BROTHER,
  [DEPENDENCY_RELATIONSHIPS_MAP.SIBLING]: DEPENDENCY_RELATIONSHIPS_MAP.SIBLING,
  [DEPENDENCY_RELATIONSHIPS_MAP.PARENT]: DEPENDENCY_RELATIONSHIPS_MAP.CHILD,
  [DEPENDENCY_RELATIONSHIPS_MAP.UNCLE]: DEPENDENCY_RELATIONSHIPS_MAP.NEPHEW,
  [DEPENDENCY_RELATIONSHIPS_MAP.NEPHEW]: DEPENDENCY_RELATIONSHIPS_MAP.UNCLE,
  [DEPENDENCY_RELATIONSHIPS_MAP.ANCESTOR]:
    DEPENDENCY_RELATIONSHIPS_MAP.DESCENDANT,
} as const;

/** Kind of relationship between elements being dependencies */
export type DependencyRelationship =
  (typeof DEPENDENCY_RELATIONSHIPS_MAP)[keyof typeof DEPENDENCY_RELATIONSHIPS_MAP];

/** Information about a dependency between two elements */
export type ElementsDependencyInfo = {
  /** Kind of the dependency */
  kind: DependencyKind;
  /** Type of the node creating the dependency in the dependent element */
  nodeKind: string | null;
  /** Specifiers imported or exported in the dependency */
  specifiers: string[] | null;
  /** Relationship between the elements from both perspectives */
  relationship: {
    /** Relationship between the elements from the perspective of the file */
    from: DependencyRelationship | null;
    /** Relationship between the elements from the perspective of the dependency */
    to: DependencyRelationship | null;
  };
};

/**
 * Description of a dependency between two elements
 */
export type DependencyDescription = {
  /** Source element of the dependency */
  from: FileElement;
  /** Target element of the dependency */
  to: DependencyElement;
  /** Information about the dependency */
  dependency: ElementsDependencyInfo;
};

/**
 * Serialized cache of dependencies descriptor.
 */
export type DependenciesDescriptorSerializedCache = Record<
  string,
  DependencyDescription
>;

/** Options for describing a dependency between two elements */
export type DescribeDependencyOptions = {
  /** Path of the element where the dependency originates */
  from: string;
  /** Path of the element where the dependency points to */
  to: string;
  /** Source of the dependency (import/export path) */
  source: string;
  /** Kind of the dependency (type, runtime) */
  kind: DependencyKind;
  /** Type of the node creating the dependency in the dependent element */
  nodeKind: string;
  /** Specifiers imported or exported in the dependency */
  specifiers: string[] | null;
};
