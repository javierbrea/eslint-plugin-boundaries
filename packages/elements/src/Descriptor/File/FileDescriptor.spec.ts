import type { DescriptorOptionsNormalized } from "../../Config";
import type { Micromatch } from "../../Matcher";

import { FilesDescriptor } from "./FileDescriptor";
import type { FileDescriptor, FileDescriptors } from "./FileDescriptor.types";

function createMicromatchMock(overrides?: Partial<Micromatch>): Micromatch {
  return {
    isMatch: jest.fn().mockReturnValue(false),
    capture: jest.fn().mockReturnValue(null),
    makeRe: jest.fn().mockReturnValue(/.*/),
    clearCache: jest.fn(),
    serializeCache: jest.fn().mockReturnValue({}),
    setFromSerialized: jest.fn(),
    ...overrides,
  } as unknown as Micromatch;
}

function createConfig(
  overrides?: Partial<DescriptorOptionsNormalized>
): DescriptorOptionsNormalized {
  return {
    cache: true,
    rootPath: "/root/project/",
    flagAsExternal: {
      unresolvableAlias: true,
      inNodeModules: true,
      outsideRootPath: false,
      customSourcePatterns: [],
    },
    ...overrides,
  };
}

function createFileDescriptor(
  overrides?: Partial<FileDescriptor>
): FileDescriptor {
  return {
    pattern: "src/**/*.ts",
    category: "component",
    ...overrides,
  };
}

