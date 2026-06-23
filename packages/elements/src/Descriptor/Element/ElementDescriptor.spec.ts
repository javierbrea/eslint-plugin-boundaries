import type { DescriptorOptionsNormalized } from "../../Config";
import type { Micromatch } from "../../Matcher";

import { ElementsDescriptor } from "./ElementDescriptor";
import type {
  ElementDescriptor,
  ElementDescriptors,
} from "./ElementDescriptor.types";

function createCaptureLookup(
  entries: Record<string, string[]>
): jest.Mock<string[] | null, [string, string]> {
  const map = new Map(Object.entries(entries));
  return jest.fn((pattern: string, target: string) => {
    return map.get(`${pattern}::${target}`) ?? null;
  });
}

function createMakeReLookup(
  entries: Record<string, RegExp>
): jest.Mock<RegExp, [string]> {
  const map = new Map(Object.entries(entries));
  return jest.fn((pattern: string) => {
    return map.get(pattern) ?? /.*/;
  });
}

function createIsMatchLookup(
  entries: Record<string, boolean>
): jest.Mock<boolean, [string, string | string[]]> {
  const map = new Map(Object.entries(entries));
  return jest.fn((_path: string, pattern: string | string[]) => {
    const key = Array.isArray(pattern) ? pattern.join("|") : pattern;
    return map.get(key) ?? false;
  });
}

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
    rootPath: undefined,
    flagAsExternal: {
      unresolvableAlias: true,
      inNodeModules: true,
      outsideRootPath: false,
      customSourcePatterns: [],
    },
    ...overrides,
  };
}

function createDescriptor(
  overrides?: Partial<ElementDescriptor>
): ElementDescriptor {
  return {
    pattern: "components/*",
    type: "component",
    ...overrides,
  };
}

