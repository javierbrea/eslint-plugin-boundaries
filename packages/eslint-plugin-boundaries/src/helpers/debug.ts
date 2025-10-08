import chalk from "chalk";

import { PLUGIN_NAME } from "../constants/plugin";
import type { FileInfo, ImportInfo } from "../core/ElementsInfo.types";

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

function warn(message: string) {
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

// TODO: Add type guard to know if it's FileInfo or ImportInfo

export function debugFileInfo(fileInfo: FileInfo | ImportInfo) {
  const fileInfoKey = fileInfo.path || fileInfo.source;
  if (isDebugModeEnabled() && !debuggedFiles.includes(fileInfoKey)) {
    debuggedFiles.push(fileInfoKey);
    if (fileInfo.type) {
      success(`'${fileInfoKey}' is of type '${fileInfo.type}'`);
    } else {
      warn(`'${fileInfoKey}' is of unknown type`);
    }
    trace(`\n${JSON.stringify(fileInfo, null, 2)}`, "gray");
  }
}
