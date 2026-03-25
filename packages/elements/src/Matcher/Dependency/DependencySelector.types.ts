import type { MicromatchPatternNullable } from "../../Shared";
import type { EntitySelector, EntitySingleSelector } from "../Entity";

/**
 * Selector for dependency information.
 */
export type DependencyInfoSingleSelector = {
  /** Relationship between both elements, from both perspectives */
  relationship?: {
    /** Relationship from dependant element perspective */
    from?: MicromatchPatternNullable;
    /** Relationship from dependency element perspective */
    to?: MicromatchPatternNullable;
  };
  /** Dependency kind to filter elements */
  kind?: MicromatchPatternNullable;
  /** Micromatch pattern(s) to match only specific imports/exports */
  specifiers?: MicromatchPatternNullable;
  /** Node kind to filter elements */
  nodeKind?: MicromatchPatternNullable;
  /** Dependency source used in import/export statements */
  source?: MicromatchPatternNullable;
  /** Base source of the dependency for external/core modules */
  module?: MicromatchPatternNullable;
  /** Origin of the dependency */
  origin?: MicromatchPatternNullable;
};

/** Dependency information selector, which can be a single selector or an array of selectors. */
export type DependencyInfoSelector =
  | DependencyInfoSingleSelector
  | DependencyInfoSingleSelector[];

/**
 * Dependency selector, which includes optional 'from' and 'to' entities selectors.
 */
export type DependencySingleSelector = {
  /** Selector for the dependant entities. The entity originating the dependency */
  from?: EntitySelector | null;
  /** Selector for the dependency entities. The entity being imported/exported */
  to?: EntitySelector | null;
  /** Selector for dependency metadata */
  dependency?: DependencyInfoSelector;
};

/**
 * Normalized dependency selector, where 'from' and 'to' are always arrays or null.
 */
export type DependencySingleSelectorNormalized = {
  /** Selector for the dependant entities. The entity originating the dependency */
  from: EntitySingleSelector[] | null;
  /** Selector for the dependency entities. The entity being imported/exported */
  to: EntitySingleSelector[] | null;
  /** Selector for dependency metadata */
  dependency: DependencyInfoSingleSelector[];
};

/** Dependency selector, which can be a single selector or an array of selectors. */
export type DependencySelector =
  | DependencySingleSelector
  | DependencySingleSelector[];

/** Normalized dependency selector, which can be a single normalized selector or an array of normalized selectors. */
export type DependencySelectorNormalized =
  | DependencySingleSelectorNormalized
  | DependencySingleSelectorNormalized[];
