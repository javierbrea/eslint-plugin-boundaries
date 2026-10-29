import type { DiagnosticPath } from "../Diagnostics";

/**
 * Error found when validating the options list of a rule entry against the rule schema.
 */
export type RuleOptionsSchemaError = {
  /** The title of the diagnostic */
  title: string;
  /** The lines that ESLint prints for each schema error, and the rule docs link */
  detail: string;
  /** The path of each value that fails the schema, from the root of the options list */
  paths: DiagnosticPath[];
};
