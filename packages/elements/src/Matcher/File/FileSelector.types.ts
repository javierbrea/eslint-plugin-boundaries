import type { MicromatchPatternNullable } from "../../Shared";
import type { BaseSingleSelector } from "../Shared";

/**
 * Selector for files
 */
export type FileSingleSelector = BaseSingleSelector & {
  /** Element internal path selector, which is a micromatch pattern to match the internal path of the file relative to the element it belongs to */
  elementInternalPath?: MicromatchPatternNullable;
  /** Categories of the file */
  categories?: MicromatchPatternNullable;
  /** Whether the file is external, which means that it may have been flagged as external by settings */
  isExternal?: boolean;
};

/**
 * File selector, which can be a single file selector or an array of file selectors.
 */
export type FileSelector = FileSingleSelector | FileSingleSelector[];
