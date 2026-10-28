import { DiagnosticsBuilder } from "../Diagnostics";
import type { ConfigResult, DiagnosticPath } from "../Diagnostics";
import {
  isRuleShortName,
  normalizeDependenciesRuleOptions,
  validateRuleOptions,
} from "../RuleOptions";
import { validateRuleOptionsList } from "../Schemas";
import { normalizeSettings } from "../Settings";
import {
  isArray,
  isObject,
  isUndefined,
  PLUGIN_NAME,
  RULE_SHORT_NAMES_MAP,
} from "../Shared";
import type {
  DependenciesRuleOptions,
  RuleName,
  RuleShortName,
} from "../Shared";

import { RULE_SEVERITIES_MAP } from "./Config.types";
import type {
  ConfigNormalized,
  NormalizeConfigOptions,
  RuleEntryNormalized,
  RuleSeverity,
} from "./Config.types";

/**
 * The severities that ESLint accepts in a rule entry.
 */
const RULE_SEVERITIES = new Map<unknown, RuleSeverity>([
  [0, RULE_SEVERITIES_MAP.OFF],
  [RULE_SEVERITIES_MAP.OFF, RULE_SEVERITIES_MAP.OFF],
  [1, RULE_SEVERITIES_MAP.WARN],
  [RULE_SEVERITIES_MAP.WARN, RULE_SEVERITIES_MAP.WARN],
  [2, RULE_SEVERITIES_MAP.ERROR],
  [RULE_SEVERITIES_MAP.ERROR, RULE_SEVERITIES_MAP.ERROR],
]);

/**
 * Normalizes the options of a rule: the options of the rules with `dependencies` policies are normalized, the others are returned as written.
 * @param ruleShortName The short name of the rule.
 * @param options The options of the rule entry, already validated.
 * @returns The normalized options.
 */
function normalizeRuleEntryOptions(
  ruleShortName: RuleShortName,
  options: unknown
): RuleEntryNormalized<RuleShortName>["options"] {
  if (
    ruleShortName === RULE_SHORT_NAMES_MAP.DEPENDENCIES ||
    ruleShortName === RULE_SHORT_NAMES_MAP.ELEMENT_TYPES
  ) {
    return normalizeDependenciesRuleOptions(
      options as DependenciesRuleOptions | undefined
    );
  }
  return options;
}

/**
 * Converts the path of a schema error, from the root of the options list of a rule entry, into a path from the root of the config.
 * @param ruleId The key of the rule entry in `rules`.
 * @param path The path from the root of the options list.
 * @returns The path from the root of the config.
 */
function toRuleEntryPath(ruleId: string, path: DiagnosticPath): DiagnosticPath {
  if (!path.length) {
    return ["rules", ruleId];
  }
  // The options list starts after the severity, at index 1 of the rule entry
  const [optionsIndex, ...rest] = path;
  return ["rules", ruleId, (optionsIndex as number) + 1, ...rest];
}

/**
 * Normalizes the boundaries part of an ESLint config, `{ settings, rules }`: the settings, and the entries of the plugin rules, which are validated as ESLint validates them and then as the plugin does. Keys of other plugins are ignored.
 * @param config The config object.
 * @param options Options of the normalization.
 * @param options.pluginName The prefix of the rule names, `"boundaries"` by default.
 * @param options.rootPath The root path of the project, already resolved by the host. Without it, the normalized `rootPath` is the `boundaries/root-path` setting as written.
 * @returns The normalized config and the problems found, with paths from the root of the config object.
 */
export function normalizeConfig(
  config: unknown,
  { pluginName = PLUGIN_NAME, rootPath }: NormalizeConfigOptions = {}
): ConfigResult<ConfigNormalized> {
  const diagnostics = new DiagnosticsBuilder();

  if (!isObject(config)) {
    diagnostics.error("Expected an object.");
  }
  const configObject = isObject(config) ? config : {};

  if (!isUndefined(configObject.settings) && !isObject(configObject.settings)) {
    diagnostics.error(`Key "settings": Expected an object.`, undefined, [
      ["settings"],
    ]);
  }
  const settingsResult = normalizeSettings(
    isObject(configObject.settings) ? configObject.settings : undefined,
    { rootPath }
  );
  diagnostics.addAll(settingsResult.diagnostics, ["settings"]);

  if (!isUndefined(configObject.rules) && !isObject(configObject.rules)) {
    diagnostics.error(`Key "rules": Expected an object.`, undefined, [
      ["rules"],
    ]);
  }
  const rules = isObject(configObject.rules) ? configObject.rules : {};
  const rulesNormalized: Record<
    string,
    RuleEntryNormalized<RuleShortName>
  > = {};
  const rulePrefix = `${pluginName}/`;

  for (const [ruleId, entry] of Object.entries(rules)) {
    if (!ruleId.startsWith(rulePrefix)) {
      continue;
    }

    const ruleShortName = ruleId.slice(rulePrefix.length);
    const entryList = isArray(entry) ? entry : [entry];
    const severity = RULE_SEVERITIES.get(entryList[0]);
    if (!severity) {
      diagnostics.error(
        `Key "rules": Key "${ruleId}": Expected severity of "off", 0, "warn", 1, "error", or 2.`,
        undefined,
        [isArray(entry) ? ["rules", ruleId, 0] : ["rules", ruleId]]
      );
      continue;
    }

    if (!isRuleShortName(ruleShortName)) {
      // ESLint does not look up a rule that is off
      if (severity !== RULE_SEVERITIES_MAP.OFF) {
        diagnostics.error(
          `Key "rules": Key "${ruleId}": Could not find "${ruleShortName}" in plugin "${pluginName}".`,
          undefined,
          [["rules", ruleId]]
        );
      }
      continue;
    }

    const ruleName = `${PLUGIN_NAME}/${ruleShortName}` as RuleName;
    const optionsList = entryList.slice(1);
    const options = optionsList[0];
    const schemaError = validateRuleOptionsList(ruleName, optionsList);

    if (severity === RULE_SEVERITIES_MAP.OFF) {
      // ESLint does not validate a rule that is off, so its options are only kept when they are valid
      rulesNormalized[ruleShortName] = {
        severity,
        options: normalizeRuleEntryOptions(
          ruleShortName,
          schemaError ? undefined : options
        ),
      };
      continue;
    }

    if (schemaError) {
      diagnostics.error(
        schemaError.title,
        schemaError.detail,
        schemaError.paths.map((path) => toRuleEntryPath(ruleId, path))
      );
      continue;
    }

    diagnostics.addAll(
      validateRuleOptions(ruleName, options, {
        legacyWarnings: settingsResult.value.legacyWarnings,
        // Stryker disable next-line BooleanLiteral: Equivalent. The options already passed the schema validation above, so validating them again finds nothing and only repeats the work.
        schema: false,
      }),
      ["rules", ruleId, 1]
    );
    rulesNormalized[ruleShortName] = {
      severity,
      options: normalizeRuleEntryOptions(ruleShortName, options),
    };
  }

  return {
    value: {
      settings: settingsResult.value,
      rules: rulesNormalized as ConfigNormalized["rules"],
    },
    diagnostics: diagnostics.build(),
  };
}
