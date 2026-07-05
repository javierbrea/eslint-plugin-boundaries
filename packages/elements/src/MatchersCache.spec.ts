import type { ConfigOptionsNormalized } from "./Config";
import type { ElementDescriptors, FileDescriptors } from "./Descriptor";
import { MatchersCache } from "./MatchersCache";

function createConfig(
  overrides?: Partial<ConfigOptionsNormalized>
): ConfigOptionsNormalized {
  return {
    legacyTemplates: true,
    includePaths: ["src/**"],
    ignorePaths: ["dist/**"],
    cache: true,
    rootPath: "/root",
    flagAsExternal: {
      inNodeModules: true,
      unresolvableAlias: false,
      outsideRootPath: true,
      customSourcePatterns: ["@external/*"],
    },
    ...overrides,
  } as unknown as ConfigOptionsNormalized;
}

describe("MatchersCache", () => {
  let matchersCache: MatchersCache;

  beforeEach(() => {
    matchersCache = new MatchersCache();
  });

  describe("config hash", () => {
    it("should include all config properties in the key", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: {},
      });

      expect(key).toBe(
        "|:config:|true|src/**|dist/**|true|/root|true|false|true|@external/*|:elements:||:elementsSingleType:|false|:files:|"
      );
    });
  });

  describe("element descriptors", () => {
    it("should generate key with element descriptors including capture and baseCapture", () => {
      const config = createConfig();
      const elements = [
        {
          type: "component",
          category: "ui",
          pattern: "src/components/*.tsx",
          basePattern: "src",
          mode: "file",
          capture: ["name"],
          baseCapture: ["baseName"],
        },
      ] as unknown as ElementDescriptors;

      const key = matchersCache.getKey({
        config,
        descriptors: { elements },
      });

      expect(key).toBe(
        "|:config:|true|src/**|dist/**|true|/root|true|false|true|@external/*|:elements:|src/components/*.tsx|name|component|ui|file|src|baseName|undefined|:elementsSingleType:|false|:files:|"
      );
    });

    it("should produce empty elements section when elements is undefined", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: { elements: undefined },
      });

      expect(key).toContain("|:elements:||:elementsSingleType:|");
    });

    it("should produce empty elements section when elements is an empty array", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: { elements: [] },
      });

      expect(key).toContain("|:elements:||:elementsSingleType:|");
    });

    it("should use 'no-capture' when element capture is undefined", () => {
      const config = createConfig();
      const elements = [
        {
          type: "service",
          category: "core",
          pattern: "src/services/*.ts",
          basePattern: "src",
          mode: "folder",
          baseCapture: ["base"],
        },
      ] as unknown as ElementDescriptors;

      const key = matchersCache.getKey({
        config,
        descriptors: { elements },
      });

      expect(key).toContain(
        "src/services/*.ts|no-capture|service|core|folder|src|base|undefined"
      );
    });

    it("should use 'no-base-capture' when element baseCapture is undefined", () => {
      const config = createConfig();
      const elements = [
        {
          type: "util",
          category: "shared",
          pattern: "src/utils/*.ts",
          basePattern: "src",
          mode: "file",
          capture: ["name"],
        },
      ] as unknown as ElementDescriptors;

      const key = matchersCache.getKey({
        config,
        descriptors: { elements },
      });

      expect(key).toContain(
        "src/utils/*.ts|name|util|shared|file|src|no-base-capture|undefined"
      );
    });

    it("should join multiple capture values with comma", () => {
      const config = createConfig();
      const elements = [
        {
          type: "module",
          category: "feature",
          pattern: "src/modules/*/*.ts",
          basePattern: "src",
          mode: "folder",
          capture: ["module", "file"],
          baseCapture: ["root", "sub"],
        },
      ] as unknown as ElementDescriptors;

      const key = matchersCache.getKey({
        config,
        descriptors: { elements },
      });

      expect(key).toContain(
        "src/modules/*/*.ts|module,file|module|feature|folder|src|root,sub|undefined"
      );
    });

    it("should include partialMatch: false in the hash", () => {
      const config = createConfig();
      const elements = [
        {
          type: "component",
          category: "ui",
          pattern: "src/components/*.tsx",
          partialMatch: false,
        },
      ] as unknown as ElementDescriptors;

      const key = matchersCache.getKey({
        config,
        descriptors: { elements },
      });

      expect(key).toContain(
        "src/components/*.tsx|no-capture|component|ui|undefined|undefined|no-base-capture|false"
      );
    });

    it("should produce a distinct key when partialMatch differs", () => {
      const config = createConfig();
      const makeElements = (partialMatch: boolean) =>
        [
          {
            type: "component",
            pattern: "src/components/*",
            partialMatch,
          },
        ] as unknown as ElementDescriptors;

      const key1 = matchersCache.getKey({
        config,
        descriptors: { elements: makeElements(false) },
      });
      const key2 = matchersCache.getKey({
        config,
        descriptors: { elements: makeElements(true) },
      });

      expect(key1).not.toBe(key2);
    });

    it("should join multiple element descriptors with comma", () => {
      const config = createConfig();
      const elements = [
        {
          type: "component",
          category: "ui",
          pattern: "src/components/*.tsx",
          basePattern: "src",
          mode: "file",
          capture: ["name"],
          baseCapture: ["base"],
        },
        {
          type: "service",
          category: "core",
          pattern: "src/services/*.ts",
          basePattern: "lib",
          mode: "folder",
          capture: ["svc"],
          baseCapture: ["root"],
        },
      ] as unknown as ElementDescriptors;

      const key = matchersCache.getKey({
        config,
        descriptors: { elements },
      });

      expect(key).toContain(
        "|:elements:|src/components/*.tsx|name|component|ui|file|src|base|undefined,src/services/*.ts|svc|service|core|folder|lib|root|undefined|:elementsSingleType:|"
      );
    });
  });

  describe("file descriptors", () => {
    it("should generate key with file descriptors", () => {
      const config = createConfig();
      const files = [
        {
          category: "test",
          pattern: "src/**/*.spec.ts",
          capture: ["name"],
        },
      ] as unknown as FileDescriptors;

      const key = matchersCache.getKey({
        config,
        descriptors: { files },
      });

      expect(key).toContain("|:files:|src/**/*.spec.ts|name|test");
    });

    it("should produce empty files section when files is undefined", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: { files: undefined },
      });

      expect(key.endsWith("|:files:|")).toBe(true);
    });

    it("should produce empty files section when files is an empty array", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: { files: [] },
      });

      expect(key.endsWith("|:files:|")).toBe(true);
    });

    it("should use 'no-capture' when file descriptor capture is undefined", () => {
      const config = createConfig();
      const files = [
        {
          category: "config",
          pattern: "*.config.ts",
        },
      ] as unknown as FileDescriptors;

      const key = matchersCache.getKey({
        config,
        descriptors: { files },
      });

      expect(key).toContain("|:files:|*.config.ts|no-capture|config");
    });

    it("should join multiple file descriptors with comma", () => {
      const config = createConfig();
      const files = [
        {
          category: "test",
          pattern: "src/**/*.spec.ts",
          capture: ["name"],
        },
        {
          category: "config",
          pattern: "*.config.ts",
        },
      ] as unknown as FileDescriptors;

      const key = matchersCache.getKey({
        config,
        descriptors: { files },
      });

      expect(key).toContain(
        "|:files:|src/**/*.spec.ts|name|test,*.config.ts|no-capture|config"
      );
    });
  });

  describe("elementsSingleType", () => {
    it("should include 'true' when elementsSingleType is true", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: { elementsSingleType: true },
      });

      expect(key).toContain("|:elementsSingleType:|true|");
    });

    it("should include 'false' when elementsSingleType is undefined", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: {},
      });

      expect(key).toContain("|:elementsSingleType:|false|");
    });

    it("should include 'false' when elementsSingleType is false", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: { elementsSingleType: false },
      });

      expect(key).toContain("|:elementsSingleType:|false|");
    });
  });

  describe("determinism", () => {
    it("should return the same key for the same input", () => {
      const config = createConfig();
      const elements = [
        {
          type: "component",
          category: "ui",
          pattern: "src/components/*.tsx",
          basePattern: "src",
          mode: "file",
          capture: ["name"],
          baseCapture: ["base"],
        },
      ] as unknown as ElementDescriptors;
      const files = [
        {
          category: "test",
          pattern: "src/**/*.spec.ts",
          capture: ["name"],
        },
      ] as unknown as FileDescriptors;

      const params = {
        config,
        descriptors: { elements, files, elementsSingleType: true as const },
      };

      const key1 = matchersCache.getKey(params);
      const key2 = matchersCache.getKey(params);

      expect(key1).toBe(key2);
    });
  });
});
