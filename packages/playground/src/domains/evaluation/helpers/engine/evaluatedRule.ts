import { RULE_NAMES_MAP } from "@boundaries/config";

import { RULES_KEY } from "./engine.constants";
import type {
  EvaluatedRuleName,
  RuleSelection,
  RuleSelectionInput,
} from "./evaluatedRule.types";
import { getRangeOf } from "./locations";
import type { ConfigRead } from "./parseConfig.types";
import { asRecord } from "./writtenConfig";

/** The index of the options in a rule entry, which starts with the severity */
const OPTIONS_INDEX = 1;

/**
 * Finds the rule whose dependencies the playground evaluates, by the keys of `rules` as written, so that an entry left out of the normalized config for failing its schema does not make another rule the evaluated one.
 * @param config The config as written.
 * @returns `boundaries/dependencies` when it is written, otherwise the deprecated `boundaries/element-types` when it is written, and `undefined` when neither is.
 */
export function getEvaluatedRuleName(
  config: ConfigRead
): EvaluatedRuleName | undefined {
  const rules = asRecord(config.value[RULES_KEY]) ?? {};
  return [RULE_NAMES_MAP.DEPENDENCIES, RULE_NAMES_MAP.ELEMENT_TYPES].find(
    (ruleName) => Object.hasOwn(rules, ruleName)
  );
}

/**
 * Reads the options of a rule as written.
 * @param config The config as written.
 * @param ruleName The key of the rule in `rules`.
 * @returns The options, or `undefined` when the entry is only a severity or the options are not an object.
 */
function readOptions(
  config: ConfigRead,
  ruleName: EvaluatedRuleName
): Record<string, unknown> | undefined {
  const entry = asRecord(config.value[RULES_KEY])?.[ruleName];
  return asRecord(Array.isArray(entry) ? entry[OPTIONS_INDEX] : undefined);
}

/**
 * Chooses the rule whose dependencies are evaluated, and places its policies in the config text.
 * @param input The config as written, the rules `normalizeConfig` kept and whether they are valid.
 * @param input.config
 * @param input.rules
 * @param input.rulesValid
 * @returns The rule, or why no dependency is evaluated, checked in this order: the rules are invalid, neither `boundaries/dependencies` nor `boundaries/element-types` is written, the rule is off, and the rule has no options.
 */
export function selectRule({
  config,
  rules,
  rulesValid,
}: RuleSelectionInput): RuleSelection {
  if (!rulesValid) {
    return { notEvaluated: "rules-invalid" };
  }
  const ruleName = getEvaluatedRuleName(config);
  if (ruleName === undefined) {
    return { notEvaluated: "no-rule" };
  }
  const entry =
    ruleName === RULE_NAMES_MAP.DEPENDENCIES
      ? rules.dependencies
      : rules["element-types"];
  // An entry that is off and fails to normalize is left out of the normalized rules, and ESLint does not run it either
  if (entry === undefined || entry.severity === "off") {
    return { notEvaluated: "rule-off" };
  }
  // Without options the rule runner returns before it reads any dependency, so the plugin checks none
  const options = readOptions(config, ruleName);
  if (options === undefined) {
    return { notEvaluated: "no-options" };
  }

  // The options hold the policies in `policies`, or in the deprecated `rules` when `policies` is not written
  const policiesKey = options.policies === undefined ? "rules" : "policies";
  const optionsPath = [RULES_KEY, ruleName, OPTIONS_INDEX];
  return {
    rule: {
      level: entry.severity === "warn" ? "warning" : "error",
      options: entry.options,
      policies: entry.options.policies.map((_policy, index) => ({
        index,
        range: getRangeOf(config.ast, [...optionsPath, policiesKey, index]),
      })),
      // When `default` is not written, the path stops at the options
      defaultPolicy: {
        index: null,
        range: getRangeOf(config.ast, [...optionsPath, "default"]),
      },
    },
  };
}
