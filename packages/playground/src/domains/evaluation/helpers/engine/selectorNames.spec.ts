import { normalizeConfig } from "@boundaries/config";
import type { DependenciesPolicyNormalized } from "@boundaries/config";

import { readSelectorNames } from "./selectorNames";

/**
 * Normalizes a policy as the engine receives it from `normalizeConfig`.
 * @param policy The policy as written in the options of the `dependencies` rule.
 * @returns The policy with its selectors normalized.
 */
function normalizePolicy(policy: unknown): DependenciesPolicyNormalized {
  const { value } = normalizeConfig({
    rules: { "boundaries/dependencies": [2, { policies: [policy] }] },
  });
  return value.rules.dependencies!.options.policies[0];
}

describe("SelectorNames", () => {
  describe("readSelectorNames", () => {
    it("should read the element types of the policies of the quick start", () => {
      // Arrange
      const component = normalizePolicy({
        from: { element: { type: "component" } },
        allow: { to: { element: { type: "helper" } } },
      });
      const moduleType = normalizePolicy({
        from: { element: { type: "module" } },
        allow: { to: { element: { types: ["component", "helper"] } } },
      });

      // Act
      const names = [component, moduleType].map(readSelectorNames);

      // Assert
      expect(names).toEqual([
        { from: ["component"], to: ["helper"] },
        { from: ["module"], to: ["component", "helper"] },
      ]);
    });

    it("should read the file categories of a policy that names no element", () => {
      // Arrange
      const policy = normalizePolicy({
        disallow: { to: { file: { categories: "test" } } },
      });

      // Act
      const names = readSelectorNames(policy);

      // Assert
      expect(names).toEqual({ from: [], to: ["test"] });
    });

    it("should read the types and the categories of one selector in the order they are written", () => {
      // Arrange
      const policy = normalizePolicy({
        from: { element: { type: "page", types: ["layout"] } },
        allow: {
          to: {
            element: { types: "widget" },
            file: { categories: ["style", "image"] },
          },
        },
      });

      // Act
      const names = readSelectorNames(policy);

      // Assert
      expect(names).toEqual({
        from: ["page", "layout"],
        to: ["widget", "style", "image"],
      });
    });

    it("should read the legacy selectors of a policy", () => {
      // Arrange
      const strings = normalizePolicy({
        from: ["page", "layout"],
        allow: ["widget"],
      });
      const category = normalizePolicy({
        from: { type: "page", category: "legacy" },
        allow: [{ category: "shared" }],
      });

      // Act
      const names = [strings, category].map(readSelectorNames);

      // Assert
      expect(names).toEqual([
        { from: ["page", "layout"], to: ["widget"] },
        { from: ["page", "legacy"], to: ["shared"] },
      ]);
    });

    it("should leave out the null patterns and the selectors of other facets", () => {
      // Arrange
      const policy = normalizePolicy({
        from: { element: { type: ["page", null], path: "src/**" } },
        to: { element: { type: null }, module: { origin: "external" } },
        allow: { to: { module: { source: "react" } } },
      });

      // Act
      const names = readSelectorNames(policy);

      // Assert
      expect(names).toEqual({ from: ["page"], to: [] });
    });

    it("should read what a query asks for, and not what it excludes or a template", () => {
      // Arrange
      const policy = normalizePolicy({
        from: {
          element: {
            types: { anyOf: ["page"], allOf: ["layout"], noneOf: ["legacy"] },
          },
        },
        allow: {
          to: {
            element: {
              types: {
                equalsTo: ["widget", { expand: "{{ from.element.types }}" }],
              },
            },
            file: { categories: { anyOf: ["style"], hasLength: 1 } },
          },
        },
      });

      // Act
      const names = readSelectorNames(policy);

      // Assert
      expect(names).toEqual({
        from: ["page", "layout"],
        to: ["widget", "style"],
      });
    });

    it("should not read the types of the parents", () => {
      // Arrange
      const policy = normalizePolicy({
        from: { element: { type: "page", parent: { type: "layout" } } },
        allow: {
          to: {
            element: { type: "widget", parents: { anyOf: [{ type: "app" }] } },
          },
        },
      });

      // Act
      const names = readSelectorNames(policy);

      // Assert
      expect(names).toEqual({ from: ["page"], to: ["widget"] });
    });

    it("should read the from and the to of the dependency selectors of allow and disallow", () => {
      // Arrange
      const policy = normalizePolicy({
        allow: [
          {
            from: { element: { type: "page" } },
            to: { element: { type: "widget" } },
          },
        ],
        disallow: {
          from: { element: { type: "layout" } },
          to: { file: { categories: "test" } },
          dependency: { kind: "type" },
        },
      });

      // Act
      const names = readSelectorNames(policy);

      // Assert
      expect(names).toEqual({
        from: ["page", "layout"],
        to: ["widget", "test"],
      });
    });

    it("should name nothing for a dependency selector that has only a dependency", () => {
      // Arrange
      const policy = normalizePolicy({
        allow: { dependency: { kind: "type" } },
      });

      // Act
      const names = readSelectorNames(policy);

      // Assert
      expect(names).toEqual({ from: [], to: [] });
    });

    it("should read its own to before the ones of allow and disallow, once each", () => {
      // Arrange
      const policy = normalizePolicy({
        to: { element: { type: "widget" } },
        allow: [
          { element: { type: "layout" } },
          { element: { type: "widget" } },
        ],
        disallow: { to: { element: { type: "page" } } },
      });

      // Act
      const names = readSelectorNames(policy);

      // Assert
      expect(names).toEqual({ from: [], to: ["widget", "layout", "page"] });
    });

    it("should read its own from before the one of a dependency selector, once each", () => {
      // Arrange
      const policy = normalizePolicy({
        from: { element: { type: "page" } },
        allow: {
          from: { element: { types: ["layout", "page"] } },
          to: { element: { type: "widget" } },
        },
      });

      // Act
      const names = readSelectorNames(policy);

      // Assert
      expect(names).toEqual({ from: ["page", "layout"], to: ["widget"] });
    });
  });
});
