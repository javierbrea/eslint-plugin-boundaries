import { normalizeConfig } from "@boundaries/config";
import type { SettingsNormalized } from "@boundaries/config";
import { Elements } from "@boundaries/elements";
import type { EntityDescription as PluginEntityDescription } from "@boundaries/elements";
import { describeEntity, Policies } from "@boundaries/policies";

import { describeFiles } from "./DescribeFiles";
import type { EntityDescription } from "./Descriptions.types";

const FILES = [
  "src/helpers/format/index.js",
  "src/modules/checkout/index.js",
  "src/modules/checkout/index.spec.js",
  "src/index.css",
];

/**
 * Normalizes settings as written.
 * @param settings The settings as written.
 * @returns The normalized settings.
 */
function normalize(settings: Record<string, unknown>): SettingsNormalized {
  return normalizeConfig({ settings, rules: {} }).value.settings;
}

/**
 * Reads a description of the plugin as the analysis keeps it, by leaving out what it does not keep instead of listing what it does, so that a property that the analysis forgets makes a spec fail. The analysis leaves out the `filePath` of the element, which is the path of the file and no selector matches, and the `category` of the element and of its parents, which are deprecated.
 * @param description The description as `@boundaries/elements` or the plugin gives it.
 * @returns The description without `filePath` and `category`.
 */
function omitDeprecated(
  description: PluginEntityDescription
): EntityDescription {
  const {
    filePath: _filePath,
    category: _category,
    parents,
    ...element
  } = description.element;

  return {
    element: {
      ...element,
      parents: parents.map(({ category: _parentCategory, ...kept }) => kept),
    },
    file: description.file,
    module: description.module,
  };
}

describe("DescribeFiles", () => {
  let policies: Policies;

  beforeEach(() => {
    jest.restoreAllMocks();
    policies = new Policies();
  });

  describe("describeFiles", () => {
    it("should describe each file as describeEntity does, with every property but the deprecated ones", () => {
      // Arrange
      const settings = normalize({
        "boundaries/elements": [
          { type: "helper", pattern: "helpers/*" },
          { type: "module", pattern: "modules/*", capture: ["module"] },
        ],
        "boundaries/files": [{ category: "test", pattern: "**/*.spec.js" }],
      });

      // Act
      const { files } = describeFiles(policies, settings, FILES);

      // Assert
      expect(files).toEqual(
        new Map(
          FILES.map((path) => [
            path,
            omitDeprecated(describeEntity(settings, path)),
          ])
        )
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
        policies,
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
      const { files } = describeFiles(policies, settings, FILES);

      // Assert
      expect(files.get("src/helpers/format/index.js")).toEqual(
        expect.objectContaining({
          element: expect.objectContaining({ types: ["helper"] }),
          file: expect.objectContaining({ categories: ["source"] }),
        })
      );
    });

    it("should describe every file with the instance it is given, with the settings and then with the settings that label each descriptor", () => {
      // Arrange
      const settings = normalize({
        "boundaries/elements": [
          { type: "helper", pattern: "helpers/*" },
          { type: "module", pattern: "modules/*" },
        ],
        "boundaries/files": [{ category: "test", pattern: "**/*.spec.js" }],
      });
      const instanceDescribeEntity = jest.spyOn(policies, "describeEntity");

      // Act
      describeFiles(policies, settings, FILES);

      // Assert
      const calls = instanceDescribeEntity.mock.calls;

      expect(calls.map(([, path]) => path)).toEqual([...FILES, ...FILES]);
      expect(
        calls
          .slice(0, FILES.length)
          .map(([calledSettings]) => calledSettings === settings)
      ).toEqual(FILES.map(() => true));
      expect(
        calls
          .slice(FILES.length)
          .map(([labelled]) => [
            labelled.elementDescriptors.map(({ type }) => type),
            labelled.fileDescriptors.map(({ category }) => category),
          ])
      ).toEqual(FILES.map(() => [["0", "1"], ["0"]]));
    });

    it("should build the matchers with one Elements instance, one for the settings and one for the labelled settings, however many times it describes files with the same instance and settings", () => {
      // Arrange
      const settings = normalize({
        "boundaries/elements": [{ type: "helper", pattern: "helpers/*" }],
        "boundaries/files": [{ category: "test", pattern: "**/*.spec.js" }],
      });
      const elementsGetMatcher = jest.spyOn(Elements.prototype, "getMatcher");

      // Act
      describeFiles(policies, settings, FILES);
      describeFiles(policies, settings, FILES);
      describeFiles(policies, settings, FILES);

      // Assert
      expect(new Set(elementsGetMatcher.mock.contexts).size).toBe(1);
      expect(
        new Set(elementsGetMatcher.mock.results.map(({ value }) => value)).size
      ).toBe(2);
    });

    it("should describe nothing and count no files when there are no files", () => {
      // Arrange
      const settings = normalize({
        "boundaries/elements": [{ type: "helper", pattern: "helpers/*" }],
      });

      // Act
      const described = describeFiles(policies, settings, []);

      // Assert
      expect(described).toEqual({
        files: new Map(),
        elementDescriptorFiles: [0],
        fileDescriptorFiles: [],
      });
    });
  });
});
