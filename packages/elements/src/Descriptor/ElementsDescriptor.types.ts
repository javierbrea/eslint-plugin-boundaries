/**
 * Captured values from an element path.
 */
export type CapturedValues = Record<string, string>;

/**
 * Base element properties related to captured values
 */
export type BaseElementCommons = {
  /** Type of the element */
  type: string | null;
  /** Category of the element */
  category: string | null;
  /** Absolute path of the file */
  path: string;
  /** Parent elements */
  parents: LocalElementParent[];
  /** Captured values from the element */
  capturedValues: CapturedValues;
};

/**
 * Description of an ignored element
 */
export type IgnoredElement = BaseElementCommons & {
  /** Type of the element */
  type: null;
  /** Category of the element */
  category: null;
  /** Parent elements */
  parents: [];
  /** Indicates if the file is ignored */
  isIgnored: true;
};

/**
 * Base Element with only type
 */
export type BaseElementWithType = BaseElementCommons & {
  /** Type of the element **/
  type: string;
  /** Category of the element */
  category: null;
};

/**
 * Base Element with only category
 */
export type BaseElementWithCategory = BaseElementCommons & {
  /** Category of the element */
  category: string;
  /** Type of the element **/
  type: null;
};

/**
 * Base Element with type and category
 */
export type BaseElementWithTypeAndCategory = BaseElementCommons & {
  /** Category of the element */
  category: string;
  /** Type of the element **/
  type: string;
};

/**
 * Base description of an element
 */
export type BaseElement =
  | BaseElementWithType
  | BaseElementWithCategory
  | BaseElementWithTypeAndCategory;

/**
 * Description of a local element (file)
 */
export type LocalElement = BaseElement & {
  /** Path of the element */
  elementPath: string;
  /** Internal path of the file relative to the elementPath */
  internalPath: string;
};

export type LocalElementParent = Pick<
  LocalElement,
  "type" | "category" | "elementPath" | "capturedValues"
>;

export const DEPENDENCY_KIND_TYPE = "type" as const;
export const DEPENDENCY_KIND_VALUE = "value" as const;

/**
 * Map of the kinds of dependency, either a type dependency or a value dependency.
 */
export const DEPENDENCY_KINDS_MAP = {
  /**
   * Type import, e.g., `import type { X } from 'module'`
   */
  TYPE: DEPENDENCY_KIND_TYPE,

  /**
   * Value import, e.g., `import { X } from 'module'`
   */
  VALUE: DEPENDENCY_KIND_VALUE,
} as const;

/**
 * Kind of dependency, either a type dependency or a value dependency.
 */
export type DependencyKind =
  (typeof DEPENDENCY_KINDS_MAP)[keyof typeof DEPENDENCY_KINDS_MAP];

/**
 * Base description of a dependency
 */
export type BaseDependencyElement = BaseElement & {
  /** Dependency source */
  source: string;
  /** Specifiers imported or exported from the dependency, if applicable */
  specifiers: string[] | null;
  /** Kind of the dependency, either type or value */
  kind: DependencyKind;
  /** Node kind of the dependency (e.g. "import", "dynamic-import", "export", "require", etc.) */
  nodeKind: string;
  /** Indicates if the dependency is external */
  isExternal: boolean;
};

/**
 * Description of a local dependency
 */
export type LocalDependencyElement = LocalElement &
  BaseDependencyElement & {
    /** Indicates if the dependency is external */
    isExternal: false;
  };

/**
 * Description of an external dependency
 */
export type ExternalDependencyElement = BaseDependencyElement & {
  /** Indicates if the dependency is a Node.js built-in module */
  isBuiltIn: boolean;
  /** Base module of the dependency */
  baseModule: string;
  /** Indicates that the dependency is external */
  isExternal: true;
};

/**
 * Description of a dependency
 */
export type DependencyElement =
  | LocalDependencyElement
  | ExternalDependencyElement;

/**
 * Description of an element, either local or dependency
 */
export type ElementDescription =
  | IgnoredElement
  | LocalElement
  | DependencyElement;

/**
 * Map of the modes to interpret the pattern in an ElementDescriptor.
 */
