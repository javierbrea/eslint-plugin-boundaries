import chalk from "chalk";

import { PLUGIN_NAME } from "../constants/plugin";
import { isDebugModeEnabled } from "./settings";

const warns = [];
const debuggedFiles = [];

function trace(message, color) {
  // eslint-disable-next-line no-console
  console.log(chalk[color](`[${PLUGIN_NAME}]: ${message}`));
}

function warn(message) {
  trace(message, "yellow");
}

export function success(message) {
  trace(message, "green");
}

export function warnOnce(message) {
  if (!warns.includes(message)) {
    warns.push(message);
    warn(message);
  }
}

export function debugFileInfo(fileInfo) {
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
