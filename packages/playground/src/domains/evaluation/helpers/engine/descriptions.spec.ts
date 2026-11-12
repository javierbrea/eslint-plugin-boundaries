import { normalizeConfig } from "@boundaries/config";
import type { SettingsNormalized } from "@boundaries/config";
import { describeDependency, describeEntity } from "@boundaries/policies";

import { toDependencyDescription, toEntityDescription } from "./descriptions";

/** A module with a component inside, a test file captured by its folder, and a folder that the settings ignore */
const SETTINGS: SettingsNormalized = normalizeConfig({
  settings: {
    "boundaries/elements": [
      { type: "module", pattern: "modules/*", capture: ["name"] },
      { type: "component", pattern: "components/*", capture: ["component"] },
    ],
    "boundaries/files": [
      { category: "test", pattern: "**/*.spec.js", capture: ["base"] },
    ],
    "boundaries/ignore": ["**/ignored/**"],
  },
  rules: {},
}).value.settings;

const MODULE_INDEX = "src/modules/a/index.js";
const COMPONENT_SPEC = "src/modules/a/components/b/index.spec.js";

describe("Descriptions", () => {
  describe("toEntityDescription", () => {
    it("should keep every property of an element, a file and a module that a selector matches, for a file in an element with a parent", () => {
      // Arrange
      const description = describeEntity(SETTINGS, COMPONENT_SPEC);

      // Act
      const kept = toEntityDescription(description);

      // Assert
      expect(kept).toEqual({
        element: {
          types: ["component"],
          path: "src/modules/a/components/b",
          fileInternalPath: "index.spec.js",
          captured: { component: "b" },
          parents: [
            {
              types: ["module"],
              path: "src/modules/a",
              captured: { name: "a" },
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        file: {
          categories: ["test"],
          path: COMPONENT_SPEC,
          captured: { base: "src/modules/a/components/b" },
          isIgnored: false,
          isUnknown: false,
        },
        module: { origin: "local", source: null, internalPath: null },
      });
    });

    it("should leave out the path of the file of the element and the categories of the element and of its parents, which the plugin deprecates", () => {
      // Arrange
      const description = describeEntity(SETTINGS, COMPONENT_SPEC);

      // Act
      const { element } = toEntityDescription(description);

      // Assert
      expect(description.element.filePath).toBe(COMPONENT_SPEC);
      expect(description.element.parents[0]).toHaveProperty("category");
      expect(element).not.toHaveProperty("filePath");
      expect(element).not.toHaveProperty("category");
      expect(element.parents[0]).not.toHaveProperty("category");
    });

    it("should describe a file that no descriptor matches as unknown, with nothing of an element and nothing of a file", () => {
      // Act
      const kept = toEntityDescription(
        describeEntity(SETTINGS, "src/index.js")
      );

      // Assert
      expect(kept).toEqual({
        element: {
          types: null,
          path: null,
          fileInternalPath: null,
          captured: null,
          parents: [],
          isIgnored: false,
          isUnknown: true,
        },
        file: {
          categories: null,
          path: "src/index.js",
          captured: null,
          isIgnored: false,
          isUnknown: true,
        },
        module: { origin: "local", source: null, internalPath: null },
      });
    });

    it("should say that a file the settings ignore is ignored, in its element and in its file", () => {
      // Act
      const kept = toEntityDescription(
        describeEntity(SETTINGS, "src/ignored/x.js")
      );

      // Assert
      expect(kept.element).toEqual({
        types: null,
        path: "src/ignored/x.js",
        fileInternalPath: null,
        captured: null,
        parents: [],
        isIgnored: true,
        isUnknown: true,
      });
      expect(kept.file).toEqual({
        categories: null,
        path: "src/ignored/x.js",
        captured: null,
        isIgnored: true,
        isUnknown: true,
      });
    });

    it("should keep the base and the internal path of an external module, and no path of a file", () => {
      // Arrange
      const { to } = describeDependency(SETTINGS, {
        from: MODULE_INDEX,
        source: "react/jsx-runtime",
        kind: "value",
      });

      // Act
      const kept = toEntityDescription(to);

      // Assert
      expect(kept).toEqual({
        element: {
          types: null,
          path: null,
          fileInternalPath: null,
          captured: null,
          parents: [],
          isIgnored: false,
          isUnknown: true,
        },
        file: {
          categories: null,
          path: null,
          captured: null,
          isIgnored: false,
          isUnknown: true,
        },
        module: {
          origin: "external",
          source: "react",
          internalPath: "jsx-runtime",
        },
      });
    });

    it("should say that a built-in module of Node.js is core", () => {
      // Arrange
      const { to } = describeDependency(SETTINGS, {
        from: MODULE_INDEX,
        source: "node:fs",
        kind: "value",
      });

      // Act
      const { module: moduleDescription } = toEntityDescription(to);

      // Assert
      expect(moduleDescription).toEqual({
        origin: "core",
        source: "node:fs",
        internalPath: null,
      });
    });
  });

  describe("toDependencyDescription", () => {
    it("should keep what the dependency points to and the dependency itself, with its relationship from both sides", () => {
      // Arrange
      const description = describeDependency(SETTINGS, {
        from: MODULE_INDEX,
        to: COMPONENT_SPEC,
        source: "./components/b/index.spec.js",
        kind: "type",
        nodeKind: "export",
        specifiers: ["x"],
      });

      // Act
      const kept = toDependencyDescription(description);

      // Assert
      expect(kept).toEqual({
        to: toEntityDescription(description.to),
        dependency: {
          kind: "type",
          nodeKind: "export",
          source: "./components/b/index.spec.js",
          specifiers: ["x"],
          relationship: { from: "parent", to: "child" },
        },
      });
      expect(kept.to.element.types).toEqual(["component"]);
    });

    it("should leave out what the dependency comes from, which is the description of its file", () => {
      // Arrange
      const description = describeDependency(SETTINGS, {
        from: MODULE_INDEX,
        to: COMPONENT_SPEC,
        source: "./components/b/index.spec.js",
        kind: "value",
      });

      // Act
      const kept = toDependencyDescription(description);

      // Assert
      expect(description).toHaveProperty("from");
      expect(kept).not.toHaveProperty("from");
    });

    it("should keep no node kind and no specifiers when the plugin is given none, and no relationship when the elements are not related", () => {
      // Arrange
      const description = describeDependency(SETTINGS, {
        from: MODULE_INDEX,
        source: "react",
        kind: "value",
      });

      // Act
      const { dependency } = toDependencyDescription(description);

      // Assert
      expect(dependency).toEqual({
        kind: "value",
        nodeKind: null,
        source: "react",
        specifiers: null,
        relationship: { from: null, to: null },
      });
    });
  });
});
