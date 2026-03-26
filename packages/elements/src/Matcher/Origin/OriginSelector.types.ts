import type { MicromatchPatternNullable } from "../../Shared";

/**
 * Selector for origin information.
 */
export type OriginSingleSelector = {
  /** Base source of the origin for external/core modules */
  module?: MicromatchPatternNullable;
  /** Origin of the origin */
  kind?: MicromatchPatternNullable;
};

/** Origin selector, which can be a single selector or an array of selectors. */
export type OriginSelector = OriginSingleSelector | OriginSingleSelector[];

/** Normalized origin selector, which can be a single normalized selector or an array of normalized selectors. */
export type OriginSelectorNormalized = OriginSingleSelector[];
