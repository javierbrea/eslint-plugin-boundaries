import { normalizeConfig } from "@boundaries/config";
import type { SettingsNormalized } from "@boundaries/config";
import { describeEntity } from "@boundaries/policies";

import { describeFiles } from "./DescribeFiles";

// The real description, which a test replaces to throw what the library does not
jest.mock<{ describeEntity: typeof describeEntity }>(
  "@boundaries/policies",
  () => {
    const actual = jest.requireActual<{
      describeEntity: typeof describeEntity;
    }>("@boundaries/policies");
    return { ...actual, describeEntity: jest.fn(actual.describeEntity) };
  }
);

const { describeEntity: actualDescribeEntity } = jest.requireActual<{
  describeEntity: typeof describeEntity;
}>("@boundaries/policies");

const FILES = [
  "src/helpers/format/index.js",
  "src/modules/checkout/index.js",
  "src/modules/checkout/index.spec.js",
  "src/index.css",
];

const CAPTURE_ERROR = "descriptor.capture.join is not a function";

/**
 * Normalizes settings as written.
 * @param settings The settings as written.
 * @returns The normalized settings.
 */
function normalize(settings: Record<string, unknown>): SettingsNormalized {
  return normalizeConfig({ settings, rules: {} }).value.settings;
}

describe("DescribeFiles", () => {
  beforeEach(() => {
    jest.mocked(describeEntity).mockImplementation(actualDescribeEntity);
  });

  describe("describeFiles", () => {
    it("should describe each file as describeEntity does, and leave out no descriptor", () => {
      // Arrange
      const settings = normalize({
        "boundaries/elements": [
          { type: "helper", pattern: "helpers/*" },
          { type: "module", pattern: "modules/*" },
        ],
        "boundaries/files": [{ category: "test", pattern: "**/*.spec.js" }],
      });

      // Act
      const { files, failures } = describeFiles(settings, FILES);

      // Assert
      expect(files).toEqual(
        new Map(FILES.map((path) => [path, describeEntity(settings, path)]))
      );
      expect(failures).toEqual([]);
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

    const VALID_ELEMENTS = [{ type: "module", pattern: "modules/*" }];
    const VALID_FILES = [{ category: "style", pattern: "**/*.css" }];

    it.each([
      [
        "an element descriptor with a capture that is not a list",
        [
          { type: "helper", pattern: "helpers/*", capture: "name" },
          ...VALID_ELEMENTS,
        ],
        VALID_FILES,
        "elements",
        CAPTURE_ERROR,
      ],
      [
        "an element descriptor with a base capture that is not a list",
        [
          { type: "helper", pattern: "helpers/*", baseCapture: 5 },
          ...VALID_ELEMENTS,
        ],
        VALID_FILES,
        "elements",
        "descriptor.baseCapture.join is not a function",
      ],
      [
        "a file descriptor with a capture that is not a list",
        VALID_ELEMENTS,
        [
          { category: "test", pattern: "**/*.spec.js", capture: {} },
          ...VALID_FILES,
        ],
        "files",
        CAPTURE_ERROR,
      ],
    ])(
      "should leave out %s and describe the files with the other descriptors",
      (_title, elements, files, descriptors, message) => {
        // Arrange
        const settings = normalize({
          "boundaries/elements": elements,
          "boundaries/files": files,
        });
        const validSettings = normalize({
          "boundaries/elements": VALID_ELEMENTS,
          "boundaries/files": VALID_FILES,
        });

        // Act
        const described = describeFiles(settings, FILES);

        // Assert
        expect(described.failures).toEqual([
          { descriptors, position: 0, message },
        ]);
        expect(described.files).toEqual(
          new Map(
            FILES.map((path) => [path, describeEntity(validSettings, path)])
          )
        );
      }
    );

    it("should leave out every descriptor that fails, with its position, and count no files for it", () => {
      // Arrange
      const settings = normalize({
        "boundaries/elements": [
          { type: "helper", pattern: "helpers/*" },
          { type: "module", pattern: "modules/*", capture: "name" },
          { type: "page", pattern: "pages/*", capture: 5 },
        ],
        "boundaries/files": [
          { category: "test", pattern: "**/*.spec.js", capture: "name" },
          { category: "style", pattern: "**/*.css" },
        ],
      });

      // Act
      const { failures, elementDescriptorFiles, fileDescriptorFiles } =
        describeFiles(settings, FILES);

      // Assert
      expect(failures).toEqual([
        { descriptors: "elements", position: 1, message: CAPTURE_ERROR },
        { descriptors: "elements", position: 2, message: CAPTURE_ERROR },
        { descriptors: "files", position: 0, message: CAPTURE_ERROR },
      ]);
      expect(elementDescriptorFiles).toEqual([1, 0, 0]);
      expect(fileDescriptorFiles).toEqual([0, 1]);
    });

    it("should describe nothing and leave out no descriptor when there are no files", () => {
      // Arrange
      const settings = normalize({
        "boundaries/elements": [
          { type: "helper", pattern: "helpers/*", capture: "name" },
        ],
      });

      // Act
      const described = describeFiles(settings, []);

      // Assert
      expect(described).toEqual({
        files: new Map(),
        elementDescriptorFiles: [0],
        fileDescriptorFiles: [],
        failures: [],
      });
    });

    it("should take what is thrown as the message when it is not an error", () => {
      // Arrange
      const settings = normalize({
        "boundaries/elements": [{ type: "helper", pattern: "helpers/*" }],
      });
      const throwOffline = () => {
        throw "offline";
      };
      // With one file, the calls are: the full settings, the settings without descriptors, the settings with the descriptor, and the count
      jest
        .mocked(describeEntity)
        .mockImplementationOnce(throwOffline)
        .mockImplementationOnce(actualDescribeEntity)
        .mockImplementationOnce(throwOffline);

      // Act
      const { failures } = describeFiles(settings, ["src/helpers/a/index.js"]);

      // Assert
      expect(failures).toEqual([
        { descriptors: "elements", position: 0, message: "offline" },
      ]);
    });
  });
});
