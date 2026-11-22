/** A parent of an element: the element that contains it, by the pattern of its descriptor */
export type ParentDescription = {
  /** The types of the parent, or `null` when no element descriptor gives it any */
  readonly types: readonly string[] | null;
  /** The path of the parent, or `null` when it cannot be resolved */
  readonly path: string | null;
  /** What the pattern of the parent captured, or `null` when it captured nothing */
  readonly captured: Readonly<Record<string, string>> | null;
};

/** What the plugin describes of an entity, with the names and the values of its selectors: a file of the project or, as the target of a dependency, an external module. It is every property that an element, a file or a module selector matches, so that a host can show them all. The analysis maps it from `@boundaries/elements`, so that no host depends on the shape of its descriptions */
export type EntityDescription = {
  /** The element that the file belongs to, which an element selector matches */
  readonly element: {
    /** The types of the element of the file, or `null` when no element descriptor matches it */
    readonly types: readonly string[] | null;
    /** The path of the element, which is the path of the file when the settings ignore it, or `null` when no element descriptor matches the file */
    readonly path: string | null;
    /** The path of the file inside its element, such as `index.js`, or `null` when no element descriptor matches the file or the settings ignore it */
    readonly fileInternalPath: string | null;
    /** What the pattern of the element captured, or `null` when it captured nothing */
    readonly captured: Readonly<Record<string, string>> | null;
    /** The elements that contain it, the closest first, or none when it has no parent or no element descriptor matches the file */
    readonly parents: readonly ParentDescription[];
    /** Whether the settings ignore the file, so that nothing else is known of its element */
    readonly isIgnored: boolean;
    /** Whether no element descriptor matches the file, which is also so when the settings ignore it and when the entity is a module outside the project */
    readonly isUnknown: boolean;
  };
  /** The file itself, which a file selector matches */
  readonly file: {
    /** The categories of the file, or `null` when no file descriptor matches it */
    readonly categories: readonly string[] | null;
    /** The path of the file, or `null` when the entity is a module outside the project, which is no file of it */
    readonly path: string | null;
    /** What the pattern of the file descriptor captured, or `null` when it captured nothing */
    readonly captured: Readonly<Record<string, string>> | null;
    /** Whether the settings ignore the file */
    readonly isIgnored: boolean;
    /** Whether no file descriptor matches the file, which is also so when the settings ignore it and when the entity is a module outside the project */
    readonly isUnknown: boolean;
  };
  /** The module that the entity is, which a module selector matches */
  readonly module: {
    /** Where the module comes from. Every file of the project is local, unless the root path leaves it outside with `outsideRootPath` */
    readonly origin: "local" | "external" | "core";
    /** The base name of an external or core module, such as `react` for `react/jsx-runtime`, or `null` for a local one */
    readonly source: string | null;
    /** The path inside an external or core module, such as `jsx-runtime` for `react/jsx-runtime`, or `null` for a local one or when the source is the module itself */
    readonly internalPath: string | null;
  };
};

/** How the elements of a dependency are related, as the `relationship` of a dependency selector names it */
export type DependencyRelationshipKind =
  | "internal"
  | "child"
  | "descendant"
  | "sibling"
  | "parent"
  | "uncle"
  | "nephew"
  | "ancestor";

/** The relationship between the element of a dependency and the element it points to, from the perspective of both */
export type DependencyRelationship = {
  /** What the file that has the dependency is to the target, such as `parent` when the target is a child of its element, or `null` when they are not related or the target is not an element */
  readonly from: DependencyRelationshipKind | null;
  /** What the target is to the file that has the dependency, such as `child`, or `null` when they are not related or the target is not an element */
  readonly to: DependencyRelationshipKind | null;
};

/** What the plugin describes of a dependency, with the names and the values of its selectors: what it points to and the dependency itself. What it comes from is the description of its file, in `ProjectAnalysis.files` */
export type DependencyDescription = {
  /** What the dependency points to: a file of the project, or an external module */
  readonly to: EntityDescription;
  /** The dependency itself, which a dependency selector matches */
  readonly dependency: {
    /** `value` for an import of a value, `type` for a type-only one, and `typeof` for a `typeof` one */
    readonly kind: "value" | "type" | "typeof";
    /** The name of the dependency node that produced it, such as `import`, or `null` when none is given */
    readonly nodeKind: string | null;
    /** The source its statement writes, in full */
    readonly source: string;
    /** The names it imports or exports, as the plugin reads them from the code, or `null` when none are given */
    readonly specifiers: readonly string[] | null;
    /** The relationship between its file and its target */
    readonly relationship: DependencyRelationship;
  };
};
