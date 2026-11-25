import { normalizeConfig } from "@boundaries/config";
import type { Diagnostic } from "@boundaries/config";

import {
  asRecord,
  getElementsKey,
  getKeptIndexes,
  readSettings,
} from "./WrittenConfig";

/**
 * Normalizes a config object, as the analysis does.
 * @param config The config object, as written.
 * @param config.settings The settings.
 * @param config.rules The rules.
 * @returns The diagnostics of `normalizeConfig`.
 */
function normalize(config: {
  readonly settings?: unknown;
  readonly rules?: unknown;
}): Diagnostic[] {
  return normalizeConfig({ settings: config.settings, rules: config.rules })
    .diagnostics;
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
      const config = { settings: { "boundaries/root-path": "." } };

      // Act
      const settings = readSettings(config);

      // Assert
      expect(settings).toEqual({ "boundaries/root-path": "." });
      expect(settings).toBe(config.settings);
    });

    it("should return an empty object when the settings are not an object", () => {
      // Arrange
      const config = { settings: [] };

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
    it("should return the index in the config object of each descriptor that normalizeConfig keeps", () => {
      // Arrange
      const config = {
        settings: {
          "boundaries/files": [
            { pattern: "**/*.spec.js" },
            { pattern: "**/*.css", category: "style" },
            5,
            { pattern: "**/*.js", category: "script" },
          ],
        },
      };
      const diagnostics = normalize(config);

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
      const config = { settings: { "boundaries/files": { category: "test" } } };
      const diagnostics = normalize(config);

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
});
