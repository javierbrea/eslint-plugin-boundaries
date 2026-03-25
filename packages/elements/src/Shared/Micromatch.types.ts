/**
 * Type representing a micromatch pattern, which can be a string or an array of strings.
 */
export type MicromatchPattern = string | string[];

/**
 * Type representing a micromatch pattern supporting null values
 */
export type MicromatchPatternNullable = string | null | (string | null)[];

/**
 * Type representing values that can be matched against micromatch patterns.
 */
export type MicromatchMatchableValue =
  | string
  | string[]
  | null
  | undefined
  | boolean;
