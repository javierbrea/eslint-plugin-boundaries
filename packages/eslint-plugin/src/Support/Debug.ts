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

function indentLines(text: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line, index) => (index === 0 ? line : `${pad}${line}`))
    .join("\n");
}

function printDebugBlock(title: string, data: unknown): void {
  const header = `${chalk.hex(PREFIX_COLOR)(`[${PLUGIN_NAME}]`)}${chalk.blue(`[debug]`)}: ${title}`;
  trace(header);
  trace("");
  const jsonString = JSON.stringify(data, null, 2);
  const indentedJson = indentLines(jsonString, 2);
  trace(indentedJson);
  trace("");
}

export function warn(message: string) {
  trace(message, COLORS_MAP.yellow);
}

export function success(message: string) {
  trace(message, COLORS_MAP.green);
}

export function warnOnce(message: string): boolean {
  if (!warns.includes(message)) {
    warns.push(message);
    warn(message);
    return true;
  }
  return false;
}

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
