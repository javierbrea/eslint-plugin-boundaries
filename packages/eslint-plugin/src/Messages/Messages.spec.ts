import type {
  DependencyDescription,
  DependencySingleSelectorMatchResult,
  ElementDescription,
  EntityDescription,
} from "@boundaries/elements";

import {
  dependenciesRuleDefaultErrorMessage,
  dependenciesRuleMatchedMessage,
  elementDescriptionMessage,
} from "./Messages";

type EntityDescriptionOverrides = {
  element?: Partial<EntityDescription["element"]>;
  file?: Partial<EntityDescription["file"]>;
  module?: Partial<EntityDescription["module"]>;
};

type DependencyDescriptionOverrides = {
  from?: EntityDescriptionOverrides;
  to?: EntityDescriptionOverrides;
  dependency?: Partial<DependencyDescription["dependency"]>;
};

function createEntityDescription(
  values: EntityDescriptionOverrides
): EntityDescription {
  return {
    element: {
      path: "/repo/src/default/index.ts",
      types: ["default"],
      category: null,
      filePath: "/repo/src/default/index.ts",
      fileInternalPath: "index.ts",
      captured: null,
      parents: [],
      isIgnored: false,
      isUnknown: false,
      ...values.element,
    },
    file: {
      path: "/repo/src/default/index.ts",
      categories: ["default"],
      captured: null,
      isIgnored: false,
      isUnknown: false,
      ...values.file,
    },
    module: {
      origin: "local",
      source: null,
      internalPath: null,
      ...values.module,
    },
  };
}

function createDependencyDescription(
  values: DependencyDescriptionOverrides = {}
): DependencyDescription {
  const fromDefaults: EntityDescriptionOverrides = {
    element: {
      path: "/repo/src/components/button/index.ts",
      types: ["component"],
      category: "ui",
      filePath: "/repo/src/components/button/index.ts",
      fileInternalPath: "index.ts",
      captured: {
        family: "atoms",
      },
    },
    file: {
      path: "/repo/src/components/button/index.ts",
      categories: ["ui", "feature"],
      captured: {
        scope: "frontend",
      },
    },
    module: {
      origin: "local",
      source: null,
      internalPath: null,
    },
  };

  const toDefaults: EntityDescriptionOverrides = {
    element: {
      path: "/repo/src/helpers/fetcher.ts",
      types: ["helper"],
      category: "data",
      filePath: "/repo/src/helpers/fetcher.ts",
      fileInternalPath: "fetcher.ts",
      captured: {
        domain: "api",
      },
    },
    file: {
      path: "/repo/src/helpers/fetcher.ts",
      categories: ["shared", "data"],
      captured: {
        team: "platform",
      },
    },
    module: {
      origin: "external",
      source: "@scope/helpers",
      internalPath: null,
    },
  };

  const dependencyDefaults: DependencyDescription["dependency"] = {
    source: "@scope/helpers",
    kind: "type",
    nodeKind: "ImportDeclaration",
    specifiers: ["Fetcher", "FetcherConfig"],
    relationship: {
      from: "sibling",
      to: "sibling",
    },
  };

  return {
    from: createEntityDescription({
      element: {
        ...fromDefaults.element,
        ...values.from?.element,
      },
      file: {
        ...fromDefaults.file,
        ...values.from?.file,
      },
      module: {
        ...fromDefaults.module,
        ...values.from?.module,
      },
    }),
    to: createEntityDescription({
      element: {
        ...toDefaults.element,
        ...values.to?.element,
      },
      file: {
        ...toDefaults.file,
        ...values.to?.file,
      },
      module: {
        ...toDefaults.module,
        ...values.to?.module,
      },
    }),
    dependency: {
      ...dependencyDefaults,
      ...values.dependency,
    },
  };
}

