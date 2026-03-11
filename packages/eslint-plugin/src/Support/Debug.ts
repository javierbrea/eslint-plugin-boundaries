import type {
  DependencyDescription,
  ElementDescription,
  Matcher,
  DependencyMatchResult,
} from "@boundaries/elements";
import { isDependencyDescription } from "@boundaries/elements";
import chalk from "chalk";

import type { SettingsNormalized } from "../Settings";
import { isDebugEnabled } from "../Settings/Settings";
import { PLUGIN_NAME, DEPENDENCIES } from "../Settings/Settings.types";

import { isUndefined, isNull } from "./Common";

const warns = new Set<string>();
const debuggedFiles = new Set<string>();
const debuggedDependencies = new Set<string>();

const PREFIX_COLOR = "#A8B3D8" as const;

const COLORS_MAP = {
  blue: "blue",
  gray: "gray",
  green: "green",
  yellow: "yellow",
} as const;

type TraceColor = keyof typeof COLORS_MAP;

/**
 * Prints a debug line to stdout with optional color formatting.
 *
 * @param message - Message text to print.
 * @param color - Optional color key from the internal color map.
 * @param level - Optional log level (e.g., "warn", "info") for future extensibility (currently unused).
 */
function trace(
  message: string,
  color?: TraceColor,
  level: "log" | "warn" = "log"
) {
  if (!color) {
    // eslint-disable-next-line no-console
    console[level](message);
    return;
  }
  const output = chalk[COLORS_MAP[color]](message);
  // eslint-disable-next-line no-console
  console[level](output);
}

/**
 * Indents every line except the first one by a fixed number of spaces.
 *
 * @param text - Multi-line text to indent.
 * @param spaces - Number of spaces to prepend.
 * @returns Text with indentation applied.
 */
function indentLines(text: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line, index) => (index === 0 ? line : `${pad}${line}`))
    .join("\n");
}

/**
 * Prints a titled JSON block in debug output.
 *
 * @param title - Block title shown before data.
 * @param data - Data serialized as formatted JSON.
 */
function printDebugBlock(title: string, data: unknown): void {
  const header = `${chalk.hex(PREFIX_COLOR)(`[${PLUGIN_NAME}]`)}${chalk.blue(`[debug]`)}: ${title}`;
  trace(header);
  trace("");
  const jsonString = JSON.stringify(data, null, 2);
  const indentedJson = indentLines(jsonString, 2);
  trace(indentedJson);
  trace("");
}

/**
 * Prints a warning message using warning color.
 *
 * @param message - Warning message.
 */
export function warn(message: string) {
  trace(message, COLORS_MAP.yellow, "warn");
}

/**
 * Prints a success message using success color.
 *
 * @param message - Success message.
 */
export function success(message: string) {
  trace(message, COLORS_MAP.green);
}

/**
 * Prints a warning only once for each unique message.
 *
 * @param message - Warning message candidate.
 * @returns `true` when warning was emitted, `false` when skipped.
 */
export function warnOnce(message: string): boolean {
  if (warns.has(message)) {
    return false;
  }

  warns.add(message);
  warn(message);
  return true;
}

/**
 * Emits debug output for file or dependency descriptions when enabled.
 *
 * @param description - Element or dependency description to debug.
 * @param settings - Normalized plugin settings including debug filters.
 * @param matcher - Matcher used to evaluate debug filters.
 */
export function debugDescription(
  description: ElementDescription | DependencyDescription,
  settings: SettingsNormalized,
  matcher: Matcher
) {
  if (!isDebugEnabled(settings.debug.enabled)) {
    return;
  }

  if (isDependencyDescription(description)) {
    printDependencyDebug(description, settings, matcher);
    return;
  }

  printFileDebug(description, settings, matcher);
}

/**
 * Returns an unique identifier for a file description, used to track which files have already been debugged.
 * @param description - File element description.
 * @returns Unique identifier string for the file.
 */
function getFileIdentifier(description: ElementDescription): string {
  return description.path || "<unknown-file>";
}

/**
 * Prints debug info for a file description once per file path.
 *
 * @param description - File element description.
 * @param settings - Normalized plugin settings.
 * @param matcher - Matcher used for filter checks.
 */
function printFileDebug(
  description: ElementDescription,
  settings: SettingsNormalized,
  matcher: Matcher
) {
  if (!settings.debug.messages.files) {
    return;
  }
  const fileIdentifier = getFileIdentifier(description);
  if (debuggedFiles.has(fileIdentifier)) {
    return;
  }

  debuggedFiles.add(fileIdentifier);
  if (shouldPrintFile(description, settings, matcher)) {
    const title = `Description of file "${chalk.green(fileIdentifier)}":`;
    printDebugBlock(title, description);
  }
}

