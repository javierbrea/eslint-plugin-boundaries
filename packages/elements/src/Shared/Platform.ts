/**
 * Checks whether the code is running in Node.js. It reads `process` from `globalThis`, so it does not throw in browsers, where `process` is not defined.
 * @returns True when running in Node.js, false otherwise.
 */
export function isNode(): boolean {
  return typeof globalThis.process?.versions?.node === "string";
}

/**
 * Checks whether the code is running on Windows. It reads `process` from `globalThis`, so it does not throw in browsers, where `process` is not defined.
 * @returns True when running on Windows, false otherwise.
 */
export function isWindows(): boolean {
  return globalThis.process?.platform === "win32";
}
