import { RULE_NAMES_MAP } from "@boundaries/config";
import type { RuleEntryNormalized } from "@boundaries/config";

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
 * Gets the entry that `normalizeConfig` kept for a rule.
 * @param rules The rules `normalizeConfig` kept.
 * @param ruleName The key of the rule in `rules`.
 * @returns The entry, or `undefined` when the rule was left out.
 */
function getEntry(
  rules: RuleSelectionInput["rules"],
  ruleName: EvaluatedRuleName
): RuleEntryNormalized<"dependencies" | "element-types"> | undefined {
  return ruleName === RULE_NAMES_MAP.DEPENDENCIES
    ? rules.dependencies
    : rules["element-types"];
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
 * Chooses the rule whose dependencies the playground evaluates.
 * @param input The config as written, the rules `normalizeConfig` kept and whether they are valid.
 * @param input.config
 * @param input.rules
 * @param input.rulesValid
 * @returns The first of `boundaries/dependencies` and the deprecated `boundaries/element-types` that is written and that ESLint runs: its entry is among the normalized rules, it is not off and it has options as written, and the rules are valid, since ESLint rejects the config otherwise. When neither runs, the first that is written, so that its reason is the one shown. `undefined` when neither is written. The keys of `rules` as written decide which are written, so that an entry left out of the normalized config for failing its schema does not make another rule the chosen one while the rules are invalid.
 */
function chooseRuleName({
  config,
  rules,
  rulesValid,
}: RuleSelectionInput): EvaluatedRuleName | undefined {
  const written = [RULE_NAMES_MAP.DEPENDENCIES, RULE_NAMES_MAP.ELEMENT_TYPES];
  const writtenRules = asRecord(config.value[RULES_KEY]) ?? {};
  const writtenNames = written.filter((ruleName) =>
    Object.hasOwn(writtenRules, ruleName)
  );
  // An entry that is off and fails to normalize is left out of the normalized rules, and ESLint does not run it either
  const runs = (ruleName: EvaluatedRuleName): boolean => {
    const entry = getEntry(rules, ruleName);
    return (
      rulesValid &&
      entry !== undefined &&
      entry.severity !== "off" &&
      readOptions(config, ruleName) !== undefined
    );
  };
  return writtenNames.find(runs) ?? writtenNames[0];
}

/**
 * Chooses the rule whose dependencies are evaluated, and places its policies in the config text.
 * @param input The config as written, the rules `normalizeConfig` kept and whether they are valid.
 * @param input.config
 * @param input.rules
 * @param input.rulesValid
 * @returns The rule chosen, which is returned whatever happens next, and the rule ready to evaluate, or why no dependency is evaluated, checked in this order: the rules are invalid, neither `boundaries/dependencies` nor `boundaries/element-types` is written, the rule is off, and the rule has no options.
 */
export function selectRule(input: RuleSelectionInput): RuleSelection {
  const { config, rules, rulesValid } = input;
  const ruleName = chooseRuleName(input);
  if (!rulesValid) {
    return { ruleName, notEvaluated: "rules-invalid" };
  }
  if (ruleName === undefined) {
    return { ruleName, notEvaluated: "no-rule" };
  }
  const entry = getEntry(rules, ruleName);
  // An entry that is off and fails to normalize is left out of the normalized rules, and ESLint does not run it either
  if (entry === undefined || entry.severity === "off") {
    return { ruleName, notEvaluated: "rule-off" };
  }
  // Without options the rule runner returns before it reads any dependency, so the plugin checks none
  const options = readOptions(config, ruleName);
  if (options === undefined) {
    return { ruleName, notEvaluated: "no-options" };
  }

  // The options hold the policies in `policies`, or in the deprecated `rules` when `policies` is not written
  const policiesKey = options.policies === undefined ? "rules" : "policies";
  const optionsPath = [RULES_KEY, ruleName, OPTIONS_INDEX];
  return {
    ruleName,
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
