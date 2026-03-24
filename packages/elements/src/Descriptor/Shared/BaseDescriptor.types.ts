/**
 * Pattern(s) to match files for a descriptor.
 */
export type DescriptorPattern = string | string[];

/**
 * Descriptor for an element or file in the project.
 * Defines the type of the element or file, the pattern to match files, and optional settings like mode and capture groups.
 */
export type BaseDescriptor = {
  /** Micromatch pattern(s) to match files belonging to this descriptor. */
  pattern: DescriptorPattern;
  /**
   * Optional micromatch pattern. If provided, the left side of the descriptor path must match also with this pattern from the root of the project (like if pattern is [basePattern]/** /[pattern]).
   * This option is useful when using the option mode with file or folder values, but capturing fragments from the rest of the full path is also needed
   **/
  basePattern?: string;
  /**
   * It allows to capture values of some fragments in the matching path to use them later in the rules configuration.
   * Must be an array of strings representing the names of the capture groups in the pattern.
   * The number of capture names must be equal to the number of capturing groups in the pattern.
   * For example, if the pattern is "src/modules/(* *)/(* *).service.js" the capture could be ["module", "service"].
   * Then, in the rules configuration, you could use ["service", { module: "auth" }] to match only services from the auth module.
   */
  capture?: string[];
  /**
   * Like capture, but for the basePattern.
   * This allows to capture values from the left side of the path, which is useful when using the basePattern option.
   * The captured values will be merged with the ones from the capture option. If the same name is used in both captures, the value from capture will take precedence.
   */
  baseCapture?: string[];

  /** If true, the descriptor will only match files that fully match the pattern, to ensure that only the exact file or folder is matched, without matching from the right side of the path. */
  fullMatch?: boolean;
};
