import { isNode, isWindows } from "./Platform";

/**
 * Runs a callback with `globalThis.process` replaced, restoring it before returning, because Jest itself needs it.
 * @param value The value that replaces `process` while the callback runs.
 * @param callback The callback to run.
 * @returns The value returned by the callback.
 */
function withProcess<T>(value: unknown, callback: () => T): T {
  const replacedProcess = jest.replaceProperty(
    globalThis,
    "process",
    value as typeof process
  );
  try {
    return callback();
  } finally {
    replacedProcess.restore();
  }
}

describe("Platform", () => {
  describe("isNode", () => {
    it("should return true when running in Node.js", () => {
      const result = isNode();

      expect(result).toBe(true);
    });

    it("should return false when process is not defined", () => {
      const result = withProcess(undefined, isNode);

      expect(result).toBe(false);
    });

    it("should return false when process has no versions", () => {
      const result = withProcess({ env: {} }, isNode);

      expect(result).toBe(false);
    });

    it("should return false when process has no Node.js version", () => {
      const result = withProcess(
        { env: {}, version: "", versions: {} },
        isNode
      );

      expect(result).toBe(false);
    });
  });

  describe("isWindows", () => {
    it("should return true when the platform is win32", () => {
      const result = withProcess({ platform: "win32" }, isWindows);

      expect(result).toBe(true);
    });

    it("should return false when the platform is not win32", () => {
      const result = withProcess({ platform: "linux" }, isWindows);

      expect(result).toBe(false);
    });

    it("should return false when process is not defined", () => {
      const result = withProcess(undefined, isWindows);

      expect(result).toBe(false);
    });
  });
});
