/**
 * Map of the diagnostic levels.
 */
export const DIAGNOSTIC_LEVELS_MAP = {
  /** The input is rejected */
  ERROR: "error",
  /** The input is ignored or has no effect */
  WARNING: "warning",
  /** The input uses a legacy syntax that still works */
  DEPRECATION: "deprecation",
} as const;

/**
 * Severity of a diagnostic: `"error"` when the input is rejected, as ESLint rejects options that fail the rule schema; `"warning"` when the input is ignored or has no effect; `"deprecation"` when the input uses a legacy syntax that still works.
 */
export type DiagnosticLevel =
  (typeof DIAGNOSTIC_LEVELS_MAP)[keyof typeof DIAGNOSTIC_LEVELS_MAP];

/**
 * Object keys and array indexes from the root of the input, such as `["boundaries/elements", 2]`.
 */
export type DiagnosticPath = (string | number)[];

/**
 * A problem found in the input.
 */
export type Diagnostic = {
  /** Severity of the problem */
  level: DiagnosticLevel;
  /** The title that the ESLint plugin prints */
  title: string;
  /** The details and the docs link that the ESLint plugin prints under the title */
  detail?: string;
  /** One path per affected entry. Empty when the problem concerns the whole input */
  paths: DiagnosticPath[];
};

/**
 * Result of a function that normalizes an input and reports its problems.
 */
export type ConfigResult<T> = {
  /** The normalized value. Always set: invalid entries are left out */
  value: T;
  /** The problems found, in the order that the ESLint plugin prints them, each one once */
  diagnostics: Diagnostic[];
};
