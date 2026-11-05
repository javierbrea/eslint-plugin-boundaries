import { normalizeConfig } from "@boundaries/config";
import type { Diagnostic } from "@boundaries/config";

import { parseConfig } from "./parseConfig";
import type { ConfigRead } from "./parseConfig.types";
import {
  asRecord,
  diagnoseFailures,
  getElementsKey,
  getKeptIndexes,
  readSettings,
} from "./writtenConfig";

const DETAIL =
  "ESLint stops with this error when it loads a rule of the plugin, whatever file it lints.";

/**
 * Reads a config text and normalizes it, as the evaluation does.
 * @param text The config text, which must be one JSON5 object.
 * @returns The config as written and the diagnostics of `normalizeConfig`.
 */
function read(text: string): {
  config: ConfigRead;
  diagnostics: Diagnostic[];
} {
  const config = parseConfig(text);
  if (!config.parsed) {
    throw new Error("The config text should be one JSON5 object");
  }
  const { diagnostics } = normalizeConfig({
    settings: config.value.settings,
    rules: config.value.rules,
  });
  return { config, diagnostics };
}

describe("WrittenConfig", () => {
  describe("asRecord", () => {
    it("should return an object as it is", () => {
      // Arrange
      const value = { a: 1 };

      // Act
      const record = asRecord(value);

      // Assert
      expect(record).toBe(value);
    });

    it.each([
      ["an array", []],
      ["null", null],
      ["a string", "settings"],
    ])("should return undefined for %s", (_title, value) => {
      // Act
      const record = asRecord(value);

      // Assert
      expect(record).toBeUndefined();
    });
  });

  describe("readSettings", () => {
    it("should return the settings as written", () => {
      // Arrange
      const { config } = read('{ settings: { "boundaries/root-path": "." } }');

      // Act
      const settings = readSettings(config);

      // Assert
      expect(settings).toEqual({ "boundaries/root-path": "." });
    });

    it("should return an empty object when the settings are not an object", () => {
      // Arrange
      const { config } = read("{ settings: [] }");

      // Act
      const settings = readSettings(config);

      // Assert
      expect(settings).toEqual({});
    });
  });

  describe("getElementsKey", () => {
    it("should return boundaries/elements when it is set", () => {
      // Act
      const key = getElementsKey({
        "boundaries/elements": [],
        "boundaries/types": [],
      });

      // Assert
      expect(key).toBe("boundaries/elements");
    });

    it("should return the deprecated boundaries/types when boundaries/elements is not set", () => {
      // Act
      const key = getElementsKey({ "boundaries/types": [] });

      // Assert
      expect(key).toBe("boundaries/types");
    });
  });

  describe("getKeptIndexes", () => {
    it("should return the index in the text of each descriptor that normalizeConfig keeps", () => {
      // Arrange
      const { config, diagnostics } = read(`{
  settings: {
    "boundaries/files": [
      { pattern: "**/*.spec.js" },
      { pattern: "**/*.css", category: "style" },
      5,
      { pattern: "**/*.js", category: "script" },
    ],
  },
}`);

      // Act
      const indexes = getKeptIndexes(
        readSettings(config),
        "boundaries/files",
        diagnostics
      );

      // Assert
      expect(indexes).toEqual([1, 3]);
    });

    it("should return none when the setting is not a list", () => {
      // Arrange
      const { config, diagnostics } = read(
        '{ settings: { "boundaries/files": { category: "test" } } }'
      );

      // Act
      const indexes = getKeptIndexes(
        readSettings(config),
        "boundaries/files",
        diagnostics
      );

      // Assert
      expect(indexes).toEqual([]);
    });
  });

  describe("diagnoseFailures", () => {
    it("should return an error at the entry of each descriptor that fails, past the invalid ones", () => {
      // Arrange
      const { config, diagnostics } = read(`{
  settings: {
    "boundaries/elements": [
      { pattern: "invalid/*" },
      { type: "helper", pattern: "helpers/*", capture: "name" },
    ],
    "boundaries/files": [
      { pattern: "**/*.spec.js" },
      { category: "style", pattern: "**/*.css" },
      { category: "test", pattern: "**/*.spec.js", capture: 5 },
    ],
  },
}`);

      // Act
      const errors = diagnoseFailures(config, diagnostics, [
        { descriptors: "elements", position: 0, message: "elements fail" },
        { descriptors: "files", position: 1, message: "files fail" },
      ]);

      // Assert
      expect(errors).toEqual([
        {
          level: "error",
          title: "elements fail.",
          detail: DETAIL,
          paths: [["settings", "boundaries/elements", 1]],
        },
        {
          level: "error",
          title: "files fail.",
          detail: DETAIL,
          paths: [["settings", "boundaries/files", 2]],
        },
      ]);
    });

    it("should place the error of an element descriptor in the deprecated boundaries/types when boundaries/elements is not set", () => {
      // Arrange
      const { config, diagnostics } = read(`{
  settings: {
    "boundaries/types": [{ type: "helper", pattern: "helpers/*", capture: "name" }],
  },
}`);

      // Act
      const errors = diagnoseFailures(config, diagnostics, [
        { descriptors: "elements", position: 0, message: "elements fail" },
      ]);

      // Assert
      expect(errors[0].paths).toEqual([["settings", "boundaries/types", 0]]);
    });
  });
});
