import type {
  DependencyDescription,
  ElementDescription,
  Matcher,
  DependencyMatchResult,
} from "@boundaries/elements";
import { isDependencyDescription } from "@boundaries/elements";
import chalk from "chalk";

import type { SettingsNormalized } from "../Shared";
import {
  isUndefined,
  isNull,
  PLUGIN_NAME,
  DEPENDENCIES,
  SETTINGS,
} from "../Shared";

const warns = new Set<string>();
const debuggedFiles = new Set<string>();
const debuggedDependencies = new Set<string>();

const PREFIX_COLOR = "#A8B3D8" as const;

const CONSOLE_LEVELS = {
  log: "log",
  warn: "warn",
} as const;

const LOG_LEVELS = {
  debug: "debug",
  warning: "warning",
} as const;

type ConsoleLevel = keyof typeof CONSOLE_LEVELS;
type LogLevel = keyof typeof LOG_LEVELS;

/**
 * Checks whether debug mode is globally enabled through environment variable.
 *
 * @returns `true` when debug env flag is active.
 */
function isDebugModeEnabled() {
  return Boolean(process.env[SETTINGS.DEBUG]);
}

/**
 * Computes final debug activation combining setting flag and environment flag.
 *
 * @param settingEnabled - Debug flag configured in plugin settings.
 * @returns `true` when either setting or environment enables debug mode.
 */
function isDebugEnabled(settingEnabled: boolean): boolean {
  return settingEnabled || isDebugModeEnabled();
}

/**
 * Prints a log line to stdout with optional color formatting.
 *
 * @param message - Message text to print.
 * @param options - Optional parameters for color and log level.
 * @param options.color - Optional color key from the internal color map.
 * @param options.level - Optional log level determining which console method to use (default is "log").
 */
function printLog(message: string, level: ConsoleLevel) {
  // eslint-disable-next-line no-console
  console[level](message);
  return;
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
    .map((line) => `${pad}${line}`)
    .join("\n");
}

/**
 * Generates a log prefix with plugin name and log level, applying color formatting based on log level.
 * @param logLevel Type of log level to determine prefix formatting (default is "debug").
 * @returns The formatted log prefix string to prepend to debug messages.
 */
function getLogPrefix(logLevel: LogLevel): string {
  const colorMethod =
    logLevel === LOG_LEVELS.warning ? chalk.yellow : chalk.blue;
  return `${chalk.hex(PREFIX_COLOR)(`[${PLUGIN_NAME}]`)}${colorMethod(`[${logLevel}]`)}:`;
}

/**
 * Prints a titled block of text in debug output, with the title formatted according to the log level.
 * @param title - Block title shown before the message.
 * @param options - Optional parameters for log level.
 * @param options.level - Log level determining the title formatting (default is "debug").
 * @param options.message - Message text to print within the block.
 * @param level - Log level determining the title formatting (default is "debug").
 */
function printBlock(
  title: string,
  {
    level,
    message,
  }: {
    level: LogLevel;
    message?: string;
  }
): void {
  const header = `${getLogPrefix(level)} ${title}`;
  const consoleLevel =
    level === LOG_LEVELS.warning ? CONSOLE_LEVELS.warn : CONSOLE_LEVELS.log;
  if (!message) {
    printLog(header, consoleLevel);
    return;
  }
  printLog(`${header}\n${indentLines(message, 2)}\n`, consoleLevel);
}

/**
 * Prints a titled JSON block in debug output.
 *
 * @param title - Block title shown before data.
 * @param data - Data serialized as formatted JSON.
 */
function printDebugBlock(title: string, data: unknown): void {
  printBlock(title, {
    message: JSON.stringify(data, null, 2),
    level: LOG_LEVELS.debug,
  });
}

/**
 * Prints a warning message using warning color.
 * @param title - Warning title shown before message.
 * @param message - Warning message.
 */
export function warn(title: string, message?: string): void {
  printBlock(title, { message, level: LOG_LEVELS.warning });
}

/**
 * Prints a warning only once for each unique message.
 *
 * @param title - Warning title shown before message.
 * @param message - Warning message candidate.
 * @returns `true` when warning was emitted, `false` when skipped.
 */
export function warnOnce(title: string, message?: string): boolean {
  const messageKey = `${title}-${message}`;
  if (warns.has(messageKey)) {
    return false;
  }

  warns.add(messageKey);
  warn(title, message);
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
  /* istanbul ignore next - Fallback for descriptions missing path, which should not happen but ensures stability of debug logging. */
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

  /* istanbul ignore next - Fallback for descriptions missing path, which should not happen but ensures stability of debug logging. */
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
      !isNull(
        matcher.getElementSelectorMatchingDescription(description, selector)
      )
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
  if (!shouldPrintFile(description.from, settings, matcher)) {
    return false;
  }
  return dependencyFilters.some(
    (selector) =>
      matcher.getDependencySelectorMatchingDescription(description, selector)
        .isMatch
  );
}
