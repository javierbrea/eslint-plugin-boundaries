import { normalizeConfig } from "@boundaries/config";
import type { SettingsNormalized } from "@boundaries/config";
import { describeEntity } from "@boundaries/policies";

import { describeFiles } from "./describeFiles";
import type { FileDescription } from "./engine.types";

const FILES = [
  "src/helpers/format/index.js",
  "src/modules/checkout/index.js",
  "src/modules/checkout/index.spec.js",
  "src/index.css",
];

/**
 * Describes a file as `describeEntity` does, and keeps what the playground shows: its element types, element path, captured values, file categories and module origin, in the facets of the plugin.
 * @param settings The normalized settings.
 * @param path The path of the file.
 * @returns What the playground shows of the description.
 */
function describeAsPlugin(
  settings: SettingsNormalized,
  path: string
): FileDescription {
  const {
    element,
    file,
    module: moduleDescription,
  } = describeEntity(settings, path);

  return {
    element: {
      types: element.types,
      path: element.path,
      captured: element.captured,
    },
    file: { categories: file.categories },
    module: { origin: moduleDescription.origin },
  };
}

/**
 * Normalizes settings as written.
 * @param settings The settings as written.
 * @returns The normalized settings.
 */
function normalize(settings: Record<string, unknown>): SettingsNormalized {
  return normalizeConfig({ settings, rules: {} }).value.settings;
}

describe("DescribeFiles", () => {
  describe("describeFiles", () => {
    it("should describe each file as describeEntity does, with only what the playground shows", () => {
      // Arrange
      const settings = normalize({
        "boundaries/elements": [
          { type: "helper", pattern: "helpers/*" },
          { type: "module", pattern: "modules/*", capture: ["module"] },
        ],
        "boundaries/files": [{ category: "test", pattern: "**/*.spec.js" }],
      });

      // Act
      const { files } = describeFiles(settings, FILES);

      // Assert
      expect(files).toEqual(
        new Map(FILES.map((path) => [path, describeAsPlugin(settings, path)]))
      );
    });

    it("should count the files that each descriptor labels, apart from the descriptors that share its type or its category", () => {
      // Arrange
      const settings = normalize({
        "boundaries/elements": [
          { type: "unit", pattern: "helpers/*" },
          { type: "unit", pattern: "modules/*" },
          { type: "page", pattern: "pages/*" },
        ],
        "boundaries/files": [
          { category: "source", pattern: "**/*.js" },
          { category: "source", pattern: "**/*.css" },
          { category: "test", pattern: "**/*.spec.js" },
        ],
      });

      // Act
      const { elementDescriptorFiles, fileDescriptorFiles } = describeFiles(
        settings,
        FILES
      );

      // Assert
      expect(elementDescriptorFiles).toEqual([1, 2, 0]);
      expect(fileDescriptorFiles).toEqual([3, 1, 1]);
    });

    it("should describe the files with their own types and categories, not with the labels that count them", () => {
      // Arrange
      const settings = normalize({
        "boundaries/elements": [{ type: "helper", pattern: "helpers/*" }],
        "boundaries/files": [{ category: "source", pattern: "**/*.js" }],
      });

      // Act
      const { files } = describeFiles(settings, FILES);

      // Assert
      expect(files.get("src/helpers/format/index.js")).toEqual(
        expect.objectContaining({
          element: expect.objectContaining({ types: ["helper"] }),
          file: expect.objectContaining({ categories: ["source"] }),
        })
      );
    });

    it("should describe nothing and count no files when there are no files", () => {
      // Arrange
      const settings = normalize({
        "boundaries/elements": [{ type: "helper", pattern: "helpers/*" }],
      });

      // Act
      const described = describeFiles(settings, []);

      // Assert
      expect(described).toEqual({
        files: new Map(),
        elementDescriptorFiles: [0],
        fileDescriptorFiles: [],
      });
    });
  });
});
