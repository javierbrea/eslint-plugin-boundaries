/**
 * What `validateRuleOptions` validates.
 */
export type RuleOptionsValidation = {
  /** Whether to report the deprecated syntax of the policies, as the `boundaries/legacy-warnings` setting does */
  legacyWarnings: boolean;
  /** Whether to validate the options against the rule schema, as ESLint does with the rule `meta.schema`. Default `true`; a host that already runs ESLint passes `false` */
  schema?: boolean;
};
