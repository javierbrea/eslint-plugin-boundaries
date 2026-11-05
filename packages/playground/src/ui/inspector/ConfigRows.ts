import type {
  ElementTypeSummary,
  FileCategorySummary,
  RuleSummary,
} from "@/engine";
import { formatCount } from "@/ui/common";

import type { ConfigRow } from "./ConfigRows.types";

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
