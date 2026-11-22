import { areRulesValid } from "../Shared";

import type { ConfigAnalysis, ProjectConfig } from "./Config.types";
import { selectRule } from "./EvaluatedRule";
import { normalizeConfigSafely } from "./NormalizeConfigSafely";
import { summarizePolicies } from "./Policies";
import { resolveRootPath } from "./RootPath";
import {
  summarizeElementTypes,
  summarizeFileCategories,
  summarizeRules,
} from "./Summaries";

/**
 * Normalizes a config object and says what it defines, before any file of a project is described: its diagnostics, the rule whose dependencies are evaluated or why none is, and the summaries of its element types, file categories, rules and policies, each with its path in the config object.
 * @param config The config object as written: only `settings` and `rules` are read.
 * @returns The analysis of the config. A policy whose selector cannot be normalized, such as one half written, gives an error at its path instead of a throw.
 * @throws What `normalizeConfig` of `@boundaries/config` threw for the config, the same object, when an entry that is on throws for a reason that none of its policies explains, such as a schema that the validator cannot compile where code generation from strings is forbidden, so that the evaluation fails instead of showing a project without problems. What `normalizeConfig` throws for the config without the entries that throw goes through too.
 */
export function analyzeConfig(config: ProjectConfig): ConfigAnalysis {
  // A policy half written makes `normalizeConfig` throw. The analysis is the host that resolves the root path, as the plugin does for ESLint
  const { value, diagnostics } = normalizeConfigSafely(
    { settings: config.settings, rules: config.rules },
    { rootPath: resolveRootPath(config.settings) }
  );
  const { settings } = value;
  const rulesValid = areRulesValid(diagnostics);
  const { ruleName, ...verdict } = selectRule({
    config,
    rules: value.rules,
    rulesValid,
  });
  const input = { config, settings, diagnostics, evaluatedRuleName: ruleName };

  return {
    settings,
    diagnostics,
    rulesValid,
    elementTypes: summarizeElementTypes(input),
    fileCategories: summarizeFileCategories(input),
    rules: summarizeRules(input),
    policies: verdict.rule ? summarizePolicies(verdict.rule) : [],
    ...verdict,
  };
}
