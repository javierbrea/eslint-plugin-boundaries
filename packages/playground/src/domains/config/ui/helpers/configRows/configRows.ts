import type {
  ElementTypeSummary,
  Evaluation,
  FileCategorySummary,
  NotEvaluatedReason,
  PolicySummary,
  RuleSummary,
} from "@/domains/evaluation/helpers/engine";
import { getPolicyRowName } from "@/domains/evaluation/ui/helpers/verdictText";
import { getCountTone } from "@/domains/problems/ui/helpers/problemItems";
import { formatCount } from "@/shared/helpers/formatCount";

import type { ConfigRow } from "./configRows.types";

/** What the row of the evaluated rule says below its name when its dependencies are not evaluated because of the rule itself. The other reasons are not here: the row says what it said before there were verdicts */
const NOT_EVALUATED_DETAILS: Readonly<
  Partial<Record<NotEvaluatedReason, string>>
> = {
  "rule-off": "off",
  "no-options": "no options",
};

/**
 * Describes an element descriptor of the settings as a row.
 * @param summary The summary of the descriptor.
 * @param summary.index Position of the descriptor in the settings, which keys the row.
 * @param summary.type Its type, or `#<index>` when it has none: the name of the row.
 * @param summary.patterns Its patterns, shown below the name.
 * @param summary.files How many files of the sketch it matches.
 * @param summary.ignored Whether a diagnostic says it is invalid and ignored.
 * @param summary.range Where the descriptor is in the config text, and the line that an ignored one names.
 * @returns The row. An ignored descriptor says so and where it is, instead of its files and its patterns.
 */
export function getElementTypeRow({
  index,
  type,
  patterns,
  files,
  ignored,
  range,
}: ElementTypeSummary): ConfigRow {
  const key = `element-${index}`;
  const target = { kind: "config", range } as const;

  return ignored
    ? {
        key,
        name: type,
        nameTone: "warn",
        status: "ignored",
        statusTone: "warn",
        detail: `invalid descriptor, line ${range.line}`,
        target,
      }
    : {
        key,
        name: type,
        status: formatCount(files, "file", "files"),
        detail: patterns.join(", "),
        target,
      };
}

/**
 * Describes a file category of the settings as a row.
 * @param summary The summary of the category.
 * @param summary.index Position of the descriptor in the settings, which keys the row.
 * @param summary.category Its category: the name of the row.
 * @param summary.patterns Its patterns, shown below the name.
 * @param summary.files How many files of the sketch it matches.
 * @param summary.range Where the descriptor is in the config text.
 * @returns The row.
 */
export function getFileCategoryRow({
  index,
  category,
  patterns,
  files,
  range,
}: FileCategorySummary): ConfigRow {
  return {
    key: `category-${index}`,
    name: category,
    status: formatCount(files, "file", "files"),
    detail: patterns.join(", "),
    target: { kind: "config", range },
  };
}

/**
 * Describes a rule of the plugin as a row.
 * @param summary The summary of the rule.
 * @param summary.name The rule as written, which is the name of the row and keys it.
 * @param summary.policies How many policies its options have.
 * @param summary.valid Whether its options pass the rule schema.
 * @param summary.range Where the rule is in the config text.
 * @returns The row. A rule whose options are invalid is not evaluated, and says so.
 */
export function getRuleRow({
  name: ruleName,
  policies,
  valid,
  range,
}: RuleSummary): ConfigRow {
  const policyCount = formatCount(policies, "policy", "policies");
  const target = { kind: "config", range } as const;

  return valid
    ? { key: ruleName, name: ruleName, status: policyCount, target }
    : {
        key: ruleName,
        name: ruleName,
        status: "not evaluated",
        statusTone: "bad",
        detail: `${policyCount} · invalid options`,
        target,
      };
}

/**
 * Describes a policy of the evaluated rule, or its default, as a row.
 * @param summary The summary of the policy.
 * @param summary.index Its index in the options, or `null` for the default, which keys the row.
 * @param summary.decided How many dependencies it decided.
 * @param summary.disallowed How many of them it disallowed.
 * @param summary.errors How many of the disallowed ones are errors; the others are warnings.
 * @param summary.range Where the policy is in the config text.
 * @returns The row: the name that `getPolicyRowName` gives it, and how many dependencies it decided, in the color of errors when it disallowed any as errors, and in the color of warnings when everything it disallowed is a warning.
 */
export function getPolicyRow(summary: PolicySummary): ConfigRow {
  const { index, decided, disallowed, errors, range } = summary;

  return {
    key: `policy-${index ?? "default"}`,
    name: getPolicyRowName(summary),
    status: formatCount(decided, "dependency", "dependencies"),
    statusTone: disallowed > 0 ? getCountTone(errors > 0) : undefined,
    target: { kind: "config", range },
  };
}

/**
 * Describes the rule whose dependencies are evaluated when they are not, as a row.
 * @param rule The summary of the rule.
 * @param reason Why no dependency is evaluated.
 * @returns A rule that is off, or written with no options, says `not evaluated` and which of the two it is. For any other reason the row is the one that `getRuleRow` gives it: its policies, or that its options are invalid.
 */
function getNotEvaluatedRuleRow(
  rule: RuleSummary,
  reason: NotEvaluatedReason
): ConfigRow {
  const detail = NOT_EVALUATED_DETAILS[reason];

  return detail === undefined
    ? getRuleRow(rule)
    : {
        key: rule.name,
        name: rule.name,
        status: "not evaluated",
        detail,
        target: { kind: "config", range: rule.range },
      };
}

/**
 * Describes a rule of the plugin whose dependencies the playground does not evaluate as a row.
 * @param rule The summary of the rule.
 * @returns The row: the rule, and that it is not evaluated here. A rule whose options are invalid also says so, with its policies, as `getRuleRow` writes it.
 */
function getOtherRuleRow(rule: RuleSummary): ConfigRow {
  const { detail } = getRuleRow(rule);

  return {
    key: rule.name,
    name: rule.name,
    status: "not evaluated here",
    detail,
    target: { kind: "config", range: rule.range },
  };
}

/**
 * Lists the rows of the policies group of the config inspector, in the order of the rules in the config.
 * @param evaluation What the engine says about the sketch.
 * @returns For the evaluated rule, one row for each of its policies and for its default, with the dependencies each one decided. While that rule is not evaluated, its own row instead. For every other rule of the plugin, one row that says it is not evaluated here.
 */
export function getPoliciesRows(evaluation: Evaluation): ConfigRow[] {
  const { rules, policies, notEvaluated } = evaluation;

  return rules.flatMap((rule) => {
    if (!rule.evaluated) {
      return [getOtherRuleRow(rule)];
    }
    return notEvaluated === undefined
      ? policies.map(getPolicyRow)
      : [getNotEvaluatedRuleRow(rule, notEvaluated)];
  });
}
