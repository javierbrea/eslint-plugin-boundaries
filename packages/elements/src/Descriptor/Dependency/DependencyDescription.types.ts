import type { EntityDescription } from "../Entity";

export const DEPENDENCY_KIND_TYPE = "type" as const;
export const DEPENDENCY_KIND_VALUE = "value" as const;
export const DEPENDENCY_KIND_TYPEOF = "typeof" as const;

/** Map of the kinds of dependency, either a type dependency or a value dependency */
export const DEPENDENCY_KINDS_MAP = {
  /** Type import, e.g., `import type { X } from 'module'` */
  TYPE: DEPENDENCY_KIND_TYPE,

  /** Value import, e.g., `import { X } from 'module'` */
  VALUE: DEPENDENCY_KIND_VALUE,

  /** typeof import, e.g. `type ModuleType = typeof import("./my_module");` */
  TYPE_OF: DEPENDENCY_KIND_TYPEOF,
} as const;

/** Set of the kinds of dependency for fast lookup */
export const DEPENDENCY_KINDS_SET = new Set(
  Object.values(DEPENDENCY_KINDS_MAP)
);

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
  /** The dependency is a sibling of the element (both have the same parent) */
  SIBLING: "sibling",
  /** The dependency is a parent of the element */
  PARENT: "parent",
  /** The dependency is an uncle of the element */
  UNCLE: "uncle",
  /** The dependency is a nephew of the element */
  NEPHEW: "nephew",
  /** The dependency is an ancestor of the element */
  ANCESTOR: "ancestor",
} as const;

/** Set of the kinds of relationships between elements being dependencies for fast lookup */
export const DEPENDENCY_RELATIONSHIPS_SET = new Set(
  Object.values(DEPENDENCY_RELATIONSHIPS_MAP)
);

export const DEPENDENCY_RELATIONSHIPS_INVERTED_MAP = {
  [DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL]:
    DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL,
  [DEPENDENCY_RELATIONSHIPS_MAP.CHILD]: DEPENDENCY_RELATIONSHIPS_MAP.PARENT,
  [DEPENDENCY_RELATIONSHIPS_MAP.DESCENDANT]:
    DEPENDENCY_RELATIONSHIPS_MAP.ANCESTOR,
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

/**
 * Origins of a dependency, either local, external, or core.
 */
export const DEPENDENCY_ORIGIN_MAP = {
  /** Origin of local elements (files) */
  LOCAL: "local",
  /** Origin of external elements (libraries) */
  EXTERNAL: "external",
  /** Origin of core elements */
  CORE: "core",
} as const;

/**
 * Kind of dependency origin, either local, external, or core.
 */
export type DependencyOrigin =
  (typeof DEPENDENCY_ORIGIN_MAP)[keyof typeof DEPENDENCY_ORIGIN_MAP];

/** Information about a dependency between two items */
export type DependencyInfo = {
  /** Source of the dependency (import/export path) */
  source: string;
  /** Base source of the dependency for external/core modules */
  module: string | null;
  /** Kind of the dependency */
  kind: DependencyKind;
  /** Type of the node creating the dependency in the dependent item */
  nodeKind: string | null;
  /** Specifiers imported or exported in the dependency */
  specifiers: string[] | null;
  /** Relationship between the items from both perspectives */
  relationship: {
    /** Relationship between the items from the perspective of the dependent entity */
    from: DependencyRelationship | null;
    /** Relationship between the items from the perspective of the dependency entity */
    to: DependencyRelationship | null;
  };
  /** Origin of the dependency, either local, external, or core */
  origin: DependencyOrigin;
};

/**
 * Description of a dependency between two items
 */
export type DependencyDescription = {
  /** Source entity of the dependency */
  from: EntityDescription;
  /** Target entity of the dependency */
  to: EntityDescription;
  /** Information about the dependency itself */
  dependency: DependencyInfo;
};
