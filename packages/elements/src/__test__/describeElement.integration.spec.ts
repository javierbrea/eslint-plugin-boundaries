import micromatch from "micromatch";

import type { Matcher } from "../index";
import {
  Elements,
  isIgnoredElementDescription,
  isKnownElementDescription,
  isUnknownElementDescription,
  isElementDescription,
} from "../index";

describe("describeElement | Integration", () => {
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
    });
  });

  afterEach(() => {
    elements.clearCache();
  });

  describe("configuration options", () => {
    it("should ignore files based on ignorePaths", () => {
      const element = matcher.describeElement(
        "/project/src/utils/__tests__/testUtil.ts"
      );

      expect(element).toEqual(expect.objectContaining({ isIgnored: true }));
      expect(isIgnoredElementDescription(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should not include elements not included in includePaths", () => {
      const element = matcher.describeElement("/project/foo/utils/testUtil.ts");

      expect(element).toEqual(expect.objectContaining({ isIgnored: true }));
      expect(isIgnoredElementDescription(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should exclude files when only ignorePaths is provided", () => {
      const otherDescriptors = elements.getMatcher(
        {
          elements: [
            {
              type: "component",
              pattern: "/project/src/components/*.tsx",
              mode: "file",
              capture: ["fileName"],
            },
          ],
        },
        {
          ignorePaths: ["**/src/**/*.tsx"],
        }
      );

      const element = otherDescriptors.describeElement(
        "/project/src/components/Button.tsx"
      );

      expect(element).toEqual(expect.objectContaining({ isIgnored: true }));
      expect(isIgnoredElementDescription(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should throw an error for invalid descriptors", () => {
      expect(() =>
        elements.getMatcher(
          {
            elements: [
              {
                type: "component",
                pattern: "/project/src/components/*.tsx",
                mode: "file",
                capture: ["fileName"],
              },
              {
                pattern: "/project/src/components/*.tsx",
                mode: "file",
                capture: ["fileName"],
              },
            ],
          },
          {
            ignorePaths: ["**/src/**/*.tsx"],
          }
        )
      ).toThrow(
        "Element descriptor at index 1 must have a pattern, and either a 'type' or 'category' defined."
      );
    });

    it("should not include files when includePaths do not match", () => {
      const otherDescriptors = elements.getMatcher(
        {
          elements: [
            {
              type: "component",
              pattern: "/project/src/components/*.tsx",
              mode: "file",
              capture: ["fileName"],
            },
          ],
        },
        {
          includePaths: ["**/src/**/*.md"],
        }
      );

      const element = otherDescriptors.describeElement(
        "/project/src/components/Button.tsx"
      );

      expect(element).toEqual(expect.objectContaining({ isIgnored: true }));
      expect(isIgnoredElementDescription(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should include every file by default", () => {
      const otherDescriptors = elements.getMatcher(
        {
          elements: [
            {
              type: "component",
              category: "react",
              pattern: "/project/src/components/*.tsx",
              mode: "file",
              capture: ["fileName"],
            },
          ],
        },
        {}
      );

      const element = otherDescriptors.describeElement(
        "/project/src/components/Button.tsx"
      );

      expect(element).toEqual({
        types: ["component"],
        category: "react",
        captured: {
          fileName: "Button",
        },
        filePath: "/project/src/components/Button.tsx",
        fileInternalPath: "Button.tsx",
        parents: [],
        isIgnored: false,
        isUnknown: false,
        path: "/project/src/components/Button.tsx",
      });
      expect(isKnownElementDescription(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });
  });

  describe("element descriptions", () => {
    it("should return unknown elements when no path is provided", () => {
      // @ts-expect-error Testing no path provided
      const element = matcher.describeElement();

      expect(isUnknownElementDescription(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to local elements correctly", () => {
      const element = matcher.describeElement(
        "/project/src/components/Button.tsx"
      );

      expect(element).toEqual({
        types: ["component"],
        category: "react",
        captured: {
          fileName: "Button",
        },
        filePath: "/project/src/components/Button.tsx",
        fileInternalPath: "Button.tsx",
        parents: [],
        isIgnored: false,
        isUnknown: false,
        path: "/project/src/components/Button.tsx",
      });
      expect(isKnownElementDescription(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to local elements with basePattern correctly", () => {
      const element = matcher.describeElement(
        "/project/src/utils/math/math.test.ts"
      );

      expect(element).toEqual({
        types: ["test"],
        category: "business-logic",
        captured: {
          elementName: "math",
          testFileName: "math",
          businessLogicArea: "utils",
          root: "/project",
        },
        isUnknown: false,
        isIgnored: false,
        filePath: "/project/src/utils/math/math.test.ts",
        fileInternalPath: "math.test.ts",
        parents: [],
        path: "/project/src/utils/math/math.test.ts",
      });

      expect(isKnownElementDescription(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptors without capture properties correctly", () => {
      const element = matcher.describeElement(
        "/project/src/modules/user/foo.ts"
      );

      expect(element).toEqual({
        types: null,
        category: "business-logic",
        captured: null,
        path: "/project/src/modules/user",
        filePath: "/project/src/modules/user/foo.ts",
        fileInternalPath: "foo.ts",
        parents: [],
        isIgnored: false,
        isUnknown: false,
      });
      expect(isKnownElementDescription(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to local elements in full mode correctly", () => {
      const element = matcher.describeElement(
        "/project/src/services/payment/PaymentService.ts"
      );

      expect(element).toEqual({
        types: ["service"],
        category: null,
        captured: {
          baseFolder: "/project",
          serviceName: "payment",
          serviceFileName: "PaymentService",
        },
        filePath: "/project/src/services/payment/PaymentService.ts",
        path: "/project/src/services/payment/PaymentService.ts",
        fileInternalPath: "PaymentService.ts",
        parents: [],
        isIgnored: false,
        isUnknown: false,
      });
      expect(isKnownElementDescription(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign unknown local element description when no descriptor matches", () => {
      const element = matcher.describeElement("/project/src/misc/other.ts");

      expect(element).toEqual({
        types: null,
        category: null,
        captured: null,
        filePath: null,
        fileInternalPath: null,
        parents: [],
        path: null,
        isIgnored: false,
        isUnknown: true,
      });
      expect(isUnknownElementDescription(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should not assign category when not specified in the descriptor", () => {
      const element = matcher.describeElement(
        "/project/src/utils/math/mathUtil.ts"
      );

      expect(element).toEqual({
        types: ["utility"],
        category: null,
        captured: null,
        isIgnored: false,
        filePath: "/project/src/utils/math/mathUtil.ts",
        fileInternalPath: "mathUtil.ts",
        parents: [],
        path: "/project/src/utils/math/mathUtil.ts",
        isUnknown: false,
      });
      expect(isKnownElementDescription(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to local elements using captured parent folders", () => {
      const element = matcher.describeElement(
        "/project/src/foo/var/modules/notification/modules/email/EmailService.ts"
      );

      expect(element).toEqual({
        types: null,
        category: "business-logic",
        captured: null,
        isIgnored: false,
        filePath:
          "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
        fileInternalPath: "EmailService.ts",
        path: "/project/src/foo/var/modules/notification/modules/email",
        isUnknown: false,
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
      });
      expect(isKnownElementDescription(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });
  });

  describe("elements descriptor cache", () => {
    it("should not call micromatch multiple times for the same element", () => {
      matcher.describeElement("/project/src/components/Button.tsx");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeElement("/project/src/components/Button.tsx");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call micromatch multiple times for the same element if cache is disabled", () => {
      matcher = elements.getMatcher(
        {
          elements: [
            { type: "utility", pattern: "src/utils/**/*.ts", mode: "file" },
          ],
        },
        {
          cache: false,
        }
      );
      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();
    });

    it("should not call micromatch again after clearing the matcher cache, because the global cache is still populated", () => {
      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();

      matcher.clearCache();

      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call micromatch again after clearing the cache in the elements instance", () => {
      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();
    });

    it("should not call micromatch again after filling the cache with serialized data", () => {
      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();

      const serializedCache = matcher.serializeCache();

      matcher.clearCache();

      matcher.setCacheFromSerialized(serializedCache);

      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should not call micromatch again after filling the cache with serialized data in elements", () => {
      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();

      const serializedCache = elements.serializeCache();

      matcher.clearCache();

      elements.setCacheFromSerialized(serializedCache);

      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });
  });

  describe("pattern matching with rootPath", () => {
    describe("file mode", () => {
      it("should match files inside rootPath with relative patterns", () => {
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
        });

        const element = matcherWithRoot.describeElement(
          "/monorepo/packages/app/src/components/Button.tsx"
        );

        expect(element).toEqual(
          expect.objectContaining({
            types: ["component"],
            captured: { componentName: "Button" },
            isUnknown: false,
          })
        );
      });

      it("should match files with right-to-left evaluation even with partial path match", () => {
        const elementsWithRoot = new Elements({
          rootPath: "/monorepo/packages/app",
        });
        const matcherWithRoot = elementsWithRoot.getMatcher({
          elements: [
            {
              type: "model",
              pattern: "*.model.ts",
              mode: "file",
            },
          ],
        });

        // Right-to-left matching should match the filename pattern
        const element = matcherWithRoot.describeElement(
          "/monorepo/packages/app/src/domain/user.model.ts"
        );

        expect(element).toEqual(
          expect.objectContaining({
            types: ["model"],
            isUnknown: false,
          })
        );
      });
    });

    describe("folder mode", () => {
      it("should match folders inside rootPath with relative patterns", () => {
        const elementsWithRoot = new Elements({
          rootPath: "/monorepo/packages/api",
        });
        const matcherWithRoot = elementsWithRoot.getMatcher({
          elements: [
            {
              type: "service",
              pattern: "src/services/*",
              mode: "folder",
              capture: ["serviceName"],
            },
          ],
        });

        const element = matcherWithRoot.describeElement(
          "/monorepo/packages/api/src/services/auth/AuthService.ts"
        );

        expect(element).toEqual(
          expect.objectContaining({
            types: ["service"],
            captured: { serviceName: "auth" },
            path: "src/services/auth",
            filePath: "src/services/auth/AuthService.ts",
            fileInternalPath: "AuthService.ts",
            isUnknown: false,
          })
        );
      });

      it("should match folders with right-to-left evaluation", () => {
        const elementsWithRoot = new Elements({
          rootPath: "/monorepo/apps/web",
        });
        const matcherWithRoot = elementsWithRoot.getMatcher({
          elements: [
            {
              type: "module",
              pattern: "modules/*",
              mode: "folder",
              capture: ["moduleName"],
            },
          ],
        });

        // Should match even if full path is src/features/modules/auth
        const element = matcherWithRoot.describeElement(
          "/monorepo/apps/web/src/features/modules/billing/index.ts"
        );

        expect(element).toEqual(
          expect.objectContaining({
            types: ["module"],
            captured: { moduleName: "billing" },
            isUnknown: false,
          })
        );
      });
    });

    describe("full mode", () => {
      it("should require complete path match from rootPath for files inside", () => {
        const elementsWithRoot = new Elements({
          rootPath: "/monorepo/packages/lib",
        });
        const matcherWithRoot = elementsWithRoot.getMatcher({
          elements: [
            {
              type: "helper",
              pattern: "src/helpers/**/*.ts",
              mode: "full",
            },
          ],
        });

        const element = matcherWithRoot.describeElement(
          "/monorepo/packages/lib/src/helpers/math/sum.ts"
        );

        expect(element).toEqual(
          expect.objectContaining({
            types: ["helper"],
            isUnknown: false,
          })
        );
      });

      it("should not match files with partial path in full mode", () => {
        const elementsWithRoot = new Elements({
          rootPath: "/monorepo/packages/lib",
        });
        const matcherWithRoot = elementsWithRoot.getMatcher({
          elements: [
            {
              type: "helper",
              pattern: "helpers/*.ts",
              mode: "full",
            },
          ],
        });

        // This won't match because in full mode it needs src/helpers/*.ts
        const element = matcherWithRoot.describeElement(
          "/monorepo/packages/lib/src/helpers/sum.ts"
        );

        expect(element).toEqual(
          expect.objectContaining({
            types: null,
            isUnknown: true,
          })
        );
      });

      it("should not match files outside rootPath with relative patterns", () => {
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

        // File outside rootPath - keeps absolute path, won't match relative pattern
        const element = matcherWithRoot.describeElement(
          "/monorepo/packages/shared/src/components/Button.tsx"
        );

        expect(element).toEqual(
          expect.objectContaining({
            types: null,
            isUnknown: true,
          })
        );
      });
    });

    describe("files outside rootPath", () => {
      it("should match files outside rootPath in file mode", () => {
        const elementsWithRoot = new Elements({
          rootPath: "/monorepo/packages/app",
        });
        const matcherWithRoot = elementsWithRoot.getMatcher({
          elements: [
            {
              type: "shared",
              pattern: "*.util.ts",
              mode: "file",
            },
          ],
        });

        // File outside rootPath - right-to-left matching still works
        const element = matcherWithRoot.describeElement(
          "/monorepo/packages/shared/src/utils/format.util.ts"
        );

        expect(element).toEqual(
          expect.objectContaining({
            types: ["shared"],
            path: "/monorepo/packages/shared/src/utils/format.util.ts",
            isUnknown: false,
          })
        );
      });

      it("should match files outside rootPath in folder mode", () => {
        const elementsWithRoot = new Elements({
          rootPath: "/monorepo/apps/web",
        });
        const matcherWithRoot = elementsWithRoot.getMatcher({
          elements: [
            {
              type: "package",
              pattern: "packages/*",
              mode: "folder",
              capture: ["packageName"],
            },
          ],
        });

        // File outside rootPath - right-to-left matching can still work
        const element = matcherWithRoot.describeElement(
          "/monorepo/packages/utils/src/index.ts"
        );

        expect(element).toEqual(
          expect.objectContaining({
            types: ["package"],
            captured: { packageName: "utils" },
            isUnknown: false,
          })
        );
      });
    });
  });
});
