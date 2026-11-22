import { PLUGIN_NAME, SETTINGS } from "@boundaries/config";

import { hasErrorUnder, RULES_KEY, SETTINGS_KEY } from "../Shared";
import {
  asRecord,
  getElementsKey,
  getKeptIndexes,
  readSettings,
} from "../WrittenConfig";

import type {
  ElementTypeSummary,
  FileCategorySummary,
  RuleSummary,
} from "./Config.types";
import type { SummariesInput } from "./Summaries.types";

/**
 * Reads the patterns of a descriptor.
 * @param pattern The `pattern` of a descriptor, as written.
 * @returns The patterns when it is a string or a list of strings, and none otherwise, as in a descriptor that is ignored.
 */
function readPatterns(pattern: unknown): string[] {
  if (typeof pattern === "string") {
    return [pattern];
  }
  return Array.isArray(pattern)
    ? pattern.filter((item): item is string => typeof item === "string")
    : [];
}

/**
 * Reads what a summary needs from an element descriptor as written, whether it is valid or not.
 * @param descriptor An entry of `boundaries/elements`.
 * @returns Its `type`, when it has one, and its patterns. A string is the legacy descriptor that `@boundaries/config` converts into the type and the pattern `<type>/*`.
 */
function readElementDescriptor(descriptor: unknown): {
  type: string | undefined;
  patterns: string[];
} {
  if (typeof descriptor === "string") {
    return { type: descriptor, patterns: [`${descriptor}/*`] };
  }
  const record = asRecord(descriptor);
  return {
    type: typeof record?.type === "string" ? record.type : undefined,
    patterns: readPatterns(record?.pattern),
  };
}

/**
 * Summarizes the element descriptors of the settings, without the files of the project that each one matches.
 * @param input What the summaries are built from.
 * @returns One summary per entry of `boundaries/elements`, or of the deprecated `boundaries/types` when `boundaries/elements` is not set, as `@boundaries/config` reads them, with its path in the config object. Those that a diagnostic says are invalid are marked as ignored.
 */
export function summarizeElementTypes(
  input: SummariesInput
): Omit<ElementTypeSummary, "files">[] {
  const settings = readSettings(input.config);
  const key = getElementsKey(settings);
  const descriptors = settings[key];
  if (!Array.isArray(descriptors)) {
    return [];
  }
  const keptIndexes = getKeptIndexes(settings, key, input.diagnostics);
  return descriptors.map((descriptor, index) => {
    const { type, patterns } = readElementDescriptor(descriptor);
    return {
      index,
      type: type ?? `#${index}`,
      patterns,
      ignored: !keptIndexes.includes(index),
      path: [SETTINGS_KEY, key, index],
    };
  });
}

/**
 * Summarizes the file descriptors of the settings, without the files of the project that each one matches.
 * @param input What the summaries are built from.
 * @returns One summary per valid entry of `boundaries/files`, with its path in the config object. The invalid ones, which `@boundaries/config` leaves out, have a diagnostic and no summary.
 */
export function summarizeFileCategories(
  input: SummariesInput
): Omit<FileCategorySummary, "files">[] {
  // The normalized descriptors are the valid entries in their order, so they are placed back at the index they have in the config object
  const keptIndexes = getKeptIndexes(
    readSettings(input.config),
    SETTINGS.FILES,
    input.diagnostics
  );

  return input.settings.fileDescriptors.map(
    ({ category, pattern }, position) => {
      const index = keptIndexes[position];
      return {
        index,
        category,
        patterns: readPatterns(pattern),
        path: [SETTINGS_KEY, SETTINGS.FILES, index],
      };
    }
  );
}

/**
 * Counts the policies in the options of a rule entry.
 * @param entry The entry of the rule as written: a severity, or a list with the severity and the options.
 * @returns The length of `policies`, or of the deprecated `rules` when `policies` is not set, and 0 when the options have none.
 */
function countPolicies(entry: unknown): number {
  const options = asRecord(Array.isArray(entry) ? entry[1] : undefined);
  const policies = options?.policies ?? options?.rules;
  return Array.isArray(policies) ? policies.length : 0;
}

/**
 * Summarizes the rules of the plugin written in the config.
 * @param input What the summaries are built from.
 * @returns One summary per key of `rules` that has the prefix of the plugin, in the order they are written, with its path in the config object. A rule is valid when no error is about its entry: its options pass the schema, as ESLint checks them, and its severity and name are known. The one that the analysis evaluates, as `selectRule` chose it, is marked.
 */
export function summarizeRules(input: SummariesInput): RuleSummary[] {
  const rules = asRecord(input.config[RULES_KEY]) ?? {};
  return Object.entries(rules)
    .filter(([ruleName]) => ruleName.startsWith(`${PLUGIN_NAME}/`))
    .map(([ruleName, entry]) => {
      const path = [RULES_KEY, ruleName];
      return {
        name: ruleName,
        policies: countPolicies(entry),
        valid: !hasErrorUnder(input.diagnostics, path),
        evaluated: ruleName === input.evaluatedRuleName,
        path,
      };
    });
}
