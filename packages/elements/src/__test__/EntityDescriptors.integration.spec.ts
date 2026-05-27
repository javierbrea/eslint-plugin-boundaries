import micromatch from "micromatch";

import type { Matcher } from "../index";
import { Elements, isEntityDescription, isOriginDescription } from "../index";

describe("Entity Descriptors | Integration", () => {
  let matcher: Matcher;
  let elements: Elements;
  let micromatchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    micromatchSpy = jest.spyOn(micromatch, "capture");

    elements = new Elements({
      includePaths: ["**/src/**/*.ts", "**/src/**/*.tsx"],
      ignorePaths: ["**/src/**/__tests__/**"],
    });
    matcher = elements.getMatcher({
      elements: [
        {
          type: "component",
          category: "react",
          pattern: "src/components/*.tsx",
          mode: "file",
          capture: ["fileName"],
        },
        {
          type: "test",
          category: "business-logic",
          pattern: ["*/*.test.ts", "*/*.spec.ts"],
          basePattern: "**/src/*",
          mode: "file",
          capture: ["elementName", "testFileName"],
          baseCapture: ["root", "businessLogicArea"],
        },
        {
          category: "business-logic",
          pattern: ["modules/*"],
        },
        {
          type: "foo",
          pattern: ["foo/*"],
        },
        {
          type: "service",
          pattern: ["**/src/services/*/*.ts"],
          mode: "full",
          capture: ["baseFolder", "serviceName", "serviceFileName"],
        },
        { type: "utility", pattern: "src/utils/**/*.ts", mode: "file" },
      ],
      files: [
        {
          pattern: "**/*.tsx",
          category: "tsx-file",
        },
        {
          pattern: "**/*.test.ts",
          category: "test-file",
          capture: ["testDir", "testName"],
        },
        {
          pattern: "**/*.spec.ts",
          category: "spec-file",
          capture: ["specDir", "specName"],
        },
        {
          pattern: "**/*.ts",
          category: "ts-file",
        },
      ],
    });
  });

  afterEach(() => {
    elements.clearCache();
  });

  describe("entity descriptions for local elements", () => {
    it("should return a valid entity description for a known local element", () => {
      const entity = matcher.describeEntity(
        "/project/src/components/Button.tsx"
      );

      expect(isEntityDescription(entity)).toBe(true);
      expect(entity).toEqual({
        element: expect.objectContaining({
          types: ["component"],
          category: "react",
          captured: { fileName: "Button" },
          filePath: "/project/src/components/Button.tsx",
          fileInternalPath: "Button.tsx",
          parents: [],
          isIgnored: false,
          isUnknown: false,
        }),
        file: expect.objectContaining({
          categories: ["tsx-file"],
          isIgnored: false,
          isUnknown: false,
        }),
        module: {
          origin: "local",
          source: null,
          internalPath: null,
        },
      });
    });

    it("should return a valid entity description for a service element in full mode", () => {
      const entity = matcher.describeEntity(
        "/project/src/services/payment/PaymentService.ts"
      );

      expect(isEntityDescription(entity)).toBe(true);
      expect(entity.element).toEqual(
        expect.objectContaining({
          types: ["service"],
          category: null,
          captured: {
            baseFolder: "/project",
            serviceName: "payment",
            serviceFileName: "PaymentService",
          },
          isUnknown: false,
        })
      );
      expect(entity.file).toEqual(
        expect.objectContaining({
          categories: ["ts-file"],
          isIgnored: false,
          isUnknown: false,
        })
      );
      expect(entity.module).toEqual({
        origin: "local",
        source: null,
        internalPath: null,
      });
    });

    it("should return a valid entity description for a test element with basePattern", () => {
      const entity = matcher.describeEntity(
        "/project/src/utils/math/math.test.ts"
      );

      expect(isEntityDescription(entity)).toBe(true);
      expect(entity.element).toEqual(
        expect.objectContaining({
          types: ["test"],
          category: "business-logic",
          captured: {
            elementName: "math",
            testFileName: "math",
            businessLogicArea: "utils",
            root: "/project",
          },
          isUnknown: false,
        })
      );
      expect(entity.file).toEqual(
        expect.objectContaining({
          categories: ["test-file", "ts-file"],
          isIgnored: false,
          isUnknown: false,
        })
      );
    });

    it("should return a valid entity description for an element without type", () => {
      const entity = matcher.describeEntity("/project/src/modules/user/foo.ts");

      expect(isEntityDescription(entity)).toBe(true);
      expect(entity.element).toEqual(
        expect.objectContaining({
          types: null,
          category: "business-logic",
          isUnknown: false,
        })
      );
      expect(entity.file).toEqual(
        expect.objectContaining({
          categories: ["ts-file"],
          isUnknown: false,
        })
      );
      expect(entity.module).toEqual({
        origin: "local",
        source: null,
        internalPath: null,
      });
    });

    it("should return unknown element when no element descriptor matches", () => {
      const entity = matcher.describeEntity("/project/src/misc/other.ts");

      expect(isEntityDescription(entity)).toBe(true);
      expect(entity.element).toEqual(
        expect.objectContaining({
          types: null,
          category: null,
          isUnknown: true,
        })
      );
      expect(entity.file).toEqual(
        expect.objectContaining({
          categories: ["ts-file"],
          isUnknown: false,
        })
      );
      expect(entity.module).toEqual({
        origin: "local",
        source: null,
        internalPath: null,
      });
    });

    it("should return unknown file when no file descriptor is configured", () => {
      const matcherNoFiles = elements.getMatcher({
        elements: [
          {
            type: "component",
            category: "react",
            pattern: "src/components/*.tsx",
            mode: "file",
            capture: ["fileName"],
          },
        ],
      });

      const entity = matcherNoFiles.describeEntity(
        "/project/src/components/Button.tsx"
      );

      expect(isEntityDescription(entity)).toBe(true);
      expect(entity.element).toEqual(
        expect.objectContaining({
          types: ["component"],
          isUnknown: false,
        })
      );
      expect(entity.file).toEqual(
        expect.objectContaining({
          categories: null,
          isUnknown: true,
        })
      );
    });
  });

  describe("entity descriptions with file categories", () => {
    it("should match tsx files to the tsx-file category", () => {
      const entity = matcher.describeEntity(
        "/project/src/components/Button.tsx"
      );

      expect(entity.file).toEqual(
        expect.objectContaining({
          categories: ["tsx-file"],
          isIgnored: false,
          isUnknown: false,
        })
      );
    });

    it("should match .test.ts files to the test-file and ts-file categories", () => {
      const entity = matcher.describeEntity(
        "/project/src/utils/math/math.test.ts"
      );

      expect(entity.file).toEqual(
        expect.objectContaining({
          categories: ["test-file", "ts-file"],
          isIgnored: false,
          isUnknown: false,
        })
      );
    });

    it("should match .spec.ts files to the spec-file and ts-file categories", () => {
      const entity = matcher.describeEntity(
        "/project/src/utils/math/math.spec.ts"
      );

      expect(entity.file).toEqual(
        expect.objectContaining({
          categories: ["spec-file", "ts-file"],
          isIgnored: false,
          isUnknown: false,
        })
      );
    });

    it("should match regular .ts files to the ts-file category", () => {
      const entity = matcher.describeEntity(
        "/project/src/services/payment/PaymentService.ts"
      );

      expect(entity.file).toEqual(
        expect.objectContaining({
          categories: ["ts-file"],
          isIgnored: false,
          isUnknown: false,
        })
      );
    });

    it("should capture file pattern values when using basePattern", () => {
      const matcherWithCapture = elements.getMatcher({
        elements: [
          { type: "utility", pattern: "src/utils/**/*.ts", mode: "file" },
        ],
        files: [
          {
            pattern: "*.test.ts",
            basePattern: "**/src/*",
            category: "test-file",
            baseCapture: ["root", "area"],
          },
        ],
      });

      const entity = matcherWithCapture.describeEntity(
        "/project/src/utils/math.test.ts"
      );

      expect(entity.file.captured).toEqual({
        root: "/project",
        area: "utils",
        restOfPath: "math",
      });
    });

    it("should accumulate categories from multiple matching file descriptors", () => {
      const entity = matcher.describeEntity(
        "/project/src/utils/math/math.test.ts"
      );

      expect(entity.file.categories).toEqual(["test-file", "ts-file"]);
    });
  });

  describe("entity descriptions with module origins", () => {
    it("should describe local entities with local module origin", () => {
      const entity = matcher.describeEntity(
        "/project/src/components/Button.tsx"
      );

      expect(entity.module).toEqual({
        origin: "local",
        source: null,
        internalPath: null,
      });
      expect(isOriginDescription(entity.module)).toBe(true);
    });

    it("should describe external entities with external module origin", () => {
      const entity = matcher.describeEntity(
        "/project/node_modules/react/index.tsx",
        "react"
      );

      expect(entity.module).toEqual({
        origin: "external",
        source: "react",
        internalPath: null,
      });
      expect(isOriginDescription(entity.module)).toBe(true);
    });

    it("should describe scoped external entities correctly", () => {
      const entity = matcher.describeEntity(
        "/project/node_modules/@mui/icons-material/index.tsx",
        "@mui/icons-material"
      );

      expect(entity.module).toEqual({
        origin: "external",
        source: "@mui/icons-material",
        internalPath: null,
      });
      expect(isOriginDescription(entity.module)).toBe(true);
    });

    it("should describe scoped external entities with internal path", () => {
      const entity = matcher.describeEntity(
        "/project/node_modules/@mui/icons-material/index.tsx",
        "@mui/icons-material/foo"
      );

      expect(entity.module).toEqual({
        origin: "external",
        source: "@mui/icons-material",
        internalPath: "foo",
      });
    });

    it("should describe core module entities correctly", () => {
      const entity = matcher.describeEntity(undefined, "fs");

      expect(entity.module).toEqual({
        origin: "core",
        source: "fs",
        internalPath: null,
      });
      expect(isOriginDescription(entity.module)).toBe(true);
    });

    it("should describe core module entities with node prefix correctly", () => {
      const entity = matcher.describeEntity(undefined, "node:fs");

      expect(entity.module).toEqual({
        origin: "core",
        source: "node:fs",
        internalPath: null,
      });
    });

    it("should describe external entities without resolved path", () => {
      const entity = matcher.describeEntity(undefined, "lodash");

      expect(entity.module).toEqual({
        origin: "external",
        source: "lodash",
        internalPath: null,
      });
    });

    it("should describe external entities with internal path", () => {
      const entity = matcher.describeEntity(undefined, "lodash/fp");

      expect(entity.module).toEqual({
        origin: "external",
        source: "lodash",
        internalPath: "fp",
      });
    });
  });

  describe("entity descriptions for ignored elements", () => {
    it("should describe entities in ignorePaths as ignored", () => {
      const entity = matcher.describeEntity(
        "/project/src/utils/__tests__/testUtil.ts"
      );

      expect(isEntityDescription(entity)).toBe(true);
      expect(entity.element).toEqual(
        expect.objectContaining({
          isIgnored: true,
        })
      );
      expect(entity.file).toEqual(
        expect.objectContaining({
          isIgnored: true,
        })
      );
    });

    it("should describe entities not matching includePaths as ignored", () => {
      const entity = matcher.describeEntity("/project/foo/utils/testUtil.ts");

      expect(isEntityDescription(entity)).toBe(true);
      expect(entity.element).toEqual(
        expect.objectContaining({
          isIgnored: true,
        })
      );
      expect(entity.file).toEqual(
        expect.objectContaining({
          isIgnored: true,
        })
      );
    });

    it("should mark ignored entity files as ignored with isUnknown true", () => {
      const entity = matcher.describeEntity(
        "/project/src/utils/__tests__/testUtil.ts"
      );

      expect(entity.file.isIgnored).toBe(true);
      expect(entity.file.isUnknown).toBe(true);
    });
  });

  describe("entity descriptions with configuration options", () => {
    it("should include every file by default when no paths config is provided", () => {
      const otherMatcher = elements.getMatcher(
        {
          elements: [
            {
              type: "component",
              category: "react",
              pattern: "src/components/*.tsx",
              mode: "file",
              capture: ["fileName"],
            },
          ],
          files: [
            {
              pattern: "**/*.tsx",
              category: "tsx-file",
            },
          ],
        },
        {}
      );

      const entity = otherMatcher.describeEntity(
        "/project/src/components/Button.tsx"
      );

      expect(isEntityDescription(entity)).toBe(true);
      expect(entity.element).toEqual(
        expect.objectContaining({
          types: ["component"],
          category: "react",
          isUnknown: false,
        })
      );
      expect(entity.file).toEqual(
        expect.objectContaining({
          categories: ["tsx-file"],
          isUnknown: false,
        })
      );
    });

    it("should exclude files when only ignorePaths is provided", () => {
      const otherMatcher = elements.getMatcher(
        {
          elements: [
            {
              type: "component",
              pattern: "src/components/*.tsx",
              mode: "file",
            },
          ],
        },
        {
          ignorePaths: ["**/src/**/*.tsx"],
        }
      );

      const entity = otherMatcher.describeEntity(
        "/project/src/components/Button.tsx"
      );

      expect(entity.element).toEqual(
        expect.objectContaining({
          isIgnored: true,
        })
      );
    });

    it("should not include files when includePaths do not match", () => {
      const otherMatcher = elements.getMatcher(
        {
          elements: [
            {
              type: "component",
              pattern: "src/components/*.tsx",
              mode: "file",
            },
          ],
        },
        {
          includePaths: ["**/src/**/*.md"],
        }
      );

      const entity = otherMatcher.describeEntity(
        "/project/src/components/Button.tsx"
      );

      expect(entity.element).toEqual(
        expect.objectContaining({
          isIgnored: true,
        })
      );
    });
  });

  describe("entity descriptions consistency", () => {
    it("should return consistent element descriptions between describeElement and describeEntity", () => {
      const filePath = "/project/src/components/Button.tsx";

      const elementDescription = matcher.describeElement(filePath);
      const entityDescription = matcher.describeEntity(filePath);

      expect(entityDescription.element).toEqual(elementDescription);
    });

    it("should return consistent module descriptions between describeModule and describeEntity", () => {
      const filePath = "/project/src/components/Button.tsx";
      const source = "react";

      const moduleDescription = matcher.describeModule(filePath, source);
      const entityDescription = matcher.describeEntity(filePath, source);

      expect(entityDescription.module).toEqual(moduleDescription);
    });
  });

  describe("entity descriptor cache", () => {
    it("should not call micromatch multiple times for the same entity", () => {
      matcher.describeEntity("/project/src/components/Button.tsx");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeEntity("/project/src/components/Button.tsx");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should not call micromatch when only source changes for same file path due to element and file caches", () => {
      matcher.describeEntity("/project/src/components/Button.tsx");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeEntity("/project/src/components/Button.tsx", "react");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call micromatch for entities with different file paths", () => {
      matcher.describeEntity("/project/src/components/Button.tsx");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeEntity("/project/src/services/payment/PaymentService.ts");

      expect(micromatchSpy).toHaveBeenCalled();
    });

    it("should not call micromatch again after clearing the matcher cache, because the global cache is still populated", () => {
      matcher.describeEntity("/project/src/components/Button.tsx");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.clearCache();

      matcher.describeEntity("/project/src/components/Button.tsx");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call micromatch again after clearing the cache in the elements instance", () => {
      matcher.describeEntity("/project/src/components/Button.tsx");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      elements.clearCache();

      matcher.describeEntity("/project/src/components/Button.tsx");

      expect(micromatchSpy).toHaveBeenCalled();
    });

    it("should not call micromatch again after filling the cache with serialized data", () => {
      matcher.describeEntity("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      const serializedCache = matcher.serializeCache();

      matcher.clearCache();

      matcher.setCacheFromSerialized(serializedCache);

      matcher.describeEntity("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should not call micromatch again after filling the cache with serialized data in elements", () => {
      matcher.describeEntity("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      const serializedCache = elements.serializeCache();

      matcher.clearCache();

      elements.setCacheFromSerialized(serializedCache);

      matcher.describeEntity("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });
  });

  describe("entity descriptions with parent elements", () => {
    it("should include parent element descriptions in entity", () => {
      const entity = matcher.describeEntity(
        "/project/src/foo/var/modules/notification/modules/email/EmailService.ts"
      );

      expect(isEntityDescription(entity)).toBe(true);
      expect(entity.element).toEqual(
        expect.objectContaining({
          types: null,
          category: "business-logic",
          path: "/project/src/foo/var/modules/notification/modules/email",
          parents: [
            {
              types: null,
              captured: null,
              category: "business-logic",
              path: "/project/src/foo/var/modules/notification",
            },
            {
              types: ["foo"],
              captured: null,
              category: null,
              path: "/project/src/foo/var",
            },
          ],
          isUnknown: false,
        })
      );
      expect(entity.file).toEqual(
        expect.objectContaining({
          categories: ["ts-file"],
          isUnknown: false,
        })
      );
      expect(entity.module).toEqual({
        origin: "local",
        source: null,
        internalPath: null,
      });
    });
  });

  describe("entity descriptions with rootPath", () => {
    it("should match entities inside rootPath with relative patterns", () => {
      const elementsWithRoot = new Elements({
        rootPath: "/monorepo/packages/app",
      });
      const matcherWithRoot = elementsWithRoot.getMatcher({
        elements: [
          {
            type: "component",
            pattern: "src/components/*.tsx",
            mode: "file",
            capture: ["componentName"],
          },
        ],
        files: [
          {
            pattern: "**/*.tsx",
            category: "tsx-file",
          },
        ],
      });

      const entity = matcherWithRoot.describeEntity(
        "/monorepo/packages/app/src/components/Button.tsx"
      );

      expect(isEntityDescription(entity)).toBe(true);
      expect(entity.element).toEqual(
        expect.objectContaining({
          types: ["component"],
          captured: { componentName: "Button" },
          isUnknown: false,
        })
      );
      expect(entity.file).toEqual(
        expect.objectContaining({
          categories: ["tsx-file"],
          isUnknown: false,
        })
      );
      expect(entity.module).toEqual({
        origin: "local",
        source: null,
        internalPath: null,
      });
    });

    it("should not match entities outside rootPath with full mode patterns", () => {
      const elementsWithRoot = new Elements({
        rootPath: "/monorepo/packages/app",
      });
      const matcherWithRoot = elementsWithRoot.getMatcher({
        elements: [
          {
            type: "component",
            pattern: "src/components/**/*.tsx",
            mode: "full",
          },
        ],
      });

      const entity = matcherWithRoot.describeEntity(
        "/monorepo/packages/shared/src/components/Button.tsx"
      );

      expect(entity.element).toEqual(
        expect.objectContaining({
          types: null,
          isUnknown: true,
        })
      );
    });
  });
});
