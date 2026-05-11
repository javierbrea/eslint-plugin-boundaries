import type { MicromatchPatternNullable } from "../../Shared";

/**
 * Selector for module information.
 */
export type ModuleSingleSelector = {
  /** Base source of the module for external/core modules */
  source?: MicromatchPatternNullable;
  /** Origin of the module */
  origin?: MicromatchPatternNullable;
  /** Internal path of the file relative to the base for external/core modules */
  internalPath?: MicromatchPatternNullable;
};

/** Module selector, which can be a single selector or an array of selectors. */
export type ModuleSelector = ModuleSingleSelector | ModuleSingleSelector[];

/** Normalized module selector, which can be a single normalized selector or an array of normalized selectors. */
export type ModuleSelectorNormalized = ModuleSingleSelector[];
