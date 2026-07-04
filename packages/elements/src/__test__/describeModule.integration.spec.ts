import micromatch from "micromatch";

import type { Matcher, ModuleDescription } from "../index";
import { Elements, isOriginDescription } from "../index";

describe("describeModule | Integration", () => {
  let matcher: Matcher;
  let elements: Elements;

  beforeEach(() => {
    elements = new Elements({
      includePaths: ["**/src/**/*.ts", "**/src/**/*.tsx"],
      ignorePaths: ["**/src/**/__tests__/**"],
    });
    matcher = elements.getMatcher({
      elements: [{ type: "component", pattern: "src/components/*.tsx" }],
    });
  });

  afterEach(() => {
    elements.clearCache();
  });

  describe("local module descriptions", () => {
    it("should return local origin for a local file without source", () => {
      const description = matcher.describeModule(
        "/project/src/components/Button.tsx"
      );

      expect(description).toEqual({
        origin: "local",
        source: null,
        internalPath: null,
      });
      expect(isOriginDescription(description)).toBe(true);
    });

    it("should return local origin for a local file with a relative source", () => {
      const description = matcher.describeModule(
        "/project/src/components/Button.tsx",
        "./utils/helper"
      );

      expect(description).toEqual({
        origin: "local",
        source: null,
        internalPath: null,
      });
      expect(isOriginDescription(description)).toBe(true);
    });

    it("should return local origin when no filePath and no source are provided", () => {
      const description = matcher.describeModule(undefined, undefined);

      expect(isOriginDescription(description)).toBe(true);
      expect(description.origin).toBe("local");
    });
  });

  describe("external module descriptions via node_modules path", () => {
    it("should return external origin for a file inside node_modules", () => {
      const description = matcher.describeModule(
        "/project/node_modules/react/index.js",
        "react"
      );

      expect(description).toEqual({
        origin: "external",
        source: "react",
        internalPath: null,
      });
      expect(isOriginDescription(description)).toBe(true);
    });

    it("should return external origin for a scoped package", () => {
      const description = matcher.describeModule(
        "/project/node_modules/@mui/icons-material/index.js",
        "@mui/icons-material"
      );

      expect(description).toEqual({
        origin: "external",
        source: "@mui/icons-material",
        internalPath: null,
      });
    });

    it("should extract internalPath for a scoped package with subpath", () => {
      const description = matcher.describeModule(
        "/project/node_modules/@mui/icons-material/Delete.js",
        "@mui/icons-material/Delete"
      );

      expect(description).toEqual({
        origin: "external",
        source: "@mui/icons-material",
        internalPath: "Delete",
      });
    });

    it("should extract internalPath for a package with a subpath", () => {
      const description = matcher.describeModule(
        "/project/node_modules/lodash/fp.js",
        "lodash/fp"
      );

      expect(description).toEqual({
        origin: "external",
        source: "lodash",
        internalPath: "fp",
      });
    });

    it("should extract internalPath for a package with a deep subpath", () => {
      const description = matcher.describeModule(
        "/project/node_modules/react-dom/client/index.js",
        "react-dom/client"
      );

      expect(description).toEqual({
        origin: "external",
        source: "react-dom",
        internalPath: "client",
      });
    });
  });

  describe("external module descriptions without resolved path", () => {
    it("should return external origin for an unresolvable non-relative import", () => {
      const description = matcher.describeModule(undefined, "lodash");

      expect(description).toEqual({
        origin: "external",
        source: "lodash",
        internalPath: null,
      });
    });

    it("should extract source and internalPath for an unresolvable import with subpath", () => {
      const description = matcher.describeModule(undefined, "lodash/fp");

      expect(description).toEqual({
        origin: "external",
        source: "lodash",
        internalPath: "fp",
      });
    });

    it("should return external origin for an unresolvable scoped package", () => {
      const description = matcher.describeModule(undefined, "@scope/package");

      expect(description).toEqual({
        origin: "external",
        source: "@scope/package",
        internalPath: null,
      });
    });

    it("should return external origin for an unresolvable scoped package with subpath", () => {
      const description = matcher.describeModule(
        undefined,
        "@scope/package/subpath"
      );

      expect(description).toEqual({
        origin: "external",
        source: "@scope/package",
        internalPath: "subpath",
      });
    });
  });

  describe("core module descriptions", () => {
    it("should return core origin for Node.js built-in modules", () => {
      const description = matcher.describeModule(undefined, "fs");

      expect(description).toEqual({
        origin: "core",
        source: "fs",
        internalPath: null,
      });
      expect(isOriginDescription(description)).toBe(true);
    });

    it("should return core origin for the path module", () => {
      const description = matcher.describeModule(undefined, "path");

      expect(description).toEqual({
        origin: "core",
        source: "path",
        internalPath: null,
      });
    });

    it("should return core origin for modules with node: prefix", () => {
      const description = matcher.describeModule(undefined, "node:fs");

      expect(description).toEqual({
        origin: "core",
        source: "node:fs",
        internalPath: null,
      });
    });

    it("should return core origin for modules with node: prefix and internal path", () => {
      const description = matcher.describeModule(undefined, "node:fs/promises");

      expect(description).toEqual({
        origin: "core",
        source: "node:fs",
        internalPath: "promises",
      });
    });

    it("should return core origin for fs/promises", () => {
      const description = matcher.describeModule(undefined, "fs/promises");

      expect(description).toEqual({
        origin: "core",
        source: "fs",
        internalPath: "promises",
      });
    });
  });

  describe("isOriginDescription type guard", () => {
    it("should return true for a valid local module description", () => {
      const description = matcher.describeModule(
        "/project/src/components/Button.tsx"
      );

      expect(isOriginDescription(description)).toBe(true);
    });

    it("should return true for a valid external module description", () => {
      const description = matcher.describeModule(
        "/project/node_modules/react/index.js",
        "react"
      );

      expect(isOriginDescription(description)).toBe(true);
    });

    it("should return true for a valid core module description", () => {
      const description = matcher.describeModule(undefined, "fs");

      expect(isOriginDescription(description)).toBe(true);
    });

    it("should return false for a plain object without origin", () => {
      expect(isOriginDescription({ source: "react" })).toBe(false);
    });

    it("should return false for an object with an invalid origin value", () => {
      expect(
        isOriginDescription({
          origin: "unknown",
          source: null,
          internalPath: null,
        })
      ).toBe(false);
    });

    it("should return false for null", () => {
      expect(isOriginDescription(null)).toBe(false);
    });

    it("should return false for a primitive value", () => {
      expect(isOriginDescription("local")).toBe(false);
    });
  });

  describe("flagAsExternal configuration effects on describeModule", () => {
    it("should return local origin for node_modules when inNodeModules is false", () => {
      const elementsNoNodeModules = new Elements({
        flagAsExternal: { inNodeModules: false },
      });
      const matcherNoNodeModules = elementsNoNodeModules.getMatcher({
        elements: [{ type: "component", pattern: "**/*.ts" }],
      });

      const description = matcherNoNodeModules.describeModule(
        "/project/node_modules/react/index.js",
        "react"
      );

      elementsNoNodeModules.clearCache();

      expect(description.origin).toBe("local");
    });

    it("should return local origin for unresolvable alias when unresolvableAlias is false", () => {
      const elementsNoAlias = new Elements({
        flagAsExternal: { unresolvableAlias: false },
      });
      const matcherNoAlias = elementsNoAlias.getMatcher({
        elements: [{ type: "component", pattern: "src/components/*.ts" }],
      });

      const description = matcherNoAlias.describeModule(
        undefined,
        "some-alias"
      );

      elementsNoAlias.clearCache();

      expect(description.origin).toBe("local");
    });

    it("should return external origin for paths matching customSourcePatterns", () => {
      const elementsCustomPatterns = new Elements({
        flagAsExternal: {
          customSourcePatterns: ["@myorg/*", "~/utils/**"],
          unresolvableAlias: false,
        },
      });
      const matcherCustomPatterns = elementsCustomPatterns.getMatcher({
        elements: [{ type: "component", pattern: "src/components/*.ts" }],
      });

      const description = matcherCustomPatterns.describeModule(
        "/project/src/shared/index.ts",
        "@myorg/shared"
      );

      elementsCustomPatterns.clearCache();

      expect(description.origin).toBe("external");
      expect(description.source).toBe("@myorg/shared");
    });

    it("should return local origin for paths not matching customSourcePatterns", () => {
      const elementsCustomPatterns = new Elements({
        flagAsExternal: {
          customSourcePatterns: ["@myorg/*"],
          unresolvableAlias: false,
        },
      });
      const matcherCustomPatterns = elementsCustomPatterns.getMatcher({
        elements: [{ type: "component", pattern: "src/components/*.ts" }],
      });

      const description = matcherCustomPatterns.describeModule(
        "/project/src/shared/index.ts",
        "@other/shared"
      );

      elementsCustomPatterns.clearCache();

      expect(description.origin).toBe("local");
    });
  });

  describe("rootPath configuration effects on describeModule", () => {
    it("should return local origin for a file inside the rootPath", () => {
      const elementsWithRoot = new Elements({
        rootPath: "/monorepo/packages/app",
        flagAsExternal: { outsideRootPath: true },
      });
      const matcherWithRoot = elementsWithRoot.getMatcher({
        elements: [{ type: "component", pattern: "src/components/*.tsx" }],
      });

      const description = matcherWithRoot.describeModule(
        "/monorepo/packages/app/src/components/Button.tsx"
      );

      elementsWithRoot.clearCache();

      expect(description).toEqual({
        origin: "local",
        source: null,
        internalPath: null,
      });
    });

    it("should return external origin for a file outside the rootPath when outsideRootPath is true", () => {
      const elementsWithRoot = new Elements({
        rootPath: "/monorepo/packages/app",
        flagAsExternal: { outsideRootPath: true },
      });
      const matcherWithRoot = elementsWithRoot.getMatcher({
        elements: [{ type: "component", pattern: "src/components/*.tsx" }],
      });

      const description = matcherWithRoot.describeModule(
        "/monorepo/packages/shared/src/Button.tsx",
        "@myorg/shared"
      );

      elementsWithRoot.clearCache();

      expect(description.origin).toBe("external");
    });

    it("should return local origin for a file outside rootPath when outsideRootPath is false", () => {
      const elementsWithRoot = new Elements({
        rootPath: "/monorepo/packages/app",
        flagAsExternal: {
          outsideRootPath: false,
          unresolvableAlias: false,
        },
      });
      const matcherWithRoot = elementsWithRoot.getMatcher({
        elements: [{ type: "component", pattern: "**/*.tsx" }],
      });

      const description = matcherWithRoot.describeModule(
        "/monorepo/packages/shared/src/Button.tsx",
        "@myorg/shared"
      );

      elementsWithRoot.clearCache();

      expect(description.origin).toBe("local");
    });
  });

  describe("module descriptor cache", () => {
    let matcherWithPatterns: Matcher;
    let elementsWithPatterns: Elements;
    let isMatchSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();
      isMatchSpy = jest.spyOn(micromatch, "isMatch");
      elementsWithPatterns = new Elements({
        flagAsExternal: { customSourcePatterns: ["@vendor/*"] },
      });
      matcherWithPatterns = elementsWithPatterns.getMatcher({
        elements: [{ type: "component", pattern: "src/components/*.tsx" }],
      });
    });

    afterEach(() => {
      elementsWithPatterns.clearCache();
    });

    it("should not call micromatch multiple times for the same module", () => {
      matcherWithPatterns.describeModule(
        "/project/src/components/Button.tsx",
        "@vendor/test"
      );

      expect(isMatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcherWithPatterns.describeModule(
        "/project/src/components/Button.tsx",
        "@vendor/test"
      );

      expect(isMatchSpy).not.toHaveBeenCalled();
    });

    it("should use separate cache entries for the same filePath with different sources", () => {
      const localDescription = matcherWithPatterns.describeModule(
        "/project/src/components/Button.tsx"
      );
      const coreDescription = matcherWithPatterns.describeModule(
        "/project/src/components/Button.tsx",
        "fs"
      );

      expect(localDescription.origin).toBe("local");
      expect(coreDescription.origin).toBe("core");
    });

    it("should call micromatch for modules with different sources", () => {
      matcherWithPatterns.describeModule(
        "/project/src/components/Button.tsx",
        "@vendor/lib-a"
      );

      expect(isMatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcherWithPatterns.describeModule(
        "/project/src/components/Button.tsx",
        "@vendor/lib-b"
      );

      expect(isMatchSpy).toHaveBeenCalled();
    });

    it("should not call micromatch again after clearing the matcher cache, because the global cache is still populated", () => {
      matcherWithPatterns.describeModule(
        "/project/src/components/Button.tsx",
        "@vendor/test"
      );

      expect(isMatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcherWithPatterns.clearCache();

      matcherWithPatterns.describeModule(
        "/project/src/components/Button.tsx",
        "@vendor/test"
      );

      expect(isMatchSpy).not.toHaveBeenCalled();
    });

    it("should call micromatch again after clearing the cache in the elements instance", () => {
      matcherWithPatterns.describeModule(
        "/project/src/components/Button.tsx",
        "@vendor/test"
      );

      expect(isMatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      elementsWithPatterns.clearCache();

      matcherWithPatterns.describeModule(
        "/project/src/components/Button.tsx",
        "@vendor/test"
      );

      expect(isMatchSpy).toHaveBeenCalled();
    });

    it("should not call micromatch again after filling the cache with serialized data in the matcher", () => {
      matcherWithPatterns.describeModule(
        "/project/src/components/Button.tsx",
        "@vendor/test"
      );

      expect(isMatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      const serializedCache = matcherWithPatterns.serializeCache();

      matcherWithPatterns.clearCache();

      matcherWithPatterns.setCacheFromSerialized(serializedCache);

      matcherWithPatterns.describeModule(
        "/project/src/components/Button.tsx",
        "@vendor/test"
      );

      expect(isMatchSpy).not.toHaveBeenCalled();
    });

    it("should not call micromatch again after filling the cache with serialized data in elements", () => {
      matcherWithPatterns.describeModule(
        "/project/src/components/Button.tsx",
        "@vendor/test"
      );

      expect(isMatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      const serializedCache = elementsWithPatterns.serializeCache();

      matcherWithPatterns.clearCache();

      elementsWithPatterns.setCacheFromSerialized(serializedCache);

      matcherWithPatterns.describeModule(
        "/project/src/components/Button.tsx",
        "@vendor/test"
      );

      expect(isMatchSpy).not.toHaveBeenCalled();
    });
  });

  describe("consistency with describeEntity", () => {
    it("should return the same module description as the module field in describeEntity for local files", () => {
      const filePath = "/project/src/components/Button.tsx";

      const moduleDescription = matcher.describeModule(filePath);
      const entityDescription = matcher.describeEntity(filePath);

      expect(moduleDescription).toEqual(entityDescription.module);
    });

    it("should return the same module description as the module field in describeEntity for external modules", () => {
      const filePath = "/project/node_modules/react/index.js";
      const source = "react";

      const moduleDescription = matcher.describeModule(filePath, source);
      const entityDescription = matcher.describeEntity(filePath, source);

      expect(moduleDescription).toEqual(entityDescription.module);
    });

    it("should return the same module description as the module field in describeEntity for core modules", () => {
      const source = "fs";

      const moduleDescription = matcher.describeModule(undefined, source);
      const entityDescription = matcher.describeEntity(undefined, source);

      expect(moduleDescription).toEqual(entityDescription.module);
    });

    it("should return the same module description as the module field in describeEntity for external modules with internalPath", () => {
      const filePath = "/project/node_modules/lodash/fp.js";
      const source = "lodash/fp";

      const moduleDescription = matcher.describeModule(filePath, source);
      const entityDescription = matcher.describeEntity(filePath, source);

      expect(moduleDescription).toEqual(entityDescription.module);
    });
  });

  describe("getModuleSelectorMatchingDescription", () => {
    it("should return the matching selector given a local module description", () => {
      const description: ModuleDescription = matcher.describeModule(
        "/project/src/components/Button.tsx"
      );

      const result = matcher.getModuleSelectorMatchingDescription(description, {
        origin: "local",
      });

      expect(result).toStrictEqual({ origin: "local" });
    });

    it("should return null when the selector does not match the module description", () => {
      const description: ModuleDescription = matcher.describeModule(
        "/project/src/components/Button.tsx"
      );

      const result = matcher.getModuleSelectorMatchingDescription(description, {
        origin: "external",
      });

      expect(result).toBeNull();
    });

    it("should return the first matching selector from an array", () => {
      const description: ModuleDescription = matcher.describeModule(
        "/project/node_modules/react/index.js",
        "react"
      );

      const result = matcher.getModuleSelectorMatchingDescription(description, [
        { origin: "local" },
        { origin: "external", source: "react" },
      ]);

      expect(result).toStrictEqual({ origin: "external", source: "react" });
    });

    it("should match source on an external module description", () => {
      const description: ModuleDescription = matcher.describeModule(
        "/project/node_modules/react/index.js",
        "react"
      );

      const result = matcher.getModuleSelectorMatchingDescription(description, {
        source: "react",
      });

      expect(result).toStrictEqual({ source: "react" });
    });

    it("should match internalPath on an external module description with subpath", () => {
      const description: ModuleDescription = matcher.describeModule(
        "/project/node_modules/lodash/fp.js",
        "lodash/fp"
      );

      const result = matcher.getModuleSelectorMatchingDescription(description, {
        source: "lodash",
        internalPath: "fp",
      });

      expect(result).toStrictEqual({ source: "lodash", internalPath: "fp" });
    });

    it("should throw when given an invalid selector", () => {
      const description: ModuleDescription = matcher.describeModule(
        "/project/src/components/Button.tsx"
      );

      expect(() =>
        matcher.getModuleSelectorMatchingDescription(description, {
          foo: "bar",
        } as never)
      ).toThrow();
    });
  });
});
