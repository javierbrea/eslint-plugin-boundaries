import { Elements } from "../../src/index";
import type { Matcher } from "../../src/index";

describe("FlagAsExternal configuration", () => {
  let elements: Elements;
  let matcher: Matcher;

  afterEach(() => {
    elements?.clearCache();
  });

  describe("default behavior (backward compatibility)", () => {
    beforeEach(() => {
      elements = new Elements();
      matcher = elements.getMatcher([
        { type: "component", pattern: "src/components/*.ts" },
      ]);
    });

    it("should categorize unresolvable non-relative imports as external by default", () => {
      const dependency = matcher.describeDependency({
        from: "/project/src/components/App.ts",
        source: "some-unresolved-module",
        kind: "value",
      });

      expect(dependency.to.origin).toBe("external");
    });

    it("should categorize node_modules paths as external by default", () => {
      const dependency = matcher.describeDependency({
        from: "/project/src/components/App.ts",
        source: "lodash",
        to: "/project/node_modules/lodash/index.js",
        kind: "value",
      });

      expect(dependency.to.origin).toBe("external");
    });

    it("should not categorize paths outside rootPath as external by default", () => {
      elements = new Elements({ rootPath: "/project/packages/app" });
      matcher = elements.getMatcher([
        { type: "component", pattern: "**/*.ts" },
      ]);

      const dependency = matcher.describeDependency({
        from: "/project/packages/app/src/components/App.ts",
        source: "./relative",
        to: "/project/packages/shared/index.ts",
        kind: "value",
      });

      // Should be local since outsideRootPath is false by default and source is relative
      expect(dependency.to.origin).toBe("local");
    });

    it("should not match custom source patterns by default", () => {
      const dependency = matcher.describeDependency({
        from: "/project/src/components/App.ts",
        source: "./relative",
        to: "/project/packages/package/index.ts",
        kind: "value",
      });

      expect(dependency.to.origin).toBe("local");
    });
  });

  describe("unresolvableAlias option", () => {
    it("should categorize unresolvable imports as external when true", () => {
      elements = new Elements({
        flagAsExternal: { unresolvableAlias: true },
      });
      matcher = elements.getMatcher([
        { type: "component", pattern: "src/components/*.ts" },
      ]);

      const dependency = matcher.describeDependency({
        from: "/project/src/components/App.ts",
        source: "unresolved-package",
        kind: "value",
      });

      expect(dependency.to.origin).toBe("external");
    });

    it("should not categorize unresolvable imports as external when false", () => {
      elements = new Elements({
        flagAsExternal: { unresolvableAlias: false },
      });
      matcher = elements.getMatcher([
        { type: "component", pattern: "src/components/*.ts" },
      ]);

      const dependency = matcher.describeDependency({
        from: "/project/src/components/App.ts",
        source: "unresolved-package",
        kind: "value",
      });

      expect(dependency.to.origin).toBe("local");
      expect(dependency.to.isUnknown).toBe(true);
    });

    it("should not affect relative imports", () => {
      elements = new Elements({
        flagAsExternal: { unresolvableAlias: true },
      });
      matcher = elements.getMatcher([
        { type: "component", pattern: "src/components/*.ts" },
      ]);

      const dependency = matcher.describeDependency({
        from: "/project/src/components/App.ts",
        source: "./Button",
        kind: "value",
      });

      expect(dependency.to.origin).toBe("local");
    });
  });

  describe("inNodeModules option", () => {
    it("should categorize node_modules paths as external when true", () => {
      elements = new Elements({
        flagAsExternal: { inNodeModules: true },
      });
      matcher = elements.getMatcher([
        { type: "component", pattern: "src/components/*.ts" },
      ]);

      const dependency = matcher.describeDependency({
        from: "/project/src/components/App.ts",
        source: "react",
        kind: "value",
        to: "/project/node_modules/react/index.js",
      });

      expect(dependency.to.origin).toBe("external");
    });

    it("should not categorize node_modules paths as external when false", () => {
      elements = new Elements({
        flagAsExternal: {
          inNodeModules: false,
        },
      });
      matcher = elements.getMatcher([
        { type: "component", pattern: "**/*.ts" },
      ]);

      const dependency = matcher.describeDependency({
        from: "/project/src/components/App.ts",
        source: "react",
        kind: "value",
        to: "/project/node_modules/react/index.js",
      });

      expect(dependency.to.origin).toBe("local");
    });
  });

  describe("outsideRootPath option", () => {
    it("should categorize paths outside rootPath as external when true", () => {
      elements = new Elements({
        rootPath: "/project/packages/app",
        flagAsExternal: { outsideRootPath: true },
      });
      matcher = elements.getMatcher([
        { type: "component", pattern: "src/components/*.ts" },
      ]);

      const dependency = matcher.describeDependency({
        from: "/project/packages/app/src/components/App.ts",
        source: "@myorg/shared",
        kind: "value",
        to: "/project/packages/shared/index.ts",
      });

      expect(dependency.to.origin).toBe("external");
    });

    it("should not categorize paths inside rootPath as external", () => {
      elements = new Elements({
        rootPath: "/project/packages/app",
        flagAsExternal: { outsideRootPath: true },
      });
      matcher = elements.getMatcher([
        { type: "component", pattern: "src/components/*.ts" },
        { type: "util", pattern: "src/utils/*.ts" },
      ]);

      const dependency = matcher.describeDependency({
        from: "/project/packages/app/src/components/App.ts",
        source: "../utils/helper",
        kind: "value",
        to: "/project/packages/app/src/utils/helper.ts",
      });

      expect(dependency.to.origin).toBe("local");
    });

    it("should handle Windows paths correctly", () => {
      elements = new Elements({
        rootPath: "C:\\project\\packages\\app",
        flagAsExternal: { outsideRootPath: true },
      });
      matcher = elements.getMatcher([
        { type: "component", pattern: "src/components/*.ts" },
      ]);

      const dependency = matcher.describeDependency({
        from: "C:\\project\\packages\\app\\src\\components\\App.ts",
        source: "@myorg/shared",
        kind: "value",
        to: "C:\\project\\packages\\shared\\index.ts",
      });

      expect(dependency.to.origin).toBe("external");
    });

    it("should not categorize as external when outsideRootPath is false", () => {
      elements = new Elements({
        rootPath: "/project/packages/app",
        flagAsExternal: {
          outsideRootPath: false,
          unresolvableAlias: false, // Disable to avoid categorizing non-relative as external
        },
      });
      matcher = elements.getMatcher([
        { type: "component", pattern: "**/*.ts" },
      ]);

      const dependency = matcher.describeDependency({
        from: "/project/packages/app/src/components/App.ts",
        source: "@myorg/shared",
        kind: "value",
        to: "/project/packages/shared/index.ts",
      });

      expect(dependency.to.origin).toBe("local");
    });
  });

  describe("customSourcePatterns option", () => {
    it("should categorize imports matching patterns as external", () => {
      elements = new Elements({
        flagAsExternal: {
          customSourcePatterns: ["@myorg/*", "~/**"],
        },
      });
      matcher = elements.getMatcher([
        { type: "component", pattern: "src/components/*.ts" },
      ]);

      const dependency1 = matcher.describeDependency({
        from: "/project/src/components/App.ts",
        source: "@myorg/shared",
        kind: "value",
        to: "/project/packages/shared/index.ts",
      });

      const dependency2 = matcher.describeDependency({
        from: "/project/src/components/App.ts",
        source: "~/utils/helper",
        kind: "value",
        to: "/project/utils/helper.ts",
      });

      expect(dependency1.to.origin).toBe("external");
      expect(dependency2.to.origin).toBe("external");
    });

    it("should not categorize non-matching imports as external", () => {
      elements = new Elements({
        flagAsExternal: {
          customSourcePatterns: ["@myorg/*"],
        },
      });
      matcher = elements.getMatcher([
        { type: "component", pattern: "src/components/*.ts" },
      ]);

      const dependency = matcher.describeDependency({
        from: "/project/src/components/App.ts",
        source: "@other/package",
        kind: "value",
        to: "/project/packages/other/index.ts",
      });

      expect(dependency.to.origin).toBe("local");
    });

    it("should work with empty patterns array", () => {
      elements = new Elements({
        flagAsExternal: {
          customSourcePatterns: [],
        },
      });
      matcher = elements.getMatcher([
        { type: "component", pattern: "src/components/*.ts" },
      ]);

      const dependency = matcher.describeDependency({
        from: "/project/src/components/App.ts",
        source: "@myorg/shared",
        kind: "value",
        to: "/project/packages/shared/index.ts",
      });

      expect(dependency.to.origin).toBe("local");
    });

    it("should support complex glob patterns", () => {
      elements = new Elements({
        flagAsExternal: {
          customSourcePatterns: ["@myorg/!(internal-*)", "vendor/**"],
        },
      });
      matcher = elements.getMatcher([
        { type: "component", pattern: "src/components/*.ts" },
      ]);

      const external = matcher.describeDependency({
        from: "/project/src/components/App.ts",
        source: "@myorg/shared",
        kind: "value",
        to: "/project/packages/shared/index.ts",
      });

      const local = matcher.describeDependency({
        from: "/project/src/components/App.ts",
        source: "@myorg/internal-utils",
        kind: "value",
        to: "/project/packages/internal-utils/index.ts",
      });

      expect(external.to.origin).toBe("external");
      expect(local.to.origin).toBe("local");
    });
  });

  describe("oR logic with multiple conditions", () => {
    it("should categorize as external if ANY condition is true", () => {
      elements = new Elements({
        rootPath: "/project/packages/app",
        flagAsExternal: {
          unresolvableAlias: true,
          inNodeModules: true,
          outsideRootPath: true,
          customSourcePatterns: ["@custom/*"],
        },
      });
      matcher = elements.getMatcher([
        { type: "component", pattern: "src/components/*.ts" },
      ]);

      // Matches outsideRootPath
      const dep1 = matcher.describeDependency({
        from: "/project/packages/app/src/components/App.ts",
        source: "@myorg/shared",
        kind: "value",
        to: "/project/packages/shared/index.ts",
      });

      // Matches customSourcePatterns
      const dep2 = matcher.describeDependency({
        from: "/project/packages/app/src/components/App.ts",
        source: "@custom/module",
        kind: "value",
        to: "/project/packages/app/src/custom/module.ts",
      });

      // Matches inNodeModules
      const dep3 = matcher.describeDependency({
        from: "/project/packages/app/src/components/App.ts",
        source: "lodash",
        kind: "value",
        to: "/project/node_modules/lodash/index.js",
      });

      // Matches unresolvableAlias
      const dep4 = matcher.describeDependency({
        from: "/project/packages/app/src/components/App.ts",
        source: "unresolved-package",
        kind: "value",
      });

      expect(dep1.to.origin).toBe("external");
      expect(dep2.to.origin).toBe("external");
      expect(dep3.to.origin).toBe("external");
      expect(dep4.to.origin).toBe("external");
    });

    it("should categorize as local if ALL conditions are false", () => {
      elements = new Elements({
        rootPath: "/project/packages/app",
        flagAsExternal: {
          unresolvableAlias: false,
          inNodeModules: false,
          outsideRootPath: false,
          customSourcePatterns: [],
        },
      });
      matcher = elements.getMatcher([
        { type: "component", pattern: "**/*.ts" },
      ]);

      const dependency = matcher.describeDependency({
        from: "/project/packages/app/src/components/App.ts",
        source: "some-module",
        kind: "value",
        to: "/project/node_modules/some-module/index.js",
      });

      expect(dependency.to.origin).toBe("local");
    });
  });

  describe("monorepo scenarios", () => {
    describe("scenario 1: Inter-package as external with outsideRootPath", () => {
      it("should treat dependencies outside package root as external", () => {
        elements = new Elements({
          rootPath: "/monorepo/packages/app",
          flagAsExternal: {
            outsideRootPath: true,
          },
        });
        matcher = elements.getMatcher([
          { type: "component", pattern: "src/**/*.ts" },
        ]);

        const interPackageDep = matcher.describeDependency({
          from: "/monorepo/packages/app/src/index.ts",
          source: "@monorepo/shared",
          kind: "value",
          to: "/monorepo/packages/shared/src/index.ts",
        });

        const intraPackageDep = matcher.describeDependency({
          from: "/monorepo/packages/app/src/index.ts",
          source: "./utils",
          kind: "value",
          to: "/monorepo/packages/app/src/utils.ts",
        });

        expect(interPackageDep.to.origin).toBe("external");
        expect(intraPackageDep.to.origin).toBe("local");
      });
    });

    describe("scenario 2: Inter-package as external with customSourcePatterns", () => {
      it("should treat imports matching monorepo patterns as external", () => {
        elements = new Elements({
          rootPath: "/monorepo",
          flagAsExternal: {
            customSourcePatterns: ["@monorepo/*"],
          },
        });
        matcher = elements.getMatcher([
          { type: "component", pattern: "packages/*/src/**/*.ts" },
        ]);

        const interPackageDep = matcher.describeDependency({
          from: "/monorepo/packages/app/src/index.ts",
          source: "@monorepo/shared",
          kind: "value",
          to: "/monorepo/packages/shared/src/index.ts",
        });

        const relativeDep = matcher.describeDependency({
          from: "/monorepo/packages/app/src/index.ts",
          source: "../utils/helper",
          kind: "value",
          to: "/monorepo/packages/app/utils/helper.ts",
        });

        expect(interPackageDep.to.origin).toBe("external");
        expect(relativeDep.to.origin).toBe("local");
      });
    });

    describe("scenario 3: Inter-package as local with boundary rules", () => {
      it("should treat all resolved dependencies as local for granular rules", () => {
        elements = new Elements({
          rootPath: "/monorepo",
          flagAsExternal: {
            unresolvableAlias: true,
            inNodeModules: true,
            outsideRootPath: false,
            customSourcePatterns: [],
          },
        });
        matcher = elements.getMatcher([
          { type: "app", pattern: "/monorepo/packages/app/src/*.ts" },
          { type: "shared", pattern: "/monorepo/packages/shared/src/*.ts" },
        ]);

        const interPackageDep = matcher.describeDependency({
          from: "/monorepo/packages/app/src/index.ts",
          source: "@monorepo/shared",
          kind: "value",
          to: "/monorepo/packages/shared/src/index.ts",
        });

        const npmDep = matcher.describeDependency({
          from: "/monorepo/packages/app/src/index.ts",
          source: "lodash",
          kind: "value",
          to: "/monorepo/node_modules/lodash/index.js",
        });

        // Inter-package dependencies are local (can apply boundary rules)
        expect(interPackageDep.to.origin).toBe("local");
        // npm packages are external
        expect(npmDep.to.origin).toBe("external");
      });
    });
  });

  describe("edge cases", () => {
    it("should handle missing filePath gracefully", () => {
      elements = new Elements({
        flagAsExternal: {
          outsideRootPath: true,
        },
      });
      matcher = elements.getMatcher([
        { type: "component", pattern: "src/**/*.ts" },
      ]);

      const dependency = matcher.describeDependency({
        from: "/project/src/index.ts",
        source: "unresolved",
        kind: "value",
      });

      expect(dependency.to.origin).toBe("external");
    });

    it("should handle missing rootPath gracefully", () => {
      elements = new Elements({
        flagAsExternal: {
          outsideRootPath: true,
        },
      });
      matcher = elements.getMatcher([
        { type: "component", pattern: "src/**/*.ts" },
      ]);

      const dependency = matcher.describeDependency({
        from: "/project/src/index.ts",
        source: "@myorg/shared",
        kind: "value",
        to: "/project/packages/shared/index.ts",
      });

      // Without rootPath, outsideRootPath check is skipped
      expect(dependency.to.origin).toBe("local");
    });

    it("should not categorize relative imports as external regardless of options", () => {
      elements = new Elements({
        rootPath: "/project",
        flagAsExternal: {
          unresolvableAlias: true,
          inNodeModules: true,
          outsideRootPath: true,
          customSourcePatterns: ["**"],
        },
      });
      matcher = elements.getMatcher([
        { type: "component", pattern: "src/**/*.ts" },
      ]);

      const dependency = matcher.describeDependency({
        from: "/project/src/components/App.ts",
        source: "./Button",
        kind: "value",
        to: "/project/src/components/Button.ts",
      });

      expect(dependency.to.origin).toBe("local");
    });
  });
});
