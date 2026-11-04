import type { EntityDescription } from "@boundaries/elements";

/** A descriptor of the normalized settings that makes describing the files throw */
export type DescriptorFailure = {
  /** The list it is in: the element descriptors or the file descriptors */
  readonly descriptors: "elements" | "files";
  /** Its position in that list of the normalized settings */
  readonly position: number;
  /** The message of what describing the files throws */
  readonly message: string;
};

/** The files of a sketch, described as the plugin describes them, and how many files each descriptor labels */
export type DescribedFiles = {
  /** The description of each file, by path, made without the descriptors that fail */
  readonly files: ReadonlyMap<string, EntityDescription>;
  /** For each element descriptor of the normalized settings, in their order, how many files have an element that it gives its type to. 0 for a descriptor that fails */
  readonly elementDescriptorFiles: readonly number[];
  /** For each file descriptor of the normalized settings, in their order, how many files it gives its category to. 0 for a descriptor that fails */
  readonly fileDescriptorFiles: readonly number[];
  /** The descriptors left out, the element descriptors first, each list in its order */
  readonly failures: readonly DescriptorFailure[];
};
