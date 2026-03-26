import type { MicromatchPatternNullable } from "../../Shared";
import type { BaseSingleSelector } from "../Shared";

/**
 * Selector for files
 */
export type FileSingleSelector = BaseSingleSelector & {
  /** Categories of the file */
  categories?: MicromatchPatternNullable;
};

/**
 * File selector, which can be a single file selector or an array of file selectors.
 */
export type FileSelector = FileSingleSelector | FileSingleSelector[];

/** Normalized file selector, being always an array of single selectors */
export type FileSelectorNormalized = FileSingleSelector[];
