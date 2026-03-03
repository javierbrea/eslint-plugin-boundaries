import type {
  DependencyDescription,
  ElementDescription,
  Matcher,
} from "@boundaries/elements";
import { isDependencyDescription } from "@boundaries/elements";
import chalk from "chalk";

import type { SettingsNormalized } from "../Settings";
import { PLUGIN_NAME, isDebugEnabled } from "../Settings";

const warns: string[] = [];
const debuggedFiles: string[] = [];
const debuggedDependencies: string[] = [];

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
 */
function trace(message: string, color?: TraceColor) {
  if (!color) {
    // eslint-disable-next-line no-console
    console.log(message);
    return;
  }
  const output = chalk[COLORS_MAP[color]](message);
  // eslint-disable-next-line no-console
  console.log(output);
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
  trace(message, COLORS_MAP.yellow);
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
  if (!warns.includes(message)) {
    warns.push(message);
    warn(message);
    return true;
  }
  return false;
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
  const filePath = description.path || "<unknown-file>";
  if (debuggedFiles.includes(filePath)) {
    return;
  }

  debuggedFiles.push(filePath);
  if (!shouldPrintFile(description, settings, matcher)) {
    return;
  }
  const title = `Description of file "${chalk.green(filePath)}":`;
  printDebugBlock(title, description);
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
  if (!shouldPrintFile(description.from, settings, matcher)) {
    return;
  }
  const dependencyIdentifier = `${description.dependency.source || "<unknown-source>"}-${description.from.path || "<unknown-file>"}`;
  if (debuggedDependencies.includes(dependencyIdentifier)) {
    return;
  }

  debuggedDependencies.push(dependencyIdentifier);
  if (!shouldPrintDependency(description, settings, matcher)) {
    return;
  }

  const filePath = description.from.path || "<unknown-file>";
  if (!debuggedFiles.includes(filePath)) {
    debuggedFiles.push(filePath);
    const fileTitle = `Description of file "${chalk.green(filePath)}":`;
    printDebugBlock(fileTitle, description.from);
  }

  const dependencySource = description.dependency.source || "<unknown-source>";
  const title = `Description of dependency "${chalk.green(dependencySource)}" in file "${chalk.green(filePath)}":`;
  printDebugBlock(title, description);
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
  if (fileFilters === undefined) {
    return true;
  }
  if (fileFilters.length === 0) {
    return false;
  }
  return fileFilters.some(
    (selector) =>
      matcher.getSelectorMatchingDescription(description, selector) !== null
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
  if (dependencyFilters === undefined) {
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