describe("Messages", () => {
  describe("dependenciesRuleMatchedMessage", () => {
    it("builds a full entity-based message when selector matches element, file, origin and dependency", () => {
      const dependency = createDependencyDescription();
      const matchResult: DependencySingleSelectorMatchResult = {
        from: {
          element: {
            types: ["component"],
            category: "ui",
            captured: {
              family: "*",
            },
          },
          file: {
            categories: "*",
            captured: {
              scope: "*",
            },
          },
          module: {
            origin: "local",
          },
        },
        to: {
          element: {
            types: ["helper"],
            captured: {
              domain: "*",
            },
          },
          file: {
            categories: "*",
            captured: {
              team: "*",
            },
          },
          module: {
            origin: "external",
            source: "@scope/helpers",
          },
        },
        dependency: {
          source: "@scope/helpers",
          kind: "type",
          nodeKind: "ImportDeclaration",
          relationship: {
            from: "sibling",
            to: "sibling",
          },
          specifiers: "Fetcher",
        },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 2, dependency)).toBe(
        'Dependencies with source "@scope/helpers", kind "type", nodeKind "ImportDeclaration", relationship from "sibling", relationship to "sibling", module source "@scope/helpers" and specifiers "Fetcher", "FetcherConfig" to file of categories "shared", "data" and captured values: team="platform" belonging to elements of type "helper" and captured values: domain="api" are not allowed in file of categories "ui", "feature" and captured values: scope="frontend" belonging to elements of type "component", category "ui" and captured values: family="atoms" and module with origin "local". Denied by policy at index 2'
      );
    });

    it("returns the fallback message when matchResult is null", () => {
      const dependency = createDependencyDescription();

      expect(dependenciesRuleMatchedMessage(null, 5, dependency)).toBe(
        "Not able to create a message for this violation. Please report this at: https://github.com/javierbrea/eslint-plugin-boundaries/issues. Denied by policy at index 5"
      );
    });

    it("builds message with only the from selector", () => {
      const dependency = createDependencyDescription();
      const matchResult: DependencySingleSelectorMatchResult = {
        from: { element: { types: ["component"] } },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies are not allowed in elements of type "component". Denied by policy at index 1'
      );
    });

    it("builds message with only the to selector", () => {
      const dependency = createDependencyDescription();
      const matchResult: DependencySingleSelectorMatchResult = {
        to: { element: { types: ["helper"] } },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies to elements of type "helper" are not allowed. Denied by policy at index 1'
      );
    });

    it("builds message with only the dependency selector", () => {
      const dependency = createDependencyDescription();
      const matchResult: DependencySingleSelectorMatchResult = {
        dependency: { source: "@scope/helpers" },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies with source "@scope/helpers" are not allowed. Denied by policy at index 1'
      );
    });

    it("builds message with dependency and from selectors", () => {
      const dependency = createDependencyDescription();
      const matchResult: DependencySingleSelectorMatchResult = {
        from: { element: { types: ["component"] } },
        dependency: { source: "@scope/helpers" },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies with source "@scope/helpers" are not allowed in elements of type "component". Denied by policy at index 1'
      );
    });

    it("falls back to the module origin description when the to selector only targets module.origin", () => {
      const dependency = createDependencyDescription();
      const matchResult: DependencySingleSelectorMatchResult = {
        from: { element: { types: ["component"] } },
        to: { module: { origin: "external" } },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies to entities of module with origin "external" are not allowed in elements of type "component". Denied by policy at index 1'
      );
    });

    it("renders module source fragments via legacy to.module.source selector before existing specifiers", () => {
      const dependency = createDependencyDescription();
      const matchResult: DependencySingleSelectorMatchResult = {
        from: { element: { types: ["component"] } },
        to: { module: { source: "@scope/helpers" } },
        dependency: { specifiers: "Fetcher" },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies with module source "@scope/helpers" and specifiers "Fetcher", "FetcherConfig" are not allowed in elements of type "component". Denied by policy at index 1'
      );
    });

    it("renders module internalPath fragment via legacy to.module.internalPath selector", () => {
      const dependency = createDependencyDescription({
        to: {
          module: {
            origin: "external",
            source: "@scope/helpers",
            internalPath: "deep/path",
          },
        },
      });
      const matchResult: DependencySingleSelectorMatchResult = {
        from: { element: { types: ["component"] } },
        to: { module: { internalPath: "deep/*" } },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies with module internalPath "deep/path" are not allowed in elements of type "component". Denied by policy at index 1'
      );
    });

    it("renders parent element fragments when the from selector includes parent properties", () => {
      const dependency = createDependencyDescription({
        from: {
          element: {
            parents: [
              {
                types: ["module"],
                category: null,
                path: "/repo/src/components/button",
                captured: { area: "primary" },
              },
            ],
          },
        },
      });
      const matchResult: DependencySingleSelectorMatchResult = {
        from: {
          element: {
            parent: {
              types: ["module"],
              captured: { area: "*" },
            },
          },
        },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies are not allowed in elements of parent type "module" and captured values: area="primary". Denied by policy at index 1'
      );
    });

    it("renders 'parent null' when the from selector requires a parent and the element has none", () => {
      const dependency = createDependencyDescription();
      const matchResult: DependencySingleSelectorMatchResult = {
        from: {
          element: {
            parent: { types: ["module"] },
          },
        },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies are not allowed in elements of parent "null". Denied by policy at index 1'
      );
    });

    it("renders captured 'null' when selector selects captured but element captured is empty", () => {
      const dependency = createDependencyDescription({
        from: { element: { captured: {} } },
      });
      const matchResult: DependencySingleSelectorMatchResult = {
        from: { element: { captured: { family: "*" } } },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies are not allowed in elements of captured "null". Denied by policy at index 1'
      );
    });

    it("skips selected captured keys that are not present in the element captured values", () => {
      const dependency = createDependencyDescription({
        from: { element: { captured: { family: "atoms" } } },
      });
      const matchResult: DependencySingleSelectorMatchResult = {
        from: {
          element: {
            types: ["component"],
            captured: { other: "*" },
          },
        },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies are not allowed in elements of type "component". Denied by policy at index 1'
      );
    });

    it("renders generic file properties beyond categories and captured", () => {
      const dependency = createDependencyDescription();
      const matchResult: DependencySingleSelectorMatchResult = {
        from: {
          file: {
            path: "/repo/src/**",
            captured: { scope: "*" },
          } as DependencySingleSelectorMatchResult["from"] extends infer T
            ? T extends { file?: infer F }
              ? F
              : never
            : never,
        },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies are not allowed in file of path "/repo/src/components/button/index.ts" and captured values: scope="frontend". Denied by policy at index 1'
      );
    });

    it("skips file selector entirely when file selector has no usable properties", () => {
      const dependency = createDependencyDescription();
      const matchResult: DependencySingleSelectorMatchResult = {
        from: {
          element: { types: ["component"] },
          file: {},
        },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies are not allowed in elements of type "component". Denied by policy at index 1'
      );
    });

    it("renders module description through the module selector and skips unknown module keys", () => {
      const dependency = createDependencyDescription();
      const matchResult: DependencySingleSelectorMatchResult = {
        from: {
          element: { types: ["component"] },
          module: {
            origin: "local",
            // @ts-expect-error Forcing unknown module key to exercise undefined-value skip branch
            unknownKey: "value",
          },
        },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies are not allowed in elements of type "component" and module with origin "local". Denied by policy at index 1'
      );
    });

    it("omits the module fragment when the module selector has no resolvable properties", () => {
      const dependency = createDependencyDescription();
      const matchResult: DependencySingleSelectorMatchResult = {
        from: {
          element: { types: ["component"] },
          module: {
            // @ts-expect-error Forcing all keys to undefined to hit empty fragments branch
            unknownKey: "value",
          },
        },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies are not allowed in elements of type "component". Denied by policy at index 1'
      );
    });

    it("skips relationship sides without a matching value in the dependency", () => {
      const dependency = createDependencyDescription({
        dependency: {
          relationship: {
            // @ts-expect-error Forcing relationship.from to be undefined to hit relationship skip branch
            from: undefined,
            to: "sibling",
          },
        },
      });
      const matchResult: DependencySingleSelectorMatchResult = {
        dependency: {
          relationship: { from: "*", to: "*" },
        },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies with relationship to "sibling" are not allowed. Denied by policy at index 1'
      );
    });

    it("builds a message with dependency and to selectors but no from selector", () => {
      const dependency = createDependencyDescription();
      const matchResult: DependencySingleSelectorMatchResult = {
        to: { element: { types: ["helper"] } },
        dependency: { source: "@scope/helpers" },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies with source "@scope/helpers" to elements of type "helper" are not allowed. Denied by policy at index 1'
      );
    });

    it("returns null parent fragment when the parent selector targets no parent properties", () => {
      const dependency = createDependencyDescription({
        from: {
          element: {
            parents: [
              {
                types: ["module"],
                category: null,
                path: "/repo/src/components/button",
                captured: null,
              },
            ],
          },
        },
      });
      const matchResult: DependencySingleSelectorMatchResult = {
        from: {
          element: {
            types: ["component"],
            parent: {},
          },
        },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies are not allowed in elements of type "component". Denied by policy at index 1'
      );
    });

    it("skips the element selector when it has no properties", () => {
      const dependency = createDependencyDescription();
      const matchResult: DependencySingleSelectorMatchResult = {
        from: {
          element: {},
          file: { categories: "*" },
        },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies are not allowed in file of categories "ui", "feature". Denied by policy at index 1'
      );
    });

    it("returns null element fragment when only parent selector with no parent properties is provided and element has a parent", () => {
      const dependency = createDependencyDescription({
        from: {
          element: {
            parents: [
              {
                types: ["module"],
                category: null,
                path: "/repo/src/components/button",
                captured: null,
              },
            ],
          },
        },
      });
      const matchResult: DependencySingleSelectorMatchResult = {
        from: {
          element: { parent: {} },
          file: { categories: "*" },
        },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies are not allowed in file of categories "ui", "feature". Denied by policy at index 1'
      );
    });

    it("returns null file fragment when all file selector properties map to undefined values", () => {
      const dependency = createDependencyDescription();
      const matchResult: DependencySingleSelectorMatchResult = {
        from: {
          element: { types: ["component"] },
          file: {
            // @ts-expect-error Forcing unknown file key to exercise empty file fragments branch
            unknownKey: "*",
          },
        },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies are not allowed in elements of type "component". Denied by policy at index 1'
      );
    });

    it("skips the module selector when it has no properties", () => {
      const dependency = createDependencyDescription();
      const matchResult: DependencySingleSelectorMatchResult = {
        from: {
          element: { types: ["component"] },
          module: {},
        },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies are not allowed in elements of type "component". Denied by policy at index 1'
      );
    });

    it("builds a message using only the module fragment when the entity selector targets only module", () => {
      const dependency = createDependencyDescription();
      const matchResult: DependencySingleSelectorMatchResult = {
        from: {
          module: { origin: "local" },
        },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies are not allowed in module with origin "local". Denied by policy at index 1'
      );
    });

    it("skips dependency selector keys that have no matching value in the dependency info", () => {
      const dependency = createDependencyDescription();
      const matchResult: DependencySingleSelectorMatchResult = {
        dependency: {
          // @ts-expect-error Forcing unknown dependency key to exercise undefined skip branch
          unknownKey: "*",
          source: "@scope/helpers",
        },
      };

      expect(dependenciesRuleMatchedMessage(matchResult, 1, dependency)).toBe(
        'Dependencies with source "@scope/helpers" are not allowed. Denied by policy at index 1'
      );
    });
  });

  describe("elementDescriptionMessage", () => {
    function createElement(
      overrides: Partial<ElementDescription> = {}
    ): ElementDescription {
      return {
        path: "/repo/src/components/button/index.ts",
        types: ["component"],
        category: "ui",
        filePath: "/repo/src/components/button/index.ts",
        fileInternalPath: "index.ts",
        captured: { family: "atoms" },
        parents: [],
        isIgnored: false,
        isUnknown: false,
        ...overrides,
      };
    }

    it("uses the singular 'element of' label when singleElement is true", () => {
      const element = createElement();

      expect(
        elementDescriptionMessage(element, ["type"], { singleElement: true })
      ).toBe('element of type "component"');
    });

    it("uses the 'types' label when multiple types are present", () => {
      const element = createElement({ types: ["component", "page"] });

      expect(elementDescriptionMessage(element, ["type"])).toBe(
        'elements of types "component", "page"'
      );
    });

    it("returns an empty string when no fragments can be produced", () => {
      const element = createElement({
        types: null,
        category: null,
        captured: null,
      });

      expect(
        elementDescriptionMessage(element, ["type", "category", "captured"])
      ).toBe("");
    });

    it("includes null parent values when includeNullValues is true", () => {
      const element = createElement({ types: null, category: null });

      expect(
        elementDescriptionMessage(element, ["parent"], {
          includeNullValues: true,
        })
      ).toBe('elements of parent "null"');
    });

    it("skips the parent fragment when the element has no parents and includeNullValues is false", () => {
      const element = createElement({ types: ["component"], category: null });

      expect(elementDescriptionMessage(element, ["type", "parent"])).toBe(
        'elements of type "component"'
      );
    });

    it("skips the parent fragment when the element has parents but no parent properties are configured", () => {
      const element = createElement({
        types: ["component"],
        parents: [
          {
            types: ["module"],
            category: null,
            path: "/repo/src/components",
            captured: null,
          },
        ],
      });

      expect(elementDescriptionMessage(element, ["type", "parent"])).toBe(
        'elements of type "component"'
      );
    });
  });

  describe("dependenciesRuleDefaultErrorMessage", () => {
    it("builds no-rule message with both element and file data and includes to origin", () => {
      const dependency = createDependencyDescription();

      expect(dependenciesRuleDefaultErrorMessage(null, null, dependency)).toBe(
        'There is no policy allowing dependencies from file of categories "ui", "feature" and captured values: scope="frontend" belonging to elements of type "component", category "ui" and captured values: family="atoms" to entities of module with origin "external" and module source "@scope/helpers" being file of categories "shared", "data" and captured values: team="platform" belonging to elements of type "helper", category "data" and captured values: domain="api"'
      );
    });

    it("builds no-rule message when only file data is available", () => {
      const dependency = createDependencyDescription({
        from: {
          element: {
            types: null,
            category: null,
            captured: null,
          },
          file: {
            categories: ["ui", "feature"],
            captured: {
              scope: "frontend",
            },
          },
        },
        to: {
          element: {
            types: null,
            category: null,
            captured: null,
          },
          file: {
            categories: ["shared"],
            captured: {
              team: "platform",
            },
          },
          module: {
            origin: "external",
            source: "@scope/helpers",
          },
        },
      });

      expect(dependenciesRuleDefaultErrorMessage(null, null, dependency)).toBe(
        'There is no policy allowing dependencies from file of categories "ui", "feature" and captured values: scope="frontend" to entities of module with origin "external" and module source "@scope/helpers" being file of category "shared" and captured values: team="platform"'
      );
    });

    it("builds no-rule message when only element data is available", () => {
      const dependency = createDependencyDescription({
        from: {
          element: {
            types: ["component"],
            category: "ui",
            captured: {
              family: "atoms",
            },
          },
          file: {
            categories: null,
            captured: null,
          },
        },
        to: {
          element: {
            types: ["helper"],
            category: "data",
            captured: {
              domain: "api",
            },
          },
          file: {
            categories: null,
            captured: null,
          },
          module: {
            origin: "local",
            source: null,
          },
        },
      });

      expect(dependenciesRuleDefaultErrorMessage(null, null, dependency)).toBe(
        'There is no policy allowing dependencies from elements of type "component", category "ui" and captured values: family="atoms" to elements of type "helper", category "data" and captured values: domain="api"'
      );
    });

    it("builds no-rule message with only from entity data when destination is empty", () => {
      const dependency = createDependencyDescription({
        to: {
          element: { types: null, category: null, captured: null },
          file: { categories: null, captured: null },
          module: {
            // @ts-expect-error Forcing origin null to drop module fragment
            origin: null,
            source: "ignored-source",
            internalPath: null,
          },
        },
      });

      expect(dependenciesRuleDefaultErrorMessage(null, null, dependency)).toBe(
        'There is no policy allowing dependencies from file of categories "ui", "feature" and captured values: scope="frontend" belonging to elements of type "component", category "ui" and captured values: family="atoms"'
      );
    });

    it("builds no-rule message with only to entity data when source is empty", () => {
      const dependency = createDependencyDescription({
        from: {
          element: { types: null, category: null, captured: null },
          file: { categories: null, captured: null },
        },
        to: {
          module: {
            // @ts-expect-error Forcing origin null to drop module fragment
            origin: null,
            source: "ignored-source",
            internalPath: null,
          },
        },
      });

      expect(dependenciesRuleDefaultErrorMessage(null, null, dependency)).toBe(
        'There is no policy allowing dependencies to file of categories "shared", "data" and captured values: team="platform" belonging to elements of type "helper", category "data" and captured values: domain="api"'
      );
    });

    it("builds no-rule message with from and dependency description when destination is empty", () => {
      const dependency = createDependencyDescription({
        to: {
          element: { types: null, category: null, captured: null },
          file: { categories: null, captured: null },
          module: {
            // @ts-expect-error Forcing origin null to drop module fragment
            origin: null,
            source: null,
            internalPath: null,
          },
        },
        dependency: { source: "lodash" },
      });

      expect(dependenciesRuleDefaultErrorMessage(null, null, dependency)).toBe(
        'There is no policy allowing dependencies from file of categories "ui", "feature" and captured values: scope="frontend" belonging to elements of type "component", category "ui" and captured values: family="atoms" with source "lodash"'
      );
    });

    it("builds no-rule message with to and dependency description when source is empty", () => {
      const dependency = createDependencyDescription({
        from: {
          element: { types: null, category: null, captured: null },
          file: { categories: null, captured: null },
        },
        to: {
          element: {
            types: ["helper"],
            category: "data",
            captured: { domain: "api" },
          },
          file: { categories: null, captured: null },
          module: {
            // @ts-expect-error Forcing origin null to drop module fragment
            origin: null,
            source: null,
            internalPath: null,
          },
        },
        dependency: { source: "lodash" },
      });

      expect(dependenciesRuleDefaultErrorMessage(null, null, dependency)).toBe(
        'There is no policy allowing dependencies to elements of type "helper", category "data" and captured values: domain="api" with source "lodash"'
      );
    });

    it("builds no-rule message with only dependency description when there is no entity data", () => {
      const dependency = createDependencyDescription({
        from: {
          element: { types: null, category: null, captured: null },
          file: { categories: null, captured: null },
        },
        to: {
          element: { types: null, category: null, captured: null },
          file: { categories: null, captured: null },
          module: {
            // @ts-expect-error Forcing origin null to drop module fragment
            origin: null,
            source: null,
            internalPath: null,
          },
        },
        dependency: { source: "lodash" },
      });

      expect(dependenciesRuleDefaultErrorMessage(null, null, dependency)).toBe(
        'There is no policy allowing dependencies with source "lodash"'
      );
    });

    it("returns the fallback error message when nothing can be described", () => {
      const dependency = createDependencyDescription({
        from: {
          element: { types: null, category: null, captured: null },
          file: { categories: null, captured: null },
        },
        to: {
          element: { types: null, category: null, captured: null },
          file: { categories: null, captured: null },
          module: {
            // @ts-expect-error Forcing origin null to drop module fragment
            origin: null,
            source: null,
            internalPath: null,
          },
        },
        dependency: {
          source: undefined,
        },
      });

      expect(dependenciesRuleDefaultErrorMessage(null, null, dependency)).toBe(
        "Not able to create a message for this violation. Please report this at: https://github.com/javierbrea/eslint-plugin-boundaries/issues"
      );
    });

    it("delegates to the rule-matched message when ruleIndex is not null", () => {
      const dependency = createDependencyDescription();
      const matchResult: DependencySingleSelectorMatchResult = {
        from: { element: { types: ["component"] } },
      };

      expect(
        dependenciesRuleDefaultErrorMessage(matchResult, 7, dependency)
      ).toBe(
        'Dependencies are not allowed in elements of type "component". Denied by policy at index 7'
      );
    });

    it("builds no-rule message with origin inside dependency description when destination has no entity details", () => {
      const dependency = createDependencyDescription({
        from: {
          file: {
            categories: ["ui", "feature"],
            captured: {
              scope: "frontend",
            },
          },
        },
        to: {
          element: {
            types: null,
            category: null,
            captured: null,
          },
          file: {
            categories: null,
            captured: null,
          },
          module: {
            origin: "external",
            source: "@scope/helpers",
          },
        },
      });

      expect(dependenciesRuleDefaultErrorMessage(null, null, dependency)).toBe(
        'There is no policy allowing dependencies from file of categories "ui", "feature" and captured values: scope="frontend" belonging to elements of type "component", category "ui" and captured values: family="atoms" to entities of module with origin "external" and module source "@scope/helpers"'
      );
    });
  });
});