describe("FilesDescriptor", () => {
  describe("constructor", () => {
    it("should create an instance with cache enabled", () => {
      const config = createConfig({ cache: true });
      const micromatch = createMicromatchMock();
      const descriptors: FileDescriptors = [createFileDescriptor()];

      const descriptor = new FilesDescriptor(descriptors, config, micromatch);

      expect(descriptor).toBeInstanceOf(FilesDescriptor);
    });

    it("should create an instance with cache disabled", () => {
      const config = createConfig({ cache: false });
      const micromatch = createMicromatchMock();
      const descriptors: FileDescriptors = [createFileDescriptor()];

      const descriptor = new FilesDescriptor(descriptors, config, micromatch);

      expect(descriptor).toBeInstanceOf(FilesDescriptor);
    });

    it("should throw an error when a file descriptor is invalid", () => {
      const config = createConfig();
      const micromatch = createMicromatchMock();
      const descriptors = [
        { pattern: "src/**/*.ts" },
      ] as unknown as FileDescriptors;

      expect(
        () => new FilesDescriptor(descriptors, config, micromatch)
      ).toThrow(
        "File descriptor at index 0 must have a pattern, and a 'category' defined."
      );
    });

    it("should throw an error indicating the index of the invalid descriptor", () => {
      const config = createConfig();
      const micromatch = createMicromatchMock();
      const descriptors = [
        createFileDescriptor(),
        { category: "service" },
      ] as unknown as FileDescriptors;

      expect(
        () => new FilesDescriptor(descriptors, config, micromatch)
      ).toThrow(
        "File descriptor at index 1 must have a pattern, and a 'category' defined."
      );
    });

    it("should accept an empty array of descriptors", () => {
      const config = createConfig();
      const micromatch = createMicromatchMock();

      const descriptor = new FilesDescriptor([], config, micromatch);

      expect(descriptor).toBeInstanceOf(FilesDescriptor);
    });
  });

  describe("describeFile", () => {
    describe("unknown files", () => {
      it("should return unknown description when filePath is undefined", () => {
        const config = createConfig();
        const micromatch = createMicromatchMock();
        const descriptor = new FilesDescriptor(
          [createFileDescriptor()],
          config,
          micromatch
        );

        const result = descriptor.describeFile(undefined);

        expect(result).toEqual({
          path: null,
          categories: null,
          isIgnored: false,
          isUnknown: true,
          captured: null,
        });
      });

      it("should return unknown description when no descriptor matches", () => {
        const micromatch = createMicromatchMock({
          capture: jest.fn().mockReturnValue(null),
        });
        const config = createConfig({ rootPath: undefined });
        const descriptor = new FilesDescriptor(
          [createFileDescriptor()],
          config,
          micromatch
        );

        const result = descriptor.describeFile("lib/other/file.js");

        expect(result).toEqual({
          path: "lib/other/file.js",
          categories: null,
          isIgnored: false,
          isUnknown: true,
          captured: null,
        });
      });
    });

    describe("ignored files", () => {
      it("should return ignored description when path matches ignorePaths", () => {
        const micromatch = createMicromatchMock({
          isMatch: jest.fn().mockReturnValue(true),
        });
        const config = createConfig({
          rootPath: undefined,
          ignorePaths: ["node_modules/**"],
        });
        const descriptor = new FilesDescriptor(
          [createFileDescriptor()],
          config,
          micromatch
        );

        const result = descriptor.describeFile("node_modules/lodash/index.js");

        expect(result).toEqual({
          path: "node_modules/lodash/index.js",
          categories: null,
          isIgnored: true,
          isUnknown: true,
          captured: null,
        });
      });

      it("should return ignored description when path does not match includePaths", () => {
        const micromatch = createMicromatchMock({
          isMatch: jest.fn().mockReturnValue(false),
        });
        const config = createConfig({
          rootPath: undefined,
          includePaths: ["src/**"],
        });
        const descriptor = new FilesDescriptor(
          [createFileDescriptor()],
          config,
          micromatch
        );

        const result = descriptor.describeFile("lib/file.ts");

        expect(result).toEqual({
          path: "lib/file.ts",
          categories: null,
          isIgnored: true,
          isUnknown: true,
          captured: null,
        });
      });

      it("should return ignored when both includePaths and ignorePaths are set and path is ignored", () => {
        const micromatch = createMicromatchMock({
          isMatch: jest
            .fn()
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true),
        });
        const config = createConfig({
          rootPath: undefined,
          includePaths: ["src/**"],
          ignorePaths: ["src/vendor/**"],
        });
        const descriptor = new FilesDescriptor(
          [createFileDescriptor()],
          config,
          micromatch
        );

        const result = descriptor.describeFile("src/vendor/lib.ts");

        expect(result).toEqual({
          path: "src/vendor/lib.ts",
          categories: null,
          isIgnored: true,
          isUnknown: true,
          captured: null,
        });
      });
    });

    describe("path inclusion", () => {
      it("should include path when both includePaths and ignorePaths are set and path is included but not ignored", () => {
        const isMatchMock = jest
          .fn()
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false);
        const micromatch = createMicromatchMock({
          isMatch: isMatchMock,
          capture: jest.fn().mockReturnValue(["match"]),
        });
        const config = createConfig({
          rootPath: undefined,
          includePaths: ["src/**"],
          ignorePaths: ["src/vendor/**"],
        });
        const descriptor = new FilesDescriptor(
          [createFileDescriptor()],
          config,
          micromatch
        );

        const result = descriptor.describeFile("src/components/Foo.ts");

        expect(result.isIgnored).toBe(false);
        expect(result.isUnknown).toBe(false);
      });

      it("should include all paths when neither includePaths nor ignorePaths are set", () => {
        const micromatch = createMicromatchMock({
          capture: jest.fn().mockReturnValue(["components", "Foo"]),
        });
        const config = createConfig({ rootPath: undefined });
        const descriptor = new FilesDescriptor(
          [createFileDescriptor()],
          config,
          micromatch
        );

        const result = descriptor.describeFile("src/components/Foo.ts");

        expect(result.isIgnored).toBe(false);
      });

      it("should include paths matching includePaths when set", () => {
        const isMatchMock = jest.fn().mockReturnValue(true);
        const micromatch = createMicromatchMock({
          isMatch: isMatchMock,
          capture: jest.fn().mockReturnValue(["match"]),
        });
        const config = createConfig({
          rootPath: undefined,
          includePaths: ["src/**"],
        });
        const descriptor = new FilesDescriptor(
          [createFileDescriptor()],
          config,
          micromatch
        );

        const result = descriptor.describeFile("src/file.ts");

        expect(result.isIgnored).toBe(false);
        expect(isMatchMock).toHaveBeenCalledWith("src/file.ts", ["src/**"]);
      });

      it("should include paths not matching ignorePaths when set", () => {
        const isMatchMock = jest.fn().mockReturnValue(false);
        const micromatch = createMicromatchMock({
          isMatch: isMatchMock,
          capture: jest.fn().mockReturnValue(["match"]),
        });
        const config = createConfig({
          rootPath: undefined,
          ignorePaths: ["dist/**"],
        });
        const descriptor = new FilesDescriptor(
          [createFileDescriptor()],
          config,
          micromatch
        );

        const result = descriptor.describeFile("src/file.ts");

        expect(result.isIgnored).toBe(false);
      });
    });

    describe("known files", () => {
      it("should return known description with category when descriptor matches", () => {
        const micromatch = createMicromatchMock({
          capture: jest.fn().mockReturnValue(["match"]),
        });
        const config = createConfig({ rootPath: undefined });
        const descriptor = new FilesDescriptor(
          [createFileDescriptor({ pattern: "src/**/*.ts", category: "util" })],
          config,
          micromatch
        );

        const result = descriptor.describeFile("src/utils/helper.ts");

        expect(result).toEqual({
          path: "src/utils/helper.ts",
          categories: ["util"],
          isIgnored: false,
          isUnknown: false,
          captured: null,
        });
      });

      it("should set category as single-element array for a single matching descriptor", () => {
        const micromatch = createMicromatchMock({
          capture: jest.fn().mockReturnValue(["match"]),
        });
        const config = createConfig({ rootPath: undefined });
        const descriptors: FileDescriptors = [
          createFileDescriptor({
            pattern: "src/**/*.ts",
            category: "component",
          }),
        ];
        const descriptor = new FilesDescriptor(descriptors, config, micromatch);

        const result = descriptor.describeFile("src/components/Button.ts");

        expect(result.categories).toEqual(["component"]);
      });

      it("should handle array patterns in descriptors", () => {
        const captureMock = jest
          .fn()
          .mockReturnValueOnce(null)
          .mockReturnValueOnce(["match"]);
        const micromatch = createMicromatchMock({
          capture: captureMock,
        });
        const config = createConfig({ rootPath: undefined });
        const descriptor = new FilesDescriptor(
          [
            createFileDescriptor({
              pattern: ["src/**/*.tsx", "src/**/*.ts"],
              category: "source",
            }),
          ],
          config,
          micromatch
        );

        const result = descriptor.describeFile("src/file.ts");

        expect(result.categories).toEqual(["source"]);
        expect(captureMock).toHaveBeenCalledTimes(2);
      });

      it("should accumulate categories from multiple matching descriptors without basePattern", () => {
        const micromatch = createMicromatchMock({
          capture: jest.fn().mockReturnValue(["match"]),
        });
        const config = createConfig({ rootPath: undefined });
        const descriptors: FileDescriptors = [
          createFileDescriptor({
            pattern: "src/**/*.ts",
            category: "source",
          }),
          createFileDescriptor({
            pattern: "src/**/*.ts",
            category: "typescript",
          }),
        ];
        const descriptor = new FilesDescriptor(descriptors, config, micromatch);

        const result = descriptor.describeFile("src/file.ts");

        expect(result.categories).toEqual(["source", "typescript"]);
      });

      it("should stop accumulating when a matched descriptor has stopMatching: true", () => {
        const micromatch = createMicromatchMock({
          capture: jest.fn().mockReturnValue(["match"]),
        });
        const config = createConfig({ rootPath: undefined });
        const descriptors: FileDescriptors = [
          createFileDescriptor({
            pattern: "src/**/*.ts",
            category: "source",
            stopMatching: true,
          }),
          createFileDescriptor({
            pattern: "src/**/*.ts",
            category: "typescript",
          }),
        ];
        const descriptor = new FilesDescriptor(descriptors, config, micromatch);

        const result = descriptor.describeFile("src/file.ts");

        expect(result.categories).toEqual(["source"]);
      });

      it("should keep previously accumulated categories when a matched descriptor has stopMatching: true", () => {
        const micromatch = createMicromatchMock({
          capture: jest.fn().mockReturnValue(["match"]),
        });
        const config = createConfig({ rootPath: undefined });
        const descriptors: FileDescriptors = [
          createFileDescriptor({
            pattern: "src/**/*.ts",
            category: "previous",
          }),
          createFileDescriptor({
            pattern: "src/**/*.ts",
            category: "source",
            stopMatching: true,
          }),
          createFileDescriptor({
            pattern: "src/**/*.ts",
            category: "typescript",
          }),
        ];
        const descriptor = new FilesDescriptor(descriptors, config, micromatch);

        const result = descriptor.describeFile("src/file.ts");

        expect(result.categories).toEqual(["previous", "source"]);
      });

      it("should discard previously accumulated categories when a matched descriptor has exclusive: true", () => {
        const micromatch = createMicromatchMock({
          capture: jest.fn().mockReturnValue(["match"]),
        });
        const config = createConfig({ rootPath: undefined });
        const descriptors: FileDescriptors = [
          createFileDescriptor({
            pattern: "src/**/*.ts",
            category: "source",
          }),
          createFileDescriptor({
            pattern: "src/**/index.ts",
            category: "index",
            exclusive: true,
          }),
          createFileDescriptor({
            pattern: "src/**/*.ts",
            category: "typescript",
          }),
        ];
        const descriptor = new FilesDescriptor(descriptors, config, micromatch);

        const result = descriptor.describeFile("src/index.ts");

        expect(result.categories).toEqual(["index"]);
      });

      it("should stop matching further descriptors when filesSingleMatch is enabled", () => {
        const micromatch = createMicromatchMock({
          capture: jest.fn().mockReturnValue(["match"]),
        });
        const config = createConfig({ rootPath: undefined });
        const descriptors: FileDescriptors = [
          createFileDescriptor({
            pattern: "src/**/*.ts",
            category: "source",
          }),
          createFileDescriptor({
            pattern: "src/**/*.ts",
            category: "typescript",
          }),
        ];
        const descriptor = new FilesDescriptor(
          descriptors,
          config,
          micromatch,
          true
        );

        const result = descriptor.describeFile("src/file.ts");

        expect(result.categories).toEqual(["source"]);
      });

      it("should keep accumulating when filesSingleMatch is disabled (default)", () => {
        const micromatch = createMicromatchMock({
          capture: jest.fn().mockReturnValue(["match"]),
        });
        const config = createConfig({ rootPath: undefined });
        const descriptors: FileDescriptors = [
          createFileDescriptor({
            pattern: "src/**/*.ts",
            category: "source",
          }),
          createFileDescriptor({
            pattern: "src/**/*.ts",
            category: "typescript",
          }),
        ];
        const descriptor = new FilesDescriptor(
          descriptors,
          config,
          micromatch,
          false
        );

        const result = descriptor.describeFile("src/file.ts");

        expect(result.categories).toEqual(["source", "typescript"]);
      });

      it("should merge captured values from multiple matching descriptors without basePattern", () => {
        const captureMock = jest
          .fn()
          .mockReturnValueOnce(["components", "restPath1", "Button"])
          .mockReturnValueOnce(["views", "restPath2", "Main"]);
        const micromatch = createMicromatchMock({
          capture: captureMock,
        });
        const config = createConfig({ rootPath: undefined });
        const descriptors: FileDescriptors = [
          createFileDescriptor({
            pattern: "(*).ts",
            category: "first",
            basePattern: "src/(*)",
            baseCapture: ["folder"],
            capture: ["name"],
          }),
          createFileDescriptor({
            pattern: "(*).ts",
            category: "second",
            basePattern: "lib/(*)",
            baseCapture: ["libFolder"],
            capture: ["libName"],
          }),
        ];
        const descriptor = new FilesDescriptor(descriptors, config, micromatch);

        const result = descriptor.describeFile("src/components/Button.ts");

        expect(result.categories).toEqual(["first"]);
        expect(result.captured).toEqual({
          folder: "components",
          restOfPath: "restPath1",
          name: "Button",
        });
      });
    });

    describe("captured values", () => {
      it("should capture values with basePattern and capture config", () => {
        const micromatch = createMicromatchMock({
          capture: jest
            .fn()
            .mockReturnValue(["components", "restOfPath", "Button"]),
        });
        const config = createConfig({ rootPath: undefined });
        const descriptor = new FilesDescriptor(
          [
            createFileDescriptor({
              pattern: "(*).ts",
              category: "component",
              basePattern: "src/(*)",
              baseCapture: ["folder"],
              capture: ["name"],
            }),
          ],
          config,
          micromatch
        );

        const result = descriptor.describeFile("src/components/Button.ts");

        expect(result.captured).toEqual({
          folder: "components",
          restOfPath: "restOfPath",
          name: "Button",
        });
      });

      it("should return null captured when no capture config is provided", () => {
        const micromatch = createMicromatchMock({
          capture: jest.fn().mockReturnValue(["something"]),
        });
        const config = createConfig({ rootPath: undefined });
        const descriptor = new FilesDescriptor(
          [
            createFileDescriptor({
              pattern: "src/**/*.ts",
              category: "source",
            }),
          ],
          config,
          micromatch
        );

        const result = descriptor.describeFile("src/file.ts");

        expect(result.captured).toBeNull();
      });

      it("should capture values when descriptor has capture but no basePattern", () => {
        const micromatch = createMicromatchMock({
          capture: jest.fn().mockReturnValue(["modules"]),
        });
        const config = createConfig({ rootPath: undefined });
        const descriptor = new FilesDescriptor(
          [
            createFileDescriptor({
              pattern: "src/(*)/**/*.ts",
              category: "source",
              capture: ["layer"],
            }),
          ],
          config,
          micromatch
        );

        const result = descriptor.describeFile("src/modules/auth/service.ts");

        expect(result.captured).toEqual({ layer: "modules" });
      });

      it("should merge captured values from multiple matching descriptors with plain capture and no basePattern", () => {
        const captureMock = jest
          .fn()
          .mockReturnValueOnce(["modules"])
          .mockReturnValueOnce(["service"]);
        const micromatch = createMicromatchMock({
          capture: captureMock,
        });
        const config = createConfig({ rootPath: undefined });
        const descriptors: FileDescriptors = [
          createFileDescriptor({
            pattern: "src/(*)/**/*.ts",
            category: "source",
            capture: ["layer"],
          }),
          createFileDescriptor({
            pattern: "src/**/(*).ts",
            category: "typescript",
            capture: ["fileName"],
          }),
        ];
        const descriptor = new FilesDescriptor(descriptors, config, micromatch);

        const result = descriptor.describeFile("src/modules/auth/service.ts");

        expect(result.categories).toEqual(["source", "typescript"]);
        expect(result.captured).toEqual({
          layer: "modules",
          fileName: "service",
        });
      });

      it("should skip capture indices without a name in the config", () => {
        const micromatch = createMicromatchMock({
          capture: jest.fn().mockReturnValue(["value1", "restPath", "value3"]),
        });
        const config = createConfig({ rootPath: undefined });
        const descriptor = new FilesDescriptor(
          [
            createFileDescriptor({
              pattern: "(*)/(*).ts",
              category: "source",
              basePattern: "src/(*)",
              baseCapture: ["first"],
            }),
          ],
          config,
          micromatch
        );

        const result = descriptor.describeFile("src/a/b/c.ts");

        expect(result.captured).toEqual({
          first: "value1",
          restOfPath: "restPath",
        });
      });
    });

    describe("basePattern (legacy mode)", () => {
      it("should combine basePattern with pattern for matching", () => {
        const captureMock = jest
          .fn()
          .mockReturnValue(["base", "restOfPath", "file"]);
        const micromatch = createMicromatchMock({
          capture: captureMock,
        });
        const config = createConfig({ rootPath: undefined });
        const descriptor = new FilesDescriptor(
          [
            createFileDescriptor({
              pattern: "(*).ts",
              category: "source",
              basePattern: "src/(*)",
              baseCapture: ["module"],
              capture: ["fileName"],
            }),
          ],
          config,
          micromatch
        );

        descriptor.describeFile("src/auth/service.ts");

        expect(captureMock).toHaveBeenCalledWith(
          "src/(*)/(*).ts",
          "src/auth/service.ts"
        );
      });

      it("should stop processing after first match with basePattern", () => {
        const captureMock = jest.fn().mockReturnValue(["captured"]);
        const micromatch = createMicromatchMock({
          capture: captureMock,
        });
        const config = createConfig({ rootPath: undefined });
        const descriptors: FileDescriptors = [
          createFileDescriptor({
            pattern: "*.ts",
            category: "first",
            basePattern: "src/**",
          }),
          createFileDescriptor({
            pattern: "src/**/*.ts",
            category: "second",
          }),
        ];
        const descriptor = new FilesDescriptor(descriptors, config, micromatch);

        const result = descriptor.describeFile("src/file.ts");

        expect(result.categories).toEqual(["first"]);
      });

      it("should build capture array with baseCapture and capture", () => {
        const micromatch = createMicromatchMock({
          capture: jest
            .fn()
            .mockReturnValue(["modules", "restPath", "service"]),
        });
        const config = createConfig({ rootPath: undefined });
        const descriptor = new FilesDescriptor(
          [
            createFileDescriptor({
              pattern: "(*).ts",
              category: "source",
              basePattern: "src/(*)",
              baseCapture: ["module"],
              capture: ["fileName"],
            }),
          ],
          config,
          micromatch
        );

        const result = descriptor.describeFile("src/modules/service.ts");

        expect(result.captured).toEqual({
          module: "modules",
          restOfPath: "restPath",
          fileName: "service",
        });
      });

      it("should build capture array with only baseCapture", () => {
        const micromatch = createMicromatchMock({
          capture: jest.fn().mockReturnValue(["modules", "restPath"]),
        });
        const config = createConfig({ rootPath: undefined });
        const descriptor = new FilesDescriptor(
          [
            createFileDescriptor({
              pattern: "*.ts",
              category: "source",
              basePattern: "src/(*)",
              baseCapture: ["module"],
            }),
          ],
          config,
          micromatch
        );

        const result = descriptor.describeFile("src/modules/file.ts");

        expect(result.captured).toEqual({
          module: "modules",
          restOfPath: "restPath",
        });
      });

      it("should build capture array with only capture when basePattern is used", () => {
        const micromatch = createMicromatchMock({
          capture: jest.fn().mockReturnValue(["restPath", "service"]),
        });
        const config = createConfig({ rootPath: undefined });
        const descriptor = new FilesDescriptor(
          [
            createFileDescriptor({
              pattern: "(*).ts",
              category: "source",
              basePattern: "src/**",
              capture: ["fileName"],
            }),
          ],
          config,
          micromatch
        );

        const result = descriptor.describeFile("src/modules/service.ts");

        expect(result.captured).toEqual({
          restOfPath: "restPath",
          fileName: "service",
        });
      });
    });

    describe("path normalization and rootPath", () => {
      it("should convert absolute path to relative using rootPath", () => {
        const captureMock = jest.fn().mockReturnValue(["match"]);
        const micromatch = createMicromatchMock({
          capture: captureMock,
        });
        const config = createConfig({ rootPath: "/root/project/" });
        const descriptor = new FilesDescriptor(
          [createFileDescriptor({ category: "source" })],
          config,
          micromatch
        );

        descriptor.describeFile("/root/project/src/file.ts");

        expect(captureMock).toHaveBeenCalledWith("src/**/*.ts", "src/file.ts");
      });

      it("should not relativize path when rootPath is not configured", () => {
        const captureMock = jest.fn().mockReturnValue(null);
        const micromatch = createMicromatchMock({
          capture: captureMock,
        });
        const config = createConfig({ rootPath: undefined });
        const descriptor = new FilesDescriptor(
          [createFileDescriptor({ category: "source" })],
          config,
          micromatch
        );

        descriptor.describeFile("src/file.ts");

        expect(captureMock).toHaveBeenCalledWith("src/**/*.ts", "src/file.ts");
      });

      it("should not relativize path when it is outside rootPath", () => {
        const captureMock = jest.fn().mockReturnValue(null);
        const micromatch = createMicromatchMock({
          capture: captureMock,
        });
        const config = createConfig({ rootPath: "/root/project/" });
        const descriptor = new FilesDescriptor(
          [createFileDescriptor({ category: "source" })],
          config,
          micromatch
        );

        descriptor.describeFile("/other/path/file.ts");

        expect(captureMock).toHaveBeenCalledWith(
          "src/**/*.ts",
          "/other/path/file.ts"
        );
      });

      it("should normalize backslashes in file paths", () => {
        const captureMock = jest.fn().mockReturnValue(["match"]);
        const micromatch = createMicromatchMock({
          capture: captureMock,
        });
        const config = createConfig({ rootPath: "C:/Users/project/" });
        const descriptor = new FilesDescriptor(
          [createFileDescriptor({ category: "source" })],
          config,
          micromatch
        );

        descriptor.describeFile("C:\\Users\\project\\src\\file.ts");

        expect(captureMock).toHaveBeenCalledWith("src/**/*.ts", "src/file.ts");
      });
    });

    describe("caching", () => {
      it("should return the cached result on the second call with the same path", () => {
        const micromatch = createMicromatchMock({
          capture: jest.fn().mockReturnValue(["match"]),
        });
        const config = createConfig({ rootPath: undefined });
        const descriptor = new FilesDescriptor(
          [createFileDescriptor()],
          config,
          micromatch
        );

        const first = descriptor.describeFile("src/file.ts");
        const second = descriptor.describeFile("src/file.ts");

        expect(first).toBe(second);
      });

      it("should return different results for different paths", () => {
        const captureMock = jest
          .fn()
          .mockReturnValueOnce(["match"])
          .mockReturnValueOnce(null);
        const micromatch = createMicromatchMock({
          capture: captureMock,
        });
        const config = createConfig({ rootPath: undefined });
        const descriptor = new FilesDescriptor(
          [createFileDescriptor()],
          config,
          micromatch
        );

        const known = descriptor.describeFile("src/file.ts");
        const unknown = descriptor.describeFile("lib/file.js");

        expect(known.isUnknown).toBe(false);
        expect(unknown.isUnknown).toBe(true);
      });
    });
  });

  describe("serializeCache", () => {
    it("should return a serialized cache with descriptions", () => {
      const micromatch = createMicromatchMock({
        capture: jest.fn().mockReturnValue(["match"]),
      });
      const config = createConfig({ rootPath: undefined });
      const descriptor = new FilesDescriptor(
        [createFileDescriptor()],
        config,
        micromatch
      );

      descriptor.describeFile("src/file.ts");

      const serialized = descriptor.serializeCache();

      expect(serialized).toHaveProperty("descriptions");
      expect(serialized.descriptions).toHaveProperty(["$src/file.ts"]);
    });

    it("should return an empty descriptions object when no files have been described", () => {
      const micromatch = createMicromatchMock();
      const config = createConfig({ rootPath: undefined });
      const descriptor = new FilesDescriptor(
        [createFileDescriptor()],
        config,
        micromatch
      );

      const serialized = descriptor.serializeCache();

      expect(serialized).toEqual({ descriptions: {} });
    });
  });

  describe("setCacheFromSerialized", () => {
    it("should restore cache from serialized data", () => {
      const micromatch = createMicromatchMock();
      const config = createConfig({ rootPath: undefined });
      const descriptor = new FilesDescriptor(
        [createFileDescriptor()],
        config,
        micromatch
      );

      const cacheEntry = {
        path: "src/file.ts",
        categories: ["component"],
        isIgnored: false,
        isUnknown: false,
        captured: null,
      };
      descriptor.setCacheFromSerialized({
        descriptions: { "$src/file.ts": cacheEntry },
      });

      const result = descriptor.describeFile("src/file.ts");

      expect(result).toEqual(cacheEntry);
    });
  });

  describe("clearCache", () => {
    it("should clear all cached descriptions", () => {
      const micromatch = createMicromatchMock({
        capture: jest.fn().mockReturnValue(["match"]),
      });
      const config = createConfig({ rootPath: undefined });
      const descriptor = new FilesDescriptor(
        [createFileDescriptor()],
        config,
        micromatch
      );

      descriptor.describeFile("src/file.ts");
      descriptor.clearCache();

      const serialized = descriptor.serializeCache();

      expect(serialized).toEqual({ descriptions: {} });
    });
  });
});
