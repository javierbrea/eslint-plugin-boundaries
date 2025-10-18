/**
 * Captured values from an element path.
 */
export type CapturedValues = Record<string, string>;

/**
 * Base description of an element
 */
export type BaseElement = {
  /**
   * Type of the element
   * @deprecated Use types instead
   **/
  type: string | null;
  /** Types associated with the element */
  types: string[];
  /** Captured values from the element */
  capturedValues: CapturedValues;
  /**
   * Capture groups from the element path
   * @deprecated This should be get from configuration if needed
   */
  capture: string[] | null;
};

/**
 * Description of a local element (file)
 */
export type LocalElement = {
  /** Parent elements */
  parents: BaseElement[];
  /** Absolute path of the file */
  path: string;
  /** Path of the element */
  elementPath: string;
  /** Internal path of the file relative to the elementPath */
  internalPath: string;
  /** Indicates if the file is ignored */
  isIgnored: boolean;
};

/**
 * Base description of a dependency
 */
export type BaseDependencyElement = {
  /** Dependency source */
  source: string;
  /** Specifiers imported or exported from the dependency, if applicable */
  specifiers: string[] | null;
  /** Indicates if the dependency is local */
  isLocal: boolean;
  /** Indicates if the dependency is external */
  isExternal: boolean;
};

/**
 * Description of a local dependency
 */
export type LocalDependencyElement = LocalElement &
  BaseDependencyElement & {
    /** Indicates if the dependency is local */
    isLocal: true;
    /** Indicates if the dependency is external */
    isExternal: false;
  };

/**
 * Description of an external dependency
 */
export type ExternalDependencyElement = BaseDependencyElement & {
  /** Indicates if the dependency is external */
  isExternal: true;
  /** Indicates if the dependency is local */
  isLocal: false;
  /** Indicates if the dependency is a Node.js built-in module */
  isBuiltIn: boolean;
  /** Base module of the dependency */
  baseModule: string;
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
export type ElementDescription = LocalElement | DependencyElement;
