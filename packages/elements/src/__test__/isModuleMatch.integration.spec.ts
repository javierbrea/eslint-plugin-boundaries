/* eslint-disable jest/no-conditional-in-test */

import micromatch from "micromatch";

import type {
  ModuleSingleSelector,
  ModuleSelector,
  EntityMatcherOptions,
  Matcher,
} from "../index";
import { normalizeModuleSelector, Elements } from "../index";

describe("isModuleMatch | Integration", () => {
  let matcher: Matcher;
  let elements: Elements;
  let micromatchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    micromatchSpy = jest.spyOn(micromatch, "isMatch");

    elements = new Elements();
    matcher = elements.getMatcher({
      elements: [{ type: "component", pattern: "src/components" }],
      files: [{ pattern: "**/*.tsx", category: "react" }],
    });
  });

  afterEach(() => {
    elements.clearCache();
  });

  describe("when matching modules using module selectors", () => {
    // eslint-disable-next-line jest/prefer-ending-with-an-expect
    it.each([
      // Local file — origin tests
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { origin: "local" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { origin: "external" },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { origin: "core" },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { origin: ["local", "external"] },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { origin: ["external", "core"] },
        expected: false,
      },
      // Local file — source and internalPath are null
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { source: null },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { internalPath: null },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { origin: "local", source: null, internalPath: null },
        expected: true,
      },
      // External module (via node_modules path) — origin tests
      {
        filePath: "/project/node_modules/react/index.js",
        source: "react",
        selector: { origin: "external" },
        expected: true,
      },
      {
        filePath: "/project/node_modules/react/index.js",
        source: "react",
        selector: { origin: "local" },
        expected: false,
      },
      {
        filePath: "/project/node_modules/react/index.js",
        source: "react",
        selector: { origin: "core" },
        expected: false,
      },
      // External module — source tests
      {
        filePath: "/project/node_modules/react/index.js",
        source: "react",
        selector: { source: "react" },
        expected: true,
      },
      {
        filePath: "/project/node_modules/react/index.js",
        source: "react",
        selector: { source: "lodash" },
        expected: false,
      },
      {
        filePath: "/project/node_modules/react/index.js",
        source: "react",
        selector: { source: ["react", "lodash"] },
        expected: true,
      },
      {
        filePath: "/project/node_modules/react/index.js",
        source: "react",
        selector: { source: ["lodash", "vue"] },
        expected: false,
      },
      // External module — combined origin and source
      {
        filePath: "/project/node_modules/react/index.js",
        source: "react",
        selector: { origin: "external", source: "react" },
        expected: true,
      },
      {
        filePath: "/project/node_modules/react/index.js",
        source: "react",
        selector: { origin: "external", source: "lodash" },
        expected: false,
      },
      {
        filePath: "/project/node_modules/react/index.js",
        source: "react",
        selector: { origin: "local", source: "react" },
        expected: false,
      },
      // External module with internalPath (e.g. lodash/fp)
      {
        filePath: "/project/node_modules/lodash/fp.js",
        source: "lodash/fp",
        selector: { internalPath: "fp" },
        expected: true,
      },
      {
        filePath: "/project/node_modules/lodash/fp.js",
        source: "lodash/fp",
        selector: { internalPath: "utils" },
        expected: false,
      },
      {
        filePath: "/project/node_modules/lodash/fp.js",
        source: "lodash/fp",
        selector: { source: "lodash", internalPath: "fp" },
        expected: true,
      },
      {
        filePath: "/project/node_modules/lodash/fp.js",
        source: "lodash/fp",
        selector: { internalPath: null },
        expected: false,
      },
      // Scoped external package
      {
        filePath: "/project/node_modules/@scope/pkg/index.js",
        source: "@scope/pkg",
        selector: { source: "@scope/pkg" },
        expected: true,
      },
      {
        filePath: "/project/node_modules/@scope/pkg/index.js",
        source: "@scope/pkg",
        selector: { source: "@other/pkg" },
        expected: false,
      },
      // Core module
      {
        filePath: "/project/src/components/Button.tsx",
        source: "fs",
        selector: { origin: "core" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        source: "fs",
        selector: { origin: "local" },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        source: "fs",
        selector: { origin: "external" },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        source: "fs",
        selector: { source: "fs" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        source: "fs",
        selector: { source: "path" },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        source: "fs",
        selector: { internalPath: null },
        expected: true,
      },
      // Core module with internal path (e.g. fs/promises)
      {
        filePath: "/project/src/components/Button.tsx",
        source: "fs/promises",
        selector: { origin: "core", internalPath: "promises" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        source: "fs/promises",
        selector: { internalPath: "promises" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        source: "fs/promises",
        selector: { internalPath: "streams" },
        expected: false,
      },
      // node: prefix for core modules
      {
        filePath: "/project/src/components/Button.tsx",
        source: "node:path",
        selector: { origin: "core" },
        expected: true,
      },
      // Template tests — {{ origin.origin }}
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { origin: "{{ origin.origin }}" },
        expected: true,
      },
      {
        filePath: "/project/node_modules/react/index.js",
        source: "react",
        selector: { origin: "{{ origin.origin }}" },
        expected: true,
      },
      // Template tests — {{ origin.source }}
      {
        filePath: "/project/node_modules/react/index.js",
        source: "react",
        selector: { source: "{{ origin.source }}" },
        expected: true,
      },
      {
        filePath: "/project/node_modules/lodash/fp.js",
        source: "lodash/fp",
        selector: {
          source: "{{ origin.source }}",
          internalPath: "{{ origin.internalPath }}",
        },
        expected: true,
      },
      // extraTemplateData tests
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { origin: "{{ foo }}" },
        expected: true,
        extraTemplateData: { foo: "local" },
      },
      {
        filePath: "/project/node_modules/react/index.js",
        source: "react",
        selector: { source: "{{ foo }}" },
        expected: true,
        extraTemplateData: { foo: "react" },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { origin: "{{ foo }}" },
        expected: false,
      },
      // Array selectors — OR logic, first match wins
      {
        filePath: "/project/src/components/Button.tsx",
        selector: [{ origin: "external" }, { origin: "local" }],
        expected: true,
        expectedMatch: { origin: "local" },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: [{ origin: "external" }, { origin: "core" }],
        expected: false,
      },
      {
        filePath: "/project/node_modules/react/index.js",
        source: "react",
        selector: [{ source: "lodash" }, { source: "react" }],
        expected: true,
        expectedMatch: { source: "react" },
      },
    ])(
      "should return $expected when checking if $filePath (source: $source) matches the selector $selector",
      ({
        filePath,
        source,
        expected,
        selector,
        extraTemplateData,
        expectedMatch,
      }: {
        filePath: string;
        source?: string;
        expected: boolean;
        selector: ModuleSelector;
        extraTemplateData?: Record<string, unknown>;
        expectedMatch?: ModuleSingleSelector;
      }) => {
        const options: EntityMatcherOptions = {};
        if (source) {
          options.source = source;
        }
        if (extraTemplateData) {
          options.extraTemplateData = extraTemplateData;
        }

        const matchResult = matcher.isModuleMatch(
          filePath,
          selector,
          Object.keys(options).length > 0 ? options : undefined
        );

        const convertedSelector = normalizeModuleSelector(selector);

        if (matchResult !== expected) {
          console.error(
            "Mismatch on:",
            JSON.stringify(
              {
                filePath,
                source,
                selector,
                convertedSelector,
                extraTemplateData,
                expectedMatch,
                description: matcher.describeModule(filePath, source),
              },
              null,
              2
            )
          );
        }

        expect(matchResult).toBe(expected);

        if (expected) {
          const selectorMatchingResult = matcher.getModuleSelectorMatching(
            filePath,
            selector,
            Object.keys(options).length > 0 ? options : undefined
          );

          const convertedMatchingResult = selectorMatchingResult
            ? normalizeModuleSelector(selectorMatchingResult)
            : null;

          const convertedExpectedSelector = normalizeModuleSelector(
            expectedMatch || selector
          );

          // eslint-disable-next-line jest/no-conditional-expect
          expect(convertedMatchingResult).toStrictEqual(
            convertedExpectedSelector
          );
        }
      }
    );

    it("should throw an error when using invalid selector", () => {
      const invalidSelector = { foo: "var" } as unknown as ModuleSelector;

      expect(() =>
        matcher.getModuleSelectorMatchingDescription(
          matcher.describeModule("/project/src/components/Button.tsx"),
          invalidSelector
        )
      ).toThrow();
    });

    it("should throw an error when using invalid selector in isModuleMatch", () => {
      const invalidSelector = { foo: "var" } as unknown as ModuleSelector;

      expect(() =>
        matcher.isModuleMatch(
          "/project/src/components/Button.tsx",
          invalidSelector
        )
      ).toThrow();
    });

    it("should match using module selector for local file", () => {
      const result = matcher.isModuleMatch(
        "/project/src/components/Button.tsx",
        { origin: "local" }
      );

      expect(result).toBe(true);
    });

    it("should match using module selector for external module", () => {
      const result = matcher.isModuleMatch(
        "/project/node_modules/react/index.js",
        { origin: "external" },
        { source: "react" }
      );

      expect(result).toBe(true);
    });

    it("should match using module selector for core module", () => {
      const result = matcher.isModuleMatch(
        "/project/src/components/Button.tsx",
        { origin: "core" },
        { source: "fs" }
      );

      expect(result).toBe(true);
    });

    it("should match using module selector with template", () => {
      const result = matcher.isModuleMatch(
        "/project/src/components/Button.tsx",
        { origin: "{{ origin.origin }}" }
      );

      expect(result).toBe(true);
    });

    it("should match using module selectors array", () => {
      const result = matcher.isModuleMatch(
        "/project/src/components/Button.tsx",
        [{ origin: "external" }, { origin: "local" }]
      );

      expect(result).toBe(true);
    });

    it("should not call to micromatch after matching with same options", () => {
      const result = matcher.isModuleMatch(
        "/project/src/components/Button.tsx",
        { origin: "local" }
      );

      expect(micromatchSpy).toHaveBeenCalled();
      expect(result).toBe(true);

      micromatchSpy.mockClear();

      const result2 = matcher.isModuleMatch(
        "/project/src/components/Button.tsx",
        { origin: "local" }
      );

      expect(result2).toBe(true);
      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call again to micromatch after clearing cache", () => {
      matcher.isModuleMatch("/project/src/components/Button.tsx", {
        origin: "local",
      });

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.isModuleMatch("/project/src/components/Button.tsx", {
        origin: "local",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      matcher.isModuleMatch("/project/src/components/Button.tsx", {
        origin: "local",
      });

      expect(micromatchSpy).toHaveBeenCalled();
    });
  });
});