export const ELEMENT_DESCRIPTOR_MODES_MAP = {
  FOLDER: "folder",
  FILE: "file",
  FULL: "full",
} as const;

/**
 * Mode to interpret the pattern in an ElementDescriptor.
 */
export type ElementDescriptorMode =
  (typeof ELEMENT_DESCRIPTOR_MODES_MAP)[keyof typeof ELEMENT_DESCRIPTOR_MODES_MAP];

/**
 * Pattern(s) to match files for an element descriptor.
 */
export type ElementDescriptorPattern = string | string[];

/**
 * Descriptor for an element (or layer) in the project.
 * Defines the type of the element, the pattern to match files, and optional settings like mode and capture groups.
 */
export type BaseElementDescriptor = {
  /** Micromatch pattern(s) to match files belonging to this element. */
  pattern: ElementDescriptorPattern;
  /**
   * Optional micromatch pattern. If provided, the left side of the element path must match also with this pattern from the root of the project (like if pattern is [basePattern]/** /[pattern]).
   * This option is useful when using the option mode with file or folder values, but capturing fragments from the rest of the full path is also needed
   **/
  basePattern?: string;
  /**
   * Mode to interpret the pattern. Can be "folder" (default), "file", or "full".
   * - "folder": Default value. the element type will be assigned to the first file's parent folder matching the pattern.
   *             In the practice, it is like adding ** /* to the given pattern, but the plugin makes it by itself because it needs to know exactly which parent folder has to be considered the element.
   * - "file": The given pattern will not be modified, but the plugin will still try to match the last part of the path.
   *           So, a pattern like *.model.js would match with paths src/foo.model.js, src/modules/foo/foo.model.js, src/modules/foo/models/foo.model.js, etc.
   * - "full": The given pattern will only match with patterns matching the full path.
   *           This means that you will have to provide patterns matching from the base project path.
   *           So, in order to match src/modules/foo/foo.model.js you'll have to provide patterns like ** /*.model.js, ** /* /*.model.js, src/* /* /*.model.js, etc. (the chosen pattern will depend on what do you want to capture from the path)
   */
  mode?: ElementDescriptorMode;
  /**
   * It allows to capture values of some fragments in the matching path to use them later in the rules configuration.
   * Must be an array of strings representing the names of the capture groups in the pattern.
   * The number of capture names must be equal to the number of capturing groups in the pattern.
   * For example, if the pattern is "src/modules/(* *)/(* *).service.js" the capture could be ["module", "service"].
   * Then, in the rules configuration, you could use ["service", { module: "auth" }] to match only services from the auth module.
   */
  capture?: string[];
  // TODO: Define precedence when merging with baseCapture, and document it
  /**
   * Like capture, but for the basePattern.
   * This allows to capture values from the left side of the path, which is useful when using the basePattern option.
   * The captured values will be merged with the ones from the capture option.
   */
  baseCapture?: string[];
};

/**
 * Element descriptor with a type.
 */
export type ElementDescriptorWithType = BaseElementDescriptor & {
  /** Type of the element (e.g., "service", "component", "util"). */
  type: string;
  /** Category of the element */
  category?: never;
};

/**
 * Element descriptor with a category.
 */
export type ElementDescriptorWithCategory = BaseElementDescriptor & {
  /** Category of the element (e.g., "domain", "infrastructure", "application"). */
  category: string;
  /** Type of the element*/
  type?: never;
};

/**
 * Element descriptor with both type and category.
 */
export type ElementDescriptorWithTypeAndCategory = BaseElementDescriptor & {
  /** Type of the element (e.g., "service", "component", "util"). */
  type: string;
  /** Category of the element (e.g., "domain", "infrastructure", "application"). */
  category: string;
};

/**
 * Element descriptor, which can be defined by type, category, or both.
 */
export type ElementDescriptor =
  | ElementDescriptorWithType
  | ElementDescriptorWithCategory
  | ElementDescriptorWithTypeAndCategory;

/**
 * Array of element descriptors.
 */
export type ElementDescriptors = ElementDescriptor[];

/**
 * Serialized cache of element descriptions.
 */
export type ElementsDescriptorSerializedCache = Record<
  string,
  ElementDescription
>;
