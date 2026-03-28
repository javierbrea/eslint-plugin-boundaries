import type { MicromatchPatternNullable } from "../../Shared";
import type { BaseSingleSelector } from "../Shared";

/**
 * Selector for files
 */
export type FileSingleSelector = BaseSingleSelector & {
  /**
   * Type of the file.
   * @deprecated Temporary backward compatibility for selectors converted from legacy element selectors. Use `categories` instead.
   */
  type?: MicromatchPatternNullable;
  /**
   * Category of the file.
   * @deprecated Temporary backward compatibility for selectors converted from legacy element selectors. Use `categories` instead.
   */
  category?: MicromatchPatternNullable;
  /** Categories of the file */
  categories?: MicromatchPatternNullable;
};

/**
 * File selector, which can be a single file selector or an array of file selectors.
 */
export type FileSelector = FileSingleSelector | FileSingleSelector[];

/** Normalized file selector, being always an array of single selectors */
export type FileSelectorNormalized = FileSingleSelector[];
