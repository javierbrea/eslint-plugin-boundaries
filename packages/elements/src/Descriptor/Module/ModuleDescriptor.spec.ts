import type { DescriptorOptionsNormalized } from "../../Config";
import type { Micromatch } from "../../Matcher";

import { ORIGINS_MAP } from "./ModuleDescription.types";
import { ModulesDescriptor } from "./ModuleDescriptor";

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

describe("ModulesDescriptor", () => {
  describe("constructor", () => {
    it("should create an instance with cache enabled", () => {
      const config = createConfig({ cache: true });
      const micromatch = createMicromatchMock();

      const descriptor = new ModulesDescriptor(config, micromatch);

      expect(descriptor).toBeInstanceOf(ModulesDescriptor);
    });

    it("should create an instance with cache disabled", () => {
      const config = createConfig({ cache: false });
      const micromatch = createMicromatchMock();

      const descriptor = new ModulesDescriptor(config, micromatch);

      expect(descriptor).toBeInstanceOf(ModulesDescriptor);
    });
  });

  describe("describeModule", () => {
    describe("local modules", () => {
      it("should return local origin for a file within the root path", () => {
        const config = createConfig();
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule(
          "/root/project/src/components/Foo.ts"
        );

        expect(result).toEqual({
          origin: ORIGINS_MAP.LOCAL,
          source: null,
          internalPath: null,
        });
      });

      it("should return local origin for a relative import within the root path", () => {
        const config = createConfig();
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule(
          "/root/project/src/utils/helper.ts",
          "./helper"
        );

        expect(result).toEqual({
          origin: ORIGINS_MAP.LOCAL,
          source: null,
          internalPath: null,
        });
      });

      it("should return local origin when rootPath is not configured", () => {
        const config = createConfig({ rootPath: undefined });
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule("src/components/Foo.ts");

        expect(result).toEqual({
          origin: ORIGINS_MAP.LOCAL,
          source: null,
          internalPath: null,
        });
      });
    });

    describe("core modules", () => {
      it("should return core origin for a Node.js built-in module", () => {
        const config = createConfig();
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule(undefined, "fs");

        expect(result).toEqual({
          origin: ORIGINS_MAP.CORE,
          source: "fs",
          internalPath: null,
        });
      });

      it("should return core origin for a node: prefixed module", () => {
        const config = createConfig();
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule(undefined, "node:path");

        expect(result).toEqual({
          origin: ORIGINS_MAP.CORE,
          source: "node:path",
          internalPath: null,
        });
      });

      it("should return core origin with internalPath for a built-in subpath", () => {
        const config = createConfig();
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule(undefined, "fs/promises");

        expect(result).toEqual({
          origin: ORIGINS_MAP.CORE,
          source: "fs",
          internalPath: "promises",
        });
      });

      it("should return core origin with internalPath for a node: prefixed subpath", () => {
        const config = createConfig();
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule(undefined, "node:fs/promises");

        expect(result).toEqual({
          origin: ORIGINS_MAP.CORE,
          source: "node:fs",
          internalPath: "promises",
        });
      });
    });

    describe("external modules", () => {
      it("should return external origin for an unresolvable alias", () => {
        const config = createConfig();
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule(undefined, "lodash");

        expect(result).toEqual({
          origin: ORIGINS_MAP.EXTERNAL,
          source: "lodash",
          internalPath: null,
        });
      });

      it("should return external origin with internalPath for an unresolvable module subpath", () => {
        const config = createConfig();
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule(undefined, "lodash/get");

        expect(result).toEqual({
          origin: ORIGINS_MAP.EXTERNAL,
          source: "lodash",
          internalPath: "get",
        });
      });

      it("should return external origin for a scoped package", () => {
        const config = createConfig();
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule(undefined, "@scope/package");

        expect(result).toEqual({
          origin: ORIGINS_MAP.EXTERNAL,
          source: "@scope/package",
          internalPath: null,
        });
      });

      it("should return external origin with internalPath for a scoped package subpath", () => {
        const config = createConfig();
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule(
          undefined,
          "@scope/package/utils/helper"
        );

        expect(result).toEqual({
          origin: ORIGINS_MAP.EXTERNAL,
          source: "@scope/package",
          internalPath: "utils/helper",
        });
      });

      it("should return external origin for a file in node_modules without source", () => {
        const config = createConfig();
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule(
          "/root/project/node_modules/lodash/index.js"
        );

        expect(result).toEqual({
          origin: ORIGINS_MAP.EXTERNAL,
          source: null,
          internalPath: null,
        });
      });

      it("should return external origin for a file in node_modules with source", () => {
        const config = createConfig();
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule(
          "/root/project/node_modules/lodash/index.js",
          "lodash"
        );

        expect(result).toEqual({
          origin: ORIGINS_MAP.EXTERNAL,
          source: "lodash",
          internalPath: null,
        });
      });

      it("should not flag files in node_modules when inNodeModules is disabled", () => {
        const config = createConfig({
          flagAsExternal: {
            unresolvableAlias: true,
            inNodeModules: false,
            outsideRootPath: false,
            customSourcePatterns: [],
          },
        });
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule(
          "/root/project/node_modules/lodash/index.js",
          "./foo"
        );

        expect(result).toEqual({
          origin: ORIGINS_MAP.LOCAL,
          source: null,
          internalPath: null,
        });
      });
    });

    describe("outsideRootPath", () => {
      it("should return external origin when file is outside rootPath and outsideRootPath is enabled", () => {
        const config = createConfig({
          flagAsExternal: {
            unresolvableAlias: true,
            inNodeModules: true,
            outsideRootPath: true,
            customSourcePatterns: [],
          },
        });
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule("/other/path/file.ts");

        expect(result).toEqual({
          origin: ORIGINS_MAP.EXTERNAL,
          source: null,
          internalPath: null,
        });
      });

      it("should return local origin when file is outside rootPath but outsideRootPath is disabled", () => {
        const config = createConfig({
          flagAsExternal: {
            unresolvableAlias: true,
            inNodeModules: true,
            outsideRootPath: false,
            customSourcePatterns: [],
          },
        });
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule("/other/path/file.ts");

        expect(result).toEqual({
          origin: ORIGINS_MAP.LOCAL,
          source: null,
          internalPath: null,
        });
      });

      it("should return external origin when filePath is undefined and outsideRootPath is enabled", () => {
        const config = createConfig({
          flagAsExternal: {
            unresolvableAlias: false,
            inNodeModules: true,
            outsideRootPath: true,
            customSourcePatterns: [],
          },
        });
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule(undefined);

        expect(result).toEqual({
          origin: ORIGINS_MAP.EXTERNAL,
          source: null,
          internalPath: null,
        });
      });
    });

    describe("unresolvableAlias", () => {
      it("should not flag unresolvable aliases when disabled", () => {
        const config = createConfig({
          flagAsExternal: {
            unresolvableAlias: false,
            inNodeModules: true,
            outsideRootPath: false,
            customSourcePatterns: [],
          },
        });
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule(undefined, "some-alias");

        expect(result).toEqual({
          origin: ORIGINS_MAP.LOCAL,
          source: null,
          internalPath: null,
        });
      });

      it("should not flag relative imports as unresolvable alias", () => {
        const config = createConfig();
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule(undefined, "./relative");

        expect(result).toEqual({
          origin: ORIGINS_MAP.LOCAL,
          source: null,
          internalPath: null,
        });
      });
    });

    describe("customSourcePatterns", () => {
      it("should return external origin when source matches a custom pattern", () => {
        const micromatch = createMicromatchMock({
          isMatch: jest.fn().mockReturnValue(true),
        });
        const config = createConfig({
          flagAsExternal: {
            unresolvableAlias: false,
            inNodeModules: false,
            outsideRootPath: false,
            customSourcePatterns: ["@custom/*"],
          },
        });
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule(
          "/root/project/src/file.ts",
          "@custom/module"
        );

        expect(result).toEqual({
          origin: ORIGINS_MAP.EXTERNAL,
          source: "@custom/module",
          internalPath: null,
        });
      });

      it("should return local origin when source does not match custom patterns", () => {
        const micromatch = createMicromatchMock({
          isMatch: jest.fn().mockReturnValue(false),
        });
        const config = createConfig({
          flagAsExternal: {
            unresolvableAlias: false,
            inNodeModules: false,
            outsideRootPath: false,
            customSourcePatterns: ["@custom/*"],
          },
        });
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule(
          "/root/project/src/file.ts",
          "@other/module"
        );

        expect(result).toEqual({
          origin: ORIGINS_MAP.LOCAL,
          source: null,
          internalPath: null,
        });
      });

      it("should not match custom patterns when source is undefined", () => {
        const micromatch = createMicromatchMock();
        const config = createConfig({
          flagAsExternal: {
            unresolvableAlias: false,
            inNodeModules: false,
            outsideRootPath: false,
            customSourcePatterns: ["@custom/*"],
          },
        });
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule("/root/project/src/file.ts");

        expect(micromatch.isMatch).not.toHaveBeenCalled();
        expect(result).toEqual({
          origin: ORIGINS_MAP.LOCAL,
          source: null,
          internalPath: null,
        });
      });
    });

    describe("caching", () => {
      it("should return the cached result on the second call with the same arguments", () => {
        const config = createConfig();
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const first = descriptor.describeModule(undefined, "lodash");
        const second = descriptor.describeModule(undefined, "lodash");

        expect(first).toBe(second);
      });

      it("should return different results for different arguments", () => {
        const config = createConfig();
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const external = descriptor.describeModule(undefined, "lodash");
        const core = descriptor.describeModule(undefined, "fs");

        expect(external.origin).toBe(ORIGINS_MAP.EXTERNAL);
        expect(core.origin).toBe(ORIGINS_MAP.CORE);
      });
    });

    describe("no filePath and no source", () => {
      it("should return external when outsideRootPath is enabled and filePath is missing", () => {
        const config = createConfig({
          flagAsExternal: {
            unresolvableAlias: false,
            inNodeModules: false,
            outsideRootPath: true,
            customSourcePatterns: [],
          },
        });
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule();

        expect(result).toEqual({
          origin: ORIGINS_MAP.EXTERNAL,
          source: null,
          internalPath: null,
        });
      });

      it("should return local when no flagAsExternal conditions are met", () => {
        const config = createConfig({
          flagAsExternal: {
            unresolvableAlias: false,
            inNodeModules: false,
            outsideRootPath: false,
            customSourcePatterns: [],
          },
        });
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule();

        expect(result).toEqual({
          origin: ORIGINS_MAP.LOCAL,
          source: null,
          internalPath: null,
        });
      });
    });

    describe("path normalization", () => {
      it("should normalize backslashes in file paths", () => {
        const config = createConfig({ rootPath: "C:/Users/project/" });
        const micromatch = createMicromatchMock();
        const descriptor = new ModulesDescriptor(config, micromatch);

        const result = descriptor.describeModule(
          "C:\\Users\\project\\src\\file.ts"
        );

        expect(result).toEqual({
          origin: ORIGINS_MAP.LOCAL,
          source: null,
          internalPath: null,
        });
      });
    });
  });

  describe("serializeCache", () => {
    it("should return a serialized cache with descriptions", () => {
      const config = createConfig();
      const micromatch = createMicromatchMock();
      const descriptor = new ModulesDescriptor(config, micromatch);

      descriptor.describeModule(undefined, "fs");

      const serialized = descriptor.serializeCache();

      expect(serialized).toHaveProperty("descriptions");
      expect(serialized.descriptions).toHaveProperty("undefined::fs");
    });

    it("should return an empty descriptions object when no modules have been described", () => {
      const config = createConfig();
      const micromatch = createMicromatchMock();
      const descriptor = new ModulesDescriptor(config, micromatch);

      const serialized = descriptor.serializeCache();

      expect(serialized).toEqual({ descriptions: {} });
    });
  });

  describe("setCacheFromSerialized", () => {
    it("should restore cache from serialized data", () => {
      const config = createConfig();
      const micromatch = createMicromatchMock();
      const descriptor = new ModulesDescriptor(config, micromatch);

      const cacheEntry = {
        origin: ORIGINS_MAP.CORE,
        source: "fs",
        internalPath: null,
      };
      descriptor.setCacheFromSerialized({
        descriptions: { "undefined::fs": cacheEntry },
      });

      const result = descriptor.describeModule(undefined, "fs");

      expect(result).toEqual(cacheEntry);
    });
  });

  describe("clearCache", () => {
    it("should clear all cached descriptions", () => {
      const config = createConfig();
      const micromatch = createMicromatchMock();
      const descriptor = new ModulesDescriptor(config, micromatch);

      descriptor.describeModule(undefined, "fs");
      descriptor.clearCache();

      const serialized = descriptor.serializeCache();

      expect(serialized).toEqual({ descriptions: {} });
    });
  });
});
