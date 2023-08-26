const chalk = require("chalk");

const { PLUGIN_NAME } = require("../constants/plugin");
const { isDebugModeEnabled } = require("./settings");

const warns = [];
const debuggedFiles = [];

function trace(message, color) {
  console.log(chalk[color](`[${PLUGIN_NAME}]: ${message}`));
}

function warn(message) {
  trace(message, "yellow");
}

function success(message) {
  trace(message, "green");
}

function warnOnce(message) {
  if (!warns.includes(message)) {
    warns.push(message);
    warn(message);
  }
}

function debugFileInfo(fileInfo) {
  const fileInfoKey = fileInfo.path || fileInfo.source;
  if (isDebugModeEnabled() && !debuggedFiles.includes(fileInfoKey)) {
    debuggedFiles.push(fileInfoKey);
    if (fileInfo.type) {
      success(`'${fileInfoKey}' is of type '${fileInfo.type}'`);
    } else {
      warn(`'${fileInfoKey}' is of unknown type`);
    }
    console.log(JSON.stringify(fileInfo, null, 2));
  }
}

module.exports = {
  success,
  debugFileInfo,
  warnOnce,
};
