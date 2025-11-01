import type {
  DependencyDescription,
  ElementDescription,
} from "@boundaries/elements";
import { isDependencyDescription } from "@boundaries/elements";
import chalk from "chalk";

import { PLUGIN_NAME } from "../constants/plugin";

import { isDebugModeEnabled } from "./settings";

const warns: string[] = [];
const debuggedFiles: string[] = [];

const COLORS_MAP = {
  gray: "gray",
  green: "green",
  yellow: "yellow",
} as const;

type TraceColor = keyof typeof COLORS_MAP;

function trace(message: string, color: TraceColor) {
  // eslint-disable-next-line no-console
  console.log(chalk[COLORS_MAP[color]](`[${PLUGIN_NAME}]: ${message}`));
}

export function warn(message: string) {
  trace(message, COLORS_MAP.yellow);
}

export function success(message: string) {
  trace(message, COLORS_MAP.green);
}

export function warnOnce(message: string) {
  if (!warns.includes(message)) {
    warns.push(message);
    warn(message);
  }
}

export function debugDescription(
  elementDescription: ElementDescription | DependencyDescription
) {
  const isDependency = isDependencyDescription(elementDescription);
  const key = isDependency
    ? elementDescription.to.source
    : elementDescription.path || "";
  const type = isDependency
    ? elementDescription.to.type
    : elementDescription.type;

  if (isDebugModeEnabled() && !debuggedFiles.includes(key)) {
    debuggedFiles.push(key);
    if (type) {
      success(`'${key}' is of type '${type}'`);
    } else {
      warn(`'${key}' is of unknown type`);
    }
    trace(`\n${JSON.stringify(elementDescription, null, 2)}`, COLORS_MAP.gray);
  }
}
