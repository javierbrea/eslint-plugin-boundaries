// Types and constants of the settings and rule options
export * from "./Shared/Settings.types";

// Diagnostics
export type {
  Diagnostic,
  DiagnosticLevel,
  DiagnosticPath,
  ConfigResult,
} from "./Diagnostics";
export { DIAGNOSTIC_LEVELS_MAP } from "./Diagnostics";

// Links to the docs
export {
  docsUrl,
  getRuleDocsPath,
  ruleDocsUrl,
  moreInfoLink,
  migrationGuideLink,
  migrationToV2GuideLink,
  migrationToV6GuideLink,
  migrationToV7GuideLink,
  moreInfoSettingsLink,
  moreInfoElementsLink,
  moreInfoLegacySettingsLink,
  moreInfoSelectorsLink,
} from "./Docs";

// Schemas of the rule options
export type { JsonSchema } from "./Schemas";
export { getRuleOptionsSchema } from "./Schemas";

// Settings
export type { NormalizeSettingsOptions } from "./Settings";
export {
  normalizeSettings,
  isSettingsKey,
  isDependencyNodeKey,
} from "./Settings";

// Rule options
export type { RuleOptionsValidation } from "./RuleOptions";
export {
  validateRuleOptions,
  normalizeDependenciesRuleOptions,
  isRuleEffect,
  isRulePolicy,
  isRuleName,
  isRuleShortName,
} from "./RuleOptions";

// Config
export type {
  ConfigNormalized,
  NormalizeConfigOptions,
  RuleEntryNormalized,
  RuleSeverity,
} from "./Config";
export { normalizeConfig, RULE_SEVERITIES_MAP } from "./Config";
