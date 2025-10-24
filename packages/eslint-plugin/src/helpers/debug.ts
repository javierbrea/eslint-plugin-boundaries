import type { ElementDescription } from "@boundaries/elements";
import { isDependencyElement } from "@boundaries/elements";
import chalk from "chalk";

import { PLUGIN_NAME } from "../constants/plugin";

import { isDebugModeEnabled } from "./settings";

const warns: string[] = [];
const debuggedFiles: string[] = [];

// TODO: Create a mapping of colors to use
type TraceColor = "gray" | "green" | "yellow";

// TODO: Define valid colors for trace
function trace(message: string, color: TraceColor) {
  // eslint-disable-next-line no-console
  console.log(chalk[color](`[${PLUGIN_NAME}]: ${message}`));
}

export function warn(message: string) {
  trace(message, "yellow");
}

export function success(message: string) {
  trace(message, "green");
}

export function warnOnce(message: string) {
  if (!warns.includes(message)) {
    warns.push(message);
    warn(message);
  }
}

export function debugElementDescription(
  elementDescription: ElementDescription,
) {
  const fileInfoKey =
    elementDescription.path ||
    (isDependencyElement(elementDescription) ? elementDescription.source : "");
  if (isDebugModeEnabled() && !debuggedFiles.includes(fileInfoKey)) {
    debuggedFiles.push(fileInfoKey);
    if (elementDescription.type) {
      success(`'${fileInfoKey}' is of type '${elementDescription.type}'`);
    } else {
      warn(`'${fileInfoKey}' is of unknown type`);
    }
    trace(`\n${JSON.stringify(elementDescription, null, 2)}`, "gray");
  }
}
