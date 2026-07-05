/**
 * Pattern(s) to match files for a descriptor.
 */
export type DescriptorPattern = string | string[];

/**
 * Descriptor for an element or file in the project.
 * Defines the type of the element or file, the pattern to match files, and optional settings;
 */
export type BaseDescriptor = {
  /** Micromatch pattern(s) to match files belonging to this descriptor. */
  pattern: DescriptorPattern;
  /**
   * It allows to capture values of some fragments in the matching path to use them later in the rules configuration.
   * Must be an array of strings representing the names of the capture groups in the pattern.
   * The number of capture names must be equal to the number of capturing groups in the pattern.
   * For example, if the pattern is "src/modules/(* *)/(* *).service.js" the capture could be ["module", "service"].
   * Then, in the rules configuration, you could use ["service", { module: "auth" }] to match only services from the auth module.
   */
  capture?: string[];
};
