import type {
  ElementSingleSelector,
  DependencyInfoSingleSelector,
  ParentElementSingleSelector,
  DependencySelector,
} from "../Matcher";
import type { MicromatchPatternNullable } from "../Shared";

/**
 * Legacy selectors are used for backward compatibility with previous versions of the plugin. They include additional properties that were used in the old selector format
 */
export type LegacyParentElementSingleSelector = ParentElementSingleSelector & {
  /** The path of the parent element to select. */
  elementPath?: MicromatchPatternNullable;
};

/**
 * Legacy selectors are used for backward compatibility with previous versions of the plugin. They include additional properties that were used in the old selector format
 */
export type LegacyParentElementSelector =
  | LegacyParentElementSingleSelector
  | LegacyParentElementSingleSelector[];

/**
 * Legacy selectors are used for backward compatibility with previous versions of the plugin. They include additional properties that were used in the old selector format
 */
export type LegacyElementSingleSelector = ElementSingleSelector & {
  /** The origin of the element to select. */
  origin?: MicromatchPatternNullable;
  /** The path of the element to select. */
  elementPath?: MicromatchPatternNullable;
  /** The path of the file containing the element to select. */
  internalPath?: MicromatchPatternNullable;
};

/**
 * Legacy selectors are used for backward compatibility with previous versions of the plugin. They include additional properties that were used in the old selector format
 */
export type LegacyElementSelector =
  | LegacyElementSingleSelector
  | LegacyElementSingleSelector[];

/**
 * Legacy selectors are used for backward compatibility with previous versions of the plugin. They include additional properties that were used in the old selector format
 */
export type LegacyDependencyInfoSingleSelector =
  DependencyInfoSingleSelector & {
    /** The source of the dependency to select. */
    source?: MicromatchPatternNullable;
    /** The module of the dependency to select. */
    module?: MicromatchPatternNullable;
  };

/**
 * Legacy selectors are used for backward compatibility with previous versions of the plugin. They include additional properties that were used in the old selector format
 */
export type LegacyDependencyInfoSelector =
  | LegacyDependencyInfoSingleSelector
  | LegacyDependencyInfoSingleSelector[];

/**
 * Legacy selectors are used for backward compatibility with previous versions of the plugin. They include additional properties that were used in the old selector format
 */
export type LegacyDependencySingleSelector = {
  to?: LegacyElementSelector;
  from?: LegacyElementSelector;
  dependency?: LegacyDependencyInfoSelector;
};

/**
 * Legacy selectors are used for backward compatibility with previous versions of the plugin. They include additional properties that were used in the old selector format
 */
export type LegacyDependencySelector =
  | LegacyDependencySingleSelector
  | LegacyDependencySingleSelector[];

/**
 * Backward compatible dependency selector type that can be either a legacy dependency selector or a new dependency selector. This type is used to allow functions that accept dependency selectors to also accept legacy dependency selectors for backward compatibility.
 */
export type BackwardCompatibleDependencySelector =
  | DependencySelector
  | LegacyDependencySelector;