/**
 * Prints debug info for a dependency description once per file/source pair.
 *
 * @param description - Dependency description.
 * @param settings - Normalized plugin settings.
 * @param matcher - Matcher used for filter checks.
 */
function printDependencyDebug(
  description: DependencyDescription,
  settings: SettingsNormalized,
  matcher: Matcher
) {
  printFileDebug(description.from, settings, matcher);

  if (!settings.debug.messages.dependencies) {
    return;
  }

  const dependencySource = description.dependency.source || "<unknown-source>";
  const fileIdentifier = getFileIdentifier(description.from);
  const dependencyIdentifier = `${dependencySource}-${fileIdentifier}`;

  if (debuggedDependencies.has(dependencyIdentifier)) {
    return;
  }
  debuggedDependencies.add(dependencyIdentifier);

  if (shouldPrintDependency(description, settings, matcher)) {
    const title = `Description of dependency "${chalk.green(dependencySource)}" in file "${chalk.green(fileIdentifier)}":`;
    printDebugBlock(title, description);
  }
}

const DEPENDENCIES_VIOLATION_PREFIX = `${DEPENDENCIES} rule violation:`;

/**
 * Prints debug information for a rule result when debug mode is enabled
 *
 * @param dependencyMatchResult - The result of matching a dependency against rules, including match status and captured values.
 * @param ruleIndex - The index of the rule that was matched, if any.
 * @param dependency - The original dependency description that was evaluated against the rules.
 * @param settings - Normalized plugin settings including debug filters.
 * @param matcher - Matcher used to evaluate debug filters.
 */
export function printDependenciesRuleResult(
  dependencyMatchResult: DependencyMatchResult | null,
  ruleIndex: number | null,
  dependency: DependencyDescription,
  settings: SettingsNormalized,
  matcher: Matcher
) {
  if (
    !isDebugEnabled(settings.debug.enabled) ||
    !settings.debug.messages.violations ||
    !shouldPrintDependency(dependency, settings, matcher) ||
    !shouldPrintFile(dependency.from, settings, matcher)
  ) {
    return;
  }

  if (!ruleIndex || !dependencyMatchResult) {
    printDebugBlock(
      `${DEPENDENCIES_VIOLATION_PREFIX} Dependency did not match any rule, and default policy is to deny.`,
      {
        dependency,
      }
    );
    return;
  }
  const title = `${DEPENDENCIES_VIOLATION_PREFIX} Rule at index ${ruleIndex} reported a violation because the following selector matched the dependency:`;

  const selectorRelevantData: Partial<DependencyMatchResult> = {};
  if (dependencyMatchResult.from) {
    selectorRelevantData.from = dependencyMatchResult.from;
  }
  if (dependencyMatchResult.to) {
    selectorRelevantData.to = dependencyMatchResult.to;
  }
  if (dependencyMatchResult.dependency) {
    selectorRelevantData.dependency = dependencyMatchResult.dependency;
  }
  printDebugBlock(title, {
    dependency,
    rule: {
      index: ruleIndex,
      selector: selectorRelevantData,
    },
  });
}

/**
 * Checks whether a file description passes debug file filters.
 *
 * @param description - File description to evaluate.
 * @param settings - Normalized plugin settings.
 * @param matcher - Matcher used to evaluate selectors.
 * @returns `true` when file should be printed in debug output.
 */
function shouldPrintFile(
  description: ElementDescription,
  settings: SettingsNormalized,
  matcher: Matcher
) {
  const fileFilters = settings.debug.filter.files;
  if (isUndefined(fileFilters)) {
    return true;
  }
  if (fileFilters.length === 0) {
    return false;
  }
  return fileFilters.some(
    (selector) =>
      !isNull(matcher.getSelectorMatchingDescription(description, selector))
  );
}

/**
 * Checks whether a dependency description passes debug dependency filters.
 *
 * @param description - Dependency description to evaluate.
 * @param settings - Normalized plugin settings.
 * @param matcher - Matcher used to evaluate selectors.
 * @returns `true` when dependency should be printed in debug output.
 */
function shouldPrintDependency(
  description: DependencyDescription,
  settings: SettingsNormalized,
  matcher: Matcher
) {
  const dependencyFilters = settings.debug.filter.dependencies;
  if (isUndefined(dependencyFilters)) {
    return true;
  }
  if (dependencyFilters.length === 0) {
    return false;
  }
  return dependencyFilters.some(
    (selector) =>
      matcher.getSelectorMatchingDescription(description, selector).isMatch
  );
}
