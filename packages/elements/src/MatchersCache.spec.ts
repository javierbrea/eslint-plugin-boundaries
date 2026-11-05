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
        '|:config:|true|["src/**"]|["dist/**"]|true|/root|true|false|true|["@external/*"]|:elements:||:elementsSingleMatch:|false|:files:||:filesSingleMatch:|false'
      );
    });

    it.each(["includePaths", "ignorePaths"])(
      "should give different keys to %s given as a string and as a list whose patterns join into that string",
      (option) => {
        // Arrange
        const stringConfig = createConfig({ [option]: "src/**,lib/**" });
        const listConfig = createConfig({ [option]: ["src/**", "lib/**"] });

        // Act
        const stringKey = matchersCache.getKey({
          config: stringConfig,
          descriptors: {},
        });
        const listKey = matchersCache.getKey({
          config: listConfig,
          descriptors: {},
        });

        // Assert
        expect(stringKey).not.toBe(listKey);
      }
    );

    it("should give different keys to customSourcePatterns whose patterns join into the same text", () => {
      // Arrange
      const createFlagAsExternal = (customSourcePatterns: string[]) => ({
        inNodeModules: true,
        unresolvableAlias: false,
        outsideRootPath: true,
        customSourcePatterns,
      });
      const joinedConfig = createConfig({
        flagAsExternal: createFlagAsExternal(["@a/*,@b/*"]),
      });
      const listConfig = createConfig({
        flagAsExternal: createFlagAsExternal(["@a/*", "@b/*"]),
      });

      // Act
      const joinedKey = matchersCache.getKey({
        config: joinedConfig,
        descriptors: {},
      });
      const listKey = matchersCache.getKey({
        config: listConfig,
        descriptors: {},
      });

      // Assert
      expect(joinedKey).not.toBe(listKey);
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
        '|:config:|true|["src/**"]|["dist/**"]|true|/root|true|false|true|["@external/*"]|:elements:|"src/components/*.tsx"|["name"]|component|ui|file|src|["baseName"]|undefined|undefined|undefined|:elementsSingleMatch:|false|:files:||:filesSingleMatch:|false'
      );
    });

    it("should produce empty elements section when elements is undefined", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: { elements: undefined },
      });

      expect(key).toContain("|:elements:||:elementsSingleMatch:|");
    });

    it("should produce empty elements section when elements is an empty array", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: { elements: [] },
      });

      expect(key).toContain("|:elements:||:elementsSingleMatch:|");
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
        '"src/services/*.ts"|no-capture|service|core|folder|src|["base"]|undefined|undefined|undefined'
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
        '"src/utils/*.ts"|["name"]|util|shared|file|src|no-base-capture|undefined|undefined|undefined'
      );
    });

    it("should use 'no-capture' and 'no-base-capture' when element capture and baseCapture are null", () => {
      // Arrange
      const config = createConfig();
      const elements = [
        {
          type: "util",
          pattern: "src/utils/*",
          basePattern: "src",
          capture: null,
          baseCapture: null,
        },
      ] as unknown as ElementDescriptors;

      // Act
      const key = matchersCache.getKey({
        config,
        descriptors: { elements },
      });

      // Assert
      expect(key).toContain(
        '"src/utils/*"|no-capture|util|undefined|undefined|src|no-base-capture|'
      );
    });

    it("should use 'invalid-capture' and 'invalid-base-capture' when element capture and baseCapture are set and are not arrays", () => {
      // Arrange
      const config = createConfig();
      const elements = [
        {
          type: "util",
          pattern: "src/utils/*",
          basePattern: "src",
          capture: "name",
          baseCapture: 5,
        },
      ] as unknown as ElementDescriptors;

      // Act
      const key = matchersCache.getKey({
        config,
        descriptors: { elements },
      });

      // Assert
      expect(key).toContain(
        '"src/utils/*"|invalid-capture|util|undefined|undefined|src|invalid-base-capture|'
      );
    });

    it("should hash capture lists as their JSON text", () => {
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
        '"src/modules/*/*.ts"|["module","file"]|module|feature|folder|src|["root","sub"]|undefined|undefined|undefined'
      );
    });

    it.each(["capture", "baseCapture"])(
      "should give different keys to %s lists whose names join into the same text",
      (property) => {
        // Arrange
        const config = createConfig();
        const createElements = (names: string[]) =>
          [
            {
              type: "module",
              pattern: "src/modules/*/*",
              basePattern: "src",
              [property]: names,
            },
          ] as unknown as ElementDescriptors;

        // Act
        const joinedKey = matchersCache.getKey({
          config,
          descriptors: { elements: createElements(["a,b"]) },
        });
        const listKey = matchersCache.getKey({
          config,
          descriptors: { elements: createElements(["a", "b"]) },
        });

        // Assert
        expect(joinedKey).not.toBe(listKey);
      }
    );

    it.each([
      ["capture", ["no-capture"], undefined],
      ["capture", ["invalid-capture"], "name"],
      ["baseCapture", ["no-base-capture"], undefined],
      ["baseCapture", ["invalid-base-capture"], "name"],
    ])(
      "should give a %s list of %j a different key than the value %j",
      (property, list, otherValue) => {
        // Arrange
        const config = createConfig();
        const createElements = (value: unknown) =>
          [
            {
              type: "module",
              pattern: "src/modules/*",
              basePattern: "src",
              [property]: value,
            },
          ] as unknown as ElementDescriptors;

        // Act
        const listKey = matchersCache.getKey({
          config,
          descriptors: { elements: createElements(list) },
        });
        const otherKey = matchersCache.getKey({
          config,
          descriptors: { elements: createElements(otherValue) },
        });

        // Assert
        expect(listKey).not.toBe(otherKey);
      }
    );

    it("should give different keys to a pattern string and a list of patterns that joins into it", () => {
      // Arrange
      const config = createConfig();
      const createElements = (pattern: string | string[]) =>
        [{ type: "module", pattern }] as unknown as ElementDescriptors;

      // Act
      const stringKey = matchersCache.getKey({
        config,
        descriptors: { elements: createElements("src/*,lib/*") },
      });
      const listKey = matchersCache.getKey({
        config,
        descriptors: { elements: createElements(["src/*", "lib/*"]) },
      });

      // Assert
      expect(stringKey).not.toBe(listKey);
    });

    it.each([null, undefined, "src/*"])(
      "should use 'invalid-descriptor' for an element descriptor that is %j",
      (descriptor) => {
        // Arrange
        const config = createConfig();
        const elements = [
          descriptor,
          { type: "module", pattern: "src/*" },
        ] as unknown as ElementDescriptors;

        // Act
        const key = matchersCache.getKey({
          config,
          descriptors: { elements },
        });

        // Assert
        expect(key).toContain(
          '|:elements:|invalid-descriptor,"src/*"|no-capture|module|'
        );
      }
    );

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
        '"src/components/*.tsx"|no-capture|component|ui|undefined|undefined|no-base-capture|false|undefined|undefined'
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
        '|:elements:|"src/components/*.tsx"|["name"]|component|ui|file|src|["base"]|undefined|undefined|undefined,"src/services/*.ts"|["svc"]|service|core|folder|lib|["root"]|undefined|undefined|undefined|:elementsSingleMatch:|'
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

      expect(key).toContain('|:files:|"src/**/*.spec.ts"|["name"]|test');
    });

    it("should produce empty files section when files is undefined", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: { files: undefined },
      });

      expect(key.endsWith("|:files:||:filesSingleMatch:|false")).toBe(true);
    });

    it("should produce empty files section when files is an empty array", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: { files: [] },
      });

      expect(key.endsWith("|:files:||:filesSingleMatch:|false")).toBe(true);
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

      expect(key).toContain('|:files:|"*.config.ts"|no-capture|config');
    });

    it("should use 'invalid-capture' when file descriptor capture is set and is not an array", () => {
      // Arrange
      const config = createConfig();
      const files = [
        {
          category: "config",
          pattern: "*.config.ts",
          capture: {},
        },
      ] as unknown as FileDescriptors;

      // Act
      const key = matchersCache.getKey({
        config,
        descriptors: { files },
      });

      // Assert
      expect(key).toContain('|:files:|"*.config.ts"|invalid-capture|config');
    });

    it("should include basePattern and baseCapture of file descriptors", () => {
      // Arrange
      const config = createConfig();
      const files = [
        {
          category: "test",
          pattern: "*.spec.ts",
          basePattern: "src/*",
          baseCapture: ["module"],
        },
        {
          category: "test",
          pattern: "*.spec.ts",
          basePattern: "lib/*",
          baseCapture: 5,
        },
      ] as unknown as FileDescriptors;

      // Act
      const key = matchersCache.getKey({
        config,
        descriptors: { files },
      });

      // Assert
      expect(key).toContain(
        '|:files:|"*.spec.ts"|no-capture|test|src/*|["module"]|undefined|undefined,"*.spec.ts"|no-capture|test|lib/*|invalid-base-capture|undefined|undefined'
      );
    });

    it.each([null, undefined, "*.ts"])(
      "should use 'invalid-descriptor' for a file descriptor that is %j",
      (descriptor) => {
        // Arrange
        const config = createConfig();
        const files = [
          descriptor,
          { category: "ts", pattern: "*.ts" },
        ] as unknown as FileDescriptors;

        // Act
        const key = matchersCache.getKey({
          config,
          descriptors: { files },
        });

        // Assert
        expect(key).toContain(
          '|:files:|invalid-descriptor,"*.ts"|no-capture|ts|'
        );
      }
    );

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
        '|:files:|"src/**/*.spec.ts"|["name"]|test|undefined|no-base-capture|undefined|undefined,"*.config.ts"|no-capture|config|undefined|no-base-capture|undefined|undefined'
      );
    });
  });

  describe("elementsSingleMatch", () => {
    it("should include 'true' when elementsSingleMatch is true", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: { elementsSingleMatch: true },
      });

      expect(key).toContain("|:elementsSingleMatch:|true|");
    });

    it("should include 'false' when elementsSingleMatch is undefined", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: {},
      });

      expect(key).toContain("|:elementsSingleMatch:|false|");
    });

    it("should include 'false' when elementsSingleMatch is false", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: { elementsSingleMatch: false },
      });

      expect(key).toContain("|:elementsSingleMatch:|false|");
    });

    it("should fall back to the deprecated elementsSingleType when elementsSingleMatch is undefined", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: { elementsSingleType: true },
      });

      expect(key).toContain("|:elementsSingleMatch:|true|");
    });

    it("should fall back to 'false' when only the deprecated elementsSingleType is false", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: { elementsSingleType: false },
      });

      expect(key).toContain("|:elementsSingleMatch:|false|");
    });

    it("should give precedence to elementsSingleMatch over the deprecated elementsSingleType", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: { elementsSingleMatch: false, elementsSingleType: true },
      });

      expect(key).toContain("|:elementsSingleMatch:|false|");
    });
  });

  describe("filesSingleMatch", () => {
    it("should include 'true' when filesSingleMatch is true", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: { filesSingleMatch: true },
      });

      expect(key).toContain("|:filesSingleMatch:|true");
    });

    it("should include 'false' when filesSingleMatch is undefined", () => {
      const config = createConfig();

      const key = matchersCache.getKey({
        config,
        descriptors: {},
      });

      expect(key).toContain("|:filesSingleMatch:|false");
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
        descriptors: { elements, files, elementsSingleMatch: true as const },
      };

      const key1 = matchersCache.getKey(params);
      const key2 = matchersCache.getKey(params);

      expect(key1).toBe(key2);
    });
  });
});