describe("ElementsDescriptor", () => {
  describe("constructor", () => {
    it("should create an instance with cache enabled", () => {
      const config = createConfig({ cache: true });
      const micromatch = createMicromatchMock();
      const descriptors: ElementDescriptors = [createDescriptor()];

      const descriptor = new ElementsDescriptor(
        descriptors,
        config,
        micromatch
      );

      expect(descriptor).toBeInstanceOf(ElementsDescriptor);
    });

    it("should create an instance with cache disabled", () => {
      const config = createConfig({ cache: false });
      const micromatch = createMicromatchMock();
      const descriptors: ElementDescriptors = [createDescriptor()];

      const descriptor = new ElementsDescriptor(
        descriptors,
        config,
        micromatch
      );

      expect(descriptor).toBeInstanceOf(ElementsDescriptor);
    });

    it("should throw when a descriptor has no pattern", () => {
      const config = createConfig();
      const micromatch = createMicromatchMock();
      const descriptors = [
        { type: "component" },
      ] as unknown as ElementDescriptors;

      expect(
        () => new ElementsDescriptor(descriptors, config, micromatch)
      ).toThrow(
        "Element descriptor at index 0 must have a pattern, and either a 'type' or 'category' defined."
      );
    });

    it("should throw when a descriptor has no type or category", () => {
      const config = createConfig();
      const micromatch = createMicromatchMock();
      const descriptors = [
        { pattern: "src/*" },
      ] as unknown as ElementDescriptors;

      expect(
        () => new ElementsDescriptor(descriptors, config, micromatch)
      ).toThrow(
        "Element descriptor at index 0 must have a pattern, and either a 'type' or 'category' defined."
      );
    });

    it("should throw with the correct index for invalid descriptors", () => {
      const config = createConfig();
      const micromatch = createMicromatchMock();
      const descriptors = [
        createDescriptor(),
        { pattern: "helpers/*" },
      ] as unknown as ElementDescriptors;

      expect(
        () => new ElementsDescriptor(descriptors, config, micromatch)
      ).toThrow("Element descriptor at index 1");
    });

    it("should accept a descriptor with category instead of type", () => {
      const config = createConfig();
      const micromatch = createMicromatchMock();
      const descriptors: ElementDescriptors = [
        createDescriptor({ type: undefined, category: "ui" }),
      ];

      expect(
        () => new ElementsDescriptor(descriptors, config, micromatch)
      ).not.toThrow();
    });
  });

  describe("describeElement", () => {
    describe("unknown elements", () => {
      it("should return unknown element when filePath is undefined", () => {
        const config = createConfig();
        const micromatch = createMicromatchMock();
        const descriptors: ElementDescriptors = [createDescriptor()];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const result = descriptor.describeElement(undefined);

        expect(result).toEqual({
          path: null,
          fileInternalPath: null,
          filePath: null,
          parents: [],
          types: null,
          category: null,
          captured: null,
          isIgnored: false,
          isUnknown: true,
        });
      });

      it("should return unknown element when no descriptor matches", () => {
        const config = createConfig();
        const micromatch = createMicromatchMock({
          capture: jest.fn().mockReturnValue(null),
        });
        const descriptors: ElementDescriptors = [createDescriptor()];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const result = descriptor.describeElement("unknown/path/file.ts");

        expect(result.isUnknown).toBe(true);
        expect(result.path).toBeNull();
        expect(result.types).toBeNull();
      });
    });

    describe("ignored elements", () => {
      it("should return ignored element when path is not included by includePaths", () => {
        const config = createConfig({
          includePaths: ["src/**"],
        });
        const micromatch = createMicromatchMock({
          isMatch: jest.fn().mockReturnValue(false),
        });
        const descriptors: ElementDescriptors = [createDescriptor()];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const result = descriptor.describeElement("test/file.ts");

        expect(result.isIgnored).toBe(true);
        expect(result.isUnknown).toBe(true);
        expect(result.filePath).toBe("test/file.ts");
        expect(result.path).toBe("test/file.ts");
      });

      it("should return ignored element when path matches ignorePaths", () => {
        const config = createConfig({
          ignorePaths: ["test/**"],
        });
        const micromatch = createMicromatchMock({
          isMatch: jest.fn().mockReturnValue(true),
        });
        const descriptors: ElementDescriptors = [createDescriptor()];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const result = descriptor.describeElement("test/file.ts");

        expect(result.isIgnored).toBe(true);
      });

      it("should return ignored when path matches both includePaths and ignorePaths", () => {
        const config = createConfig({
          includePaths: ["src/**"],
          ignorePaths: ["src/test/**"],
        });
        const micromatch = createMicromatchMock({
          isMatch: jest.fn().mockReturnValue(true),
        });
        const descriptors: ElementDescriptors = [createDescriptor()];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const result = descriptor.describeElement("src/test/file.ts");

        expect(result.isIgnored).toBe(true);
      });
    });

    describe("known elements with folder mode", () => {
      it("should describe a matching element with type", () => {
        const micromatch = createMicromatchMock({
          capture: createCaptureLookup({
            "components/*/**/*::components/Button/index.ts": ["Button"],
          }),
          makeRe: jest.fn().mockReturnValue(/^components\/[^/]+$/),
        });
        const config = createConfig();
        const descriptors: ElementDescriptors = [
          createDescriptor({
            pattern: "components/*",
            type: "component",
            capture: ["componentName"],
          }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const result = descriptor.describeElement("components/Button/index.ts");

        expect(result.isUnknown).toBe(false);
        expect(result.types).toEqual(["component"]);
        expect(result.captured).toEqual({ componentName: "Button" });
      });

      it("should describe a matching element with category", () => {
        const micromatch = createMicromatchMock({
          capture: createCaptureLookup({
            "helpers/*/**/*::helpers/utils/format.ts": ["utils"],
          }),
          makeRe: jest.fn().mockReturnValue(/^helpers\/[^/]+$/),
        });
        const config = createConfig();
        const descriptors: ElementDescriptors = [
          createDescriptor({
            pattern: "helpers/*",
            type: undefined,
            category: "helper",
          }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const result = descriptor.describeElement("helpers/utils/format.ts");

        expect(result.isUnknown).toBe(false);
        expect(result.category).toBe("helper");
      });
    });

    describe("known elements with file mode", () => {
      it("should describe a matching element with file mode", () => {
        const micromatch = createMicromatchMock({
          capture: createCaptureLookup({
            "services/*.service.ts::services/auth.service.ts": ["auth"],
          }),
          makeRe: jest.fn().mockReturnValue(/^services\/[^/]+\.service\.ts$/),
        });
        const config = createConfig();
        const descriptors: ElementDescriptors = [
          createDescriptor({
            pattern: "services/*.service.ts",
            type: "service",
            mode: "file",
            capture: ["serviceName"],
          }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const result = descriptor.describeElement("services/auth.service.ts");

        expect(result.isUnknown).toBe(false);
        expect(result.types).toEqual(["service"]);
        expect(result.captured).toEqual({ serviceName: "auth" });
      });
    });

    describe("known elements with full mode", () => {
      it("should describe a matching element with full mode using the full file path", () => {
        const micromatch = createMicromatchMock({
          capture: createCaptureLookup({
            "src/modules/*/index.ts::src/modules/auth/index.ts": ["auth"],
          }),
        });
        const config = createConfig();
        const descriptors: ElementDescriptors = [
          createDescriptor({
            pattern: "src/modules/*/index.ts",
            type: "module",
            mode: "full",
            capture: ["moduleName"],
          }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const result = descriptor.describeElement("src/modules/auth/index.ts");

        expect(result.isUnknown).toBe(false);
        expect(result.types).toEqual(["module"]);
        expect(result.captured).toEqual({ moduleName: "auth" });
        expect(result.path).toBe("src/modules/auth/index.ts");
      });
    });

    describe("elements with array patterns", () => {
      it("should match using the first matching pattern in an array", () => {
        const micromatch = createMicromatchMock({
          capture: createCaptureLookup({
            "components/*/**/*::components/Foo/index.ts": ["Foo"],
          }),
          makeRe: jest.fn().mockReturnValue(/^(?:components|widgets)\/[^/]+$/),
        });
        const config = createConfig();
        const descriptors: ElementDescriptors = [
          createDescriptor({
            pattern: ["components/*", "widgets/*"],
            type: "component",
          }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const result = descriptor.describeElement("components/Foo/index.ts");

        expect(result.isUnknown).toBe(false);
        expect(result.types).toEqual(["component"]);
      });
    });

    describe("elements with basePattern", () => {
      it("should merge captured values from basePattern and pattern", () => {
        const micromatch = createMicromatchMock({
          capture: createCaptureLookup({
            "modules/*/**/*::modules/auth/index.ts": ["auth"],
            "src/*/**/modules/*/**/*::src/main/modules/auth/index.ts": ["main"],
          }),
          makeRe: jest.fn().mockReturnValue(/^modules\/[^/]+$/),
        });
        const config = createConfig();
        const descriptors: ElementDescriptors = [
          createDescriptor({
            pattern: "modules/*",
            type: "module",
            capture: ["moduleName"],
            basePattern: "src/*",
            baseCapture: ["area"],
          }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const result = descriptor.describeElement(
          "src/main/modules/auth/index.ts"
        );

        expect(result.isUnknown).toBe(false);
        expect(result.captured).toHaveProperty("moduleName");
      });
    });

    describe("multi-type matching", () => {
      it("should accumulate multiple types when singleType is false", () => {
        const micromatch = createMicromatchMock({
          capture: createCaptureLookup({
            "shared/*/**/*::shared/Button/index.ts": ["Button"],
          }),
          makeRe: jest.fn().mockReturnValue(/^shared\/[^/]+$/),
        });
        const config = createConfig();
        const descriptors: ElementDescriptors = [
          createDescriptor({
            pattern: "shared/*",
            type: "component",
          }),
          createDescriptor({
            pattern: "shared/*",
            type: "shared",
          }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch,
          false
        );

        const result = descriptor.describeElement("shared/Button/index.ts");

        expect(result.isUnknown).toBe(false);
        expect(result.types).toContain("component");
      });

      it("should keep only first matching type when singleType is true", () => {
        const micromatch = createMicromatchMock({
          capture: createCaptureLookup({
            "shared/*/**/*::shared/Button/index.ts": ["Button"],
          }),
          makeRe: jest.fn().mockReturnValue(/^shared\/[^/]+$/),
        });
        const config = createConfig();
        const descriptors: ElementDescriptors = [
          createDescriptor({
            pattern: "shared/*",
            type: "component",
          }),
          createDescriptor({
            pattern: "shared/*",
            type: "shared",
          }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch,
          true
        );

        const result = descriptor.describeElement("shared/Button/index.ts");

        expect(result.isUnknown).toBe(false);
        expect(result.types).toEqual(["component"]);
      });

      it("should not accumulate types at main level when main matched with category only", () => {
        const micromatch = createMicromatchMock({
          capture: createCaptureLookup({
            "shared/*/**/*::shared/Button/index.ts": ["Button"],
          }),
          makeRe: jest.fn().mockReturnValue(/^shared\/[^/]+$/),
        });
        const config = createConfig();
        const descriptors: ElementDescriptors = [
          createDescriptor({
            pattern: "shared/*",
            type: undefined,
            category: "ui",
          }),
          createDescriptor({
            pattern: "shared/*",
            type: "component",
          }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const result = descriptor.describeElement("shared/Button/index.ts");

        expect(result.isUnknown).toBe(false);
        expect(result.category).toBe("ui");
        expect(result.types).toBeNull();
      });
    });

    describe("parent elements", () => {
      it("should detect parent elements at higher path levels", () => {
        const micromatch = createMicromatchMock({
          capture: createCaptureLookup({
            "components/*/**/*::components/Button/index.ts": [
              "Button",
              "",
              "index.ts",
            ],
            "modules/*::modules/ui": ["ui"],
          }),
          makeRe: createMakeReLookup({
            "components/*": /^components\/[^/]+$/,
            "modules/*": /^modules\/[^/]+$/,
          }),
        });
        const config = createConfig();
        const descriptors: ElementDescriptors = [
          createDescriptor({
            pattern: "components/*",
            type: "component",
            capture: ["componentName"],
          }),
          createDescriptor({
            pattern: "modules/*",
            type: "module",
            capture: ["moduleName"],
          }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const result = descriptor.describeElement(
          "modules/ui/components/Button/index.ts"
        );

        expect(result.isUnknown).toBe(false);
        expect(result.parents.length).toBeGreaterThanOrEqual(0);
      });

      it("should accumulate multiple types on the same parent path when multiple descriptors match", () => {
        const micromatch = createMicromatchMock({
          capture: createCaptureLookup({
            "components/*/**/*::components/Button/index.ts": [
              "Button",
              "",
              "index.ts",
            ],
            "modules/*::modules/ui": ["ui"],
          }),
          makeRe: createMakeReLookup({
            "components/*": /^components\/[^/]+$/,
            "modules/*": /^modules\/[^/]+$/,
          }),
        });
        const config = createConfig();
        const descriptors: ElementDescriptors = [
          createDescriptor({
            pattern: "components/*",
            type: "component",
          }),
          createDescriptor({
            pattern: "modules/*",
            type: "module",
          }),
          createDescriptor({
            pattern: "modules/*",
            type: "feature",
          }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const result = descriptor.describeElement(
          "modules/ui/components/Button/index.ts"
        );

        expect(result.isUnknown).toBe(false);
        expect(result.parents).toHaveLength(1);
        expect(result.parents[0].path).toBe("modules/ui");
        expect(result.parents[0].types).toEqual(["module", "feature"]);
      });

      it("should not accumulate types on a category-only parent", () => {
        const micromatch = createMicromatchMock({
          capture: createCaptureLookup({
            "components/*/**/*::components/Button/index.ts": [
              "Button",
              "",
              "index.ts",
            ],
            "modules/*::modules/ui": ["ui"],
          }),
          makeRe: createMakeReLookup({
            "components/*": /^components\/[^/]+$/,
            "modules/*": /^modules\/[^/]+$/,
          }),
        });
        const config = createConfig();
        const descriptors: ElementDescriptors = [
          createDescriptor({
            pattern: "components/*",
            type: "component",
          }),
          createDescriptor({
            pattern: "modules/*",
            type: undefined,
            category: "area",
          }),
          createDescriptor({
            pattern: "modules/*",
            type: "feature",
          }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const result = descriptor.describeElement(
          "modules/ui/components/Button/index.ts"
        );

        expect(result.isUnknown).toBe(false);
        expect(result.parents).toHaveLength(1);
        expect(result.parents[0].path).toBe("modules/ui");
        expect(result.parents[0].category).toBe("area");
        expect(result.parents[0].types).toBeNull();
      });
    });

    describe("rootPath handling", () => {
      it("should convert absolute paths to relative when rootPath is configured", () => {
        const micromatch = createMicromatchMock({
          capture: createCaptureLookup({
            "components/*/**/*::components/Button/index.ts": ["Button"],
          }),
          makeRe: jest.fn().mockReturnValue(/^components\/[^/]+$/),
        });
        const config = createConfig({ rootPath: "/root/project/" });
        const descriptors: ElementDescriptors = [
          createDescriptor({
            pattern: "components/*",
            type: "component",
          }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const result = descriptor.describeElement(
          "/root/project/components/Button/index.ts"
        );

        expect(result.isUnknown).toBe(false);
        expect(result.types).toEqual(["component"]);
      });

      it("should not strip rootPath from paths outside rootPath", () => {
        const micromatch = createMicromatchMock();
        const config = createConfig({ rootPath: "/root/project/" });
        const descriptors: ElementDescriptors = [createDescriptor()];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const result = descriptor.describeElement("/other/path/file.ts");

        expect(result.isUnknown).toBe(true);
      });
    });

    describe("path inclusion logic", () => {
      it("should include all paths when no includePaths or ignorePaths are configured", () => {
        const micromatch = createMicromatchMock({
          capture: createCaptureLookup({
            "components/*/**/*::components/Foo/index.ts": ["Foo"],
          }),
          makeRe: jest.fn().mockReturnValue(/^components\/[^/]+$/),
        });
        const config = createConfig({
          includePaths: undefined,
          ignorePaths: undefined,
        });
        const descriptors: ElementDescriptors = [
          createDescriptor({
            pattern: "components/*",
            type: "component",
          }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const result = descriptor.describeElement("components/Foo/index.ts");

        expect(result.isIgnored).toBe(false);
      });

      it("should include path when it matches includePaths and does not match ignorePaths", () => {
        const micromatch = createMicromatchMock({
          isMatch: createIsMatchLookup({
            "src/**": true,
            "test/**": false,
          }),
          capture: jest.fn().mockReturnValue(null),
        });
        const config = createConfig({
          includePaths: "src/**",
          ignorePaths: "test/**",
        });
        const descriptors: ElementDescriptors = [createDescriptor()];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const result = descriptor.describeElement("src/file.ts");

        expect(result.isIgnored).toBe(false);
      });
    });

    describe("caching", () => {
      it("should return the cached result on the second call with the same path", () => {
        const micromatch = createMicromatchMock();
        const config = createConfig();
        const descriptors: ElementDescriptors = [createDescriptor()];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const first = descriptor.describeElement("some/path/file.ts");
        const second = descriptor.describeElement("some/path/file.ts");

        expect(first).toBe(second);
      });

      it("should return different results for different paths", () => {
        const micromatch = createMicromatchMock();
        const config = createConfig({
          includePaths: ["src/**"],
        });
        const descriptors: ElementDescriptors = [createDescriptor()];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const first = descriptor.describeElement("path/a.ts");
        const second = descriptor.describeElement("path/b.ts");

        expect(first).not.toBe(second);
      });

      it("should cache undefined filePath", () => {
        const micromatch = createMicromatchMock();
        const config = createConfig();
        const descriptors: ElementDescriptors = [createDescriptor()];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const first = descriptor.describeElement(undefined);
        const second = descriptor.describeElement(undefined);

        expect(first).toBe(second);
      });
    });

    describe("folder-level caching", () => {
      it("should reuse the folder-stable base for sibling files, recomputing only fileInternalPath", () => {
        const micromatch = createMicromatchMock({
          capture: createCaptureLookup({
            "components/*/**/*::components/Button/index.ts": ["Button"],
          }),
          makeRe: jest.fn().mockReturnValue(/^components\/[^/]+$/),
        });
        const config = createConfig();
        const descriptors: ElementDescriptors = [
          createDescriptor({
            pattern: "components/*",
            type: "component",
            capture: ["componentName"],
          }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        // Populate the folder base from the first file.
        descriptor.describeElement("components/Button/index.ts");
        // The sibling has no capture lookup entry; a correct result proves the
        // folder base was reused instead of running the matching loop again.
        const second = descriptor.describeElement(
          "components/Button/styles.css"
        );

        expect(second.path).toBe("components/Button");
        expect(second.types).toEqual(["component"]);
        expect(second.captured).toEqual({ componentName: "Button" });
        expect(second.fileInternalPath).toBe("styles.css");
        expect(second.filePath).toBe("components/Button/styles.css");
      });

      it("should not run the matching loop for sibling files, and recompute it after clearCache", () => {
        const captureMock = createCaptureLookup({
          "components/*/**/*::components/Button/index.ts": ["Button"],
        });
        const micromatch = createMicromatchMock({
          capture: captureMock,
          makeRe: jest.fn().mockReturnValue(/^components\/[^/]+$/),
        });
        const config = createConfig();
        const descriptors: ElementDescriptors = [
          createDescriptor({ pattern: "components/*", type: "component" }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        descriptor.describeElement("components/Button/index.ts");
        const callsAfterFirst = captureMock.mock.calls.length;

        expect(callsAfterFirst).toBeGreaterThan(0);

        descriptor.describeElement("components/Button/styles.ts");

        expect(captureMock).toHaveBeenCalledTimes(callsAfterFirst);

        descriptor.clearCache();
        descriptor.describeElement("components/Button/index.ts");

        expect(captureMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
      });

      it("should evaluate isIgnored per file over a shared folder base", () => {
        const micromatch = createMicromatchMock({
          capture: createCaptureLookup({
            "components/*/**/*::components/Button/index.ts": ["Button"],
          }),
          makeRe: jest.fn().mockReturnValue(/^components\/[^/]+$/),
          isMatch: jest.fn((path: string) => path.endsWith(".test.ts")),
        });
        const config = createConfig({ ignorePaths: ["**/*.test.ts"] });
        const descriptors: ElementDescriptors = [
          createDescriptor({ pattern: "components/*", type: "component" }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const known = descriptor.describeElement("components/Button/index.ts");
        const ignored = descriptor.describeElement(
          "components/Button/Button.test.ts"
        );

        expect(known.isIgnored).toBe(false);
        expect(known.types).toEqual(["component"]);

        expect(ignored.isIgnored).toBe(true);
        expect(ignored.isUnknown).toBe(true);
        expect(ignored.path).toBe("components/Button/Button.test.ts");
      });

      it("should mark all sibling files as unknown when the folder matches no descriptor", () => {
        const micromatch = createMicromatchMock();
        const config = createConfig();
        const descriptors: ElementDescriptors = [
          createDescriptor({ pattern: "components/*", type: "component" }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const first = descriptor.describeElement("unknown/folder/a.ts");
        const second = descriptor.describeElement("unknown/folder/b.ts");

        expect(first.isUnknown).toBe(true);
        expect(first.path).toBeNull();
        expect(second.isUnknown).toBe(true);
        expect(second.path).toBeNull();
      });

      it("should handle files at the project root (no folder segment)", () => {
        const micromatch = createMicromatchMock();
        const config = createConfig();
        const descriptors: ElementDescriptors = [
          createDescriptor({ pattern: "components/*", type: "component" }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const first = descriptor.describeElement("a.ts");
        const second = descriptor.describeElement("b.ts");

        expect(first.isUnknown).toBe(true);
        expect(second.isUnknown).toBe(true);
      });
    });

    describe("folder caching disabled for file and full modes", () => {
      it("should match sibling files independently when a descriptor uses file mode", () => {
        const micromatch = createMicromatchMock({
          capture: createCaptureLookup({
            "services/*.service.ts::services/auth.service.ts": ["auth"],
          }),
          makeRe: jest.fn().mockReturnValue(/^services\/[^/]+\.service\.ts$/),
        });
        const config = createConfig();
        const descriptors: ElementDescriptors = [
          createDescriptor({
            pattern: "services/*.service.ts",
            type: "service",
            mode: "file",
            capture: ["serviceName"],
          }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const matched = descriptor.describeElement("services/auth.service.ts");
        // No lookup entry for the sibling: because folder caching is disabled it is
        // matched independently and stays unknown.
        const sibling = descriptor.describeElement("services/auth.helper.ts");

        expect(matched.isUnknown).toBe(false);
        expect(matched.types).toEqual(["service"]);
        expect(sibling.isUnknown).toBe(true);
      });

      it("should keep running the matching loop for every file when a full-mode descriptor is present", () => {
        const captureMock = createCaptureLookup({
          "components/*/**/*::components/Button/index.ts": ["Button"],
          "components/*/**/*::components/Button/styles.ts": ["Button"],
        });
        const micromatch = createMicromatchMock({
          capture: captureMock,
          makeRe: jest.fn().mockReturnValue(/^components\/[^/]+$/),
        });
        const config = createConfig();
        const descriptors: ElementDescriptors = [
          createDescriptor({ pattern: "components/*", type: "component" }),
          createDescriptor({
            pattern: "src/modules/*/index.ts",
            type: "module",
            mode: "full",
          }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const first = descriptor.describeElement("components/Button/index.ts");
        const callsAfterFirst = captureMock.mock.calls.length;
        const second = descriptor.describeElement(
          "components/Button/styles.ts"
        );

        expect(first.types).toEqual(["component"]);
        expect(first.fileInternalPath).toBe("index.ts");
        expect(second.types).toEqual(["component"]);
        expect(second.fileInternalPath).toBe("styles.ts");
        // Folder caching is disabled, so the sibling triggers the matching loop again.
        expect(captureMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
      });
    });

    describe("cache key normalization", () => {
      it("should share a cache entry for absolute and relative forms of the same path", () => {
        const micromatch = createMicromatchMock({
          capture: createCaptureLookup({
            "components/*/**/*::components/Button/index.ts": ["Button"],
          }),
          makeRe: jest.fn().mockReturnValue(/^components\/[^/]+$/),
        });
        const config = createConfig({ rootPath: "/root/project/" });
        const descriptors: ElementDescriptors = [
          createDescriptor({ pattern: "components/*", type: "component" }),
        ];
        const descriptor = new ElementsDescriptor(
          descriptors,
          config,
          micromatch
        );

        const fromAbsolute = descriptor.describeElement(
          "/root/project/components/Button/index.ts"
        );
        const fromRelative = descriptor.describeElement(
          "components/Button/index.ts"
        );

        expect(fromAbsolute).toBe(fromRelative);
      });
    });
  });

  describe("serializeCache", () => {
    it("should return a serialized cache with the described element", () => {
      const micromatch = createMicromatchMock();
      const config = createConfig();
      const descriptors: ElementDescriptors = [createDescriptor()];
      const descriptor = new ElementsDescriptor(
        descriptors,
        config,
        micromatch
      );

      descriptor.describeElement("some/path.ts");

      const serialized = descriptor.serializeCache();

      expect(serialized).toHaveProperty(["some/path.ts"]);
    });

    it("should return an empty object when no elements have been described", () => {
      const micromatch = createMicromatchMock();
      const config = createConfig();
      const descriptors: ElementDescriptors = [createDescriptor()];
      const descriptor = new ElementsDescriptor(
        descriptors,
        config,
        micromatch
      );

      const serialized = descriptor.serializeCache();

      expect(serialized).toEqual({});
    });
  });

  describe("setCacheFromSerialized", () => {
    it("should restore cache from serialized data", () => {
      const micromatch = createMicromatchMock();
      const config = createConfig();
      const descriptors: ElementDescriptors = [createDescriptor()];
      const descriptor = new ElementsDescriptor(
        descriptors,
        config,
        micromatch
      );

      const cacheEntry = {
        path: "components/Button",
        fileInternalPath: "index.ts",
        filePath: "components/Button/index.ts",
        parents: [],
        types: ["component"],
        category: null,
        captured: { componentName: "Button" },
        isIgnored: false,
        isUnknown: false,
      };
      descriptor.setCacheFromSerialized({
        "components/Button/index.ts": cacheEntry,
      });

      const result = descriptor.describeElement("components/Button/index.ts");

      expect(result).toEqual(cacheEntry);
    });
  });

  describe("clearCache", () => {
    it("should clear all cached descriptions", () => {
      const micromatch = createMicromatchMock();
      const config = createConfig();
      const descriptors: ElementDescriptors = [createDescriptor()];
      const descriptor = new ElementsDescriptor(
        descriptors,
        config,
        micromatch
      );

      descriptor.describeElement("some/path.ts");
      descriptor.clearCache();

      const serialized = descriptor.serializeCache();

      expect(serialized).toEqual({});
    });
  });

  describe("path normalization", () => {
    it("should normalize backslashes in file paths", () => {
      const micromatch = createMicromatchMock({
        capture: createCaptureLookup({
          "components/*/**/*::components/Button/index.ts": ["Button"],
        }),
        makeRe: jest.fn().mockReturnValue(/^components\/[^/]+$/),
      });
      const config = createConfig();
      const descriptors: ElementDescriptors = [
        createDescriptor({
          pattern: "components/*",
          type: "component",
        }),
      ];
      const descriptor = new ElementsDescriptor(
        descriptors,
        config,
        micromatch
      );

      const result = descriptor.describeElement("components\\Button\\index.ts");

      expect(result.isUnknown).toBe(false);
      expect(result.types).toEqual(["component"]);
    });
  });
});
