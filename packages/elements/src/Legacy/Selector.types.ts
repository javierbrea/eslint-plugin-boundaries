import type {
  ElementSingleSelector,
  DependencyInfoSingleSelector,
  ParentElementSingleSelector,
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
