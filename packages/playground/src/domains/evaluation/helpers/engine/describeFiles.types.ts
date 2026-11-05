import type { FileDescription } from "./engine.types";

/** The files of a sketch, described as the plugin describes them, and how many files each descriptor labels */
export type DescribedFiles = {
  /** The description of each file, by path */
  readonly files: ReadonlyMap<string, FileDescription>;
  /** For each element descriptor of the normalized settings, in their order, how many files have an element that it gives its type to */
  readonly elementDescriptorFiles: readonly number[];
  /** For each file descriptor of the normalized settings, in their order, how many files it gives its category to */
  readonly fileDescriptorFiles: readonly number[];
};
