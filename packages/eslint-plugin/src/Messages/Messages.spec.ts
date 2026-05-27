import type {
  DependencyDescription,
  DependencySingleSelectorMatchResult,
  EntityDescription,
} from "@boundaries/elements";

import {
  dependenciesRuleDefaultErrorMessage,
  dependenciesRuleMatchedMessage,
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
        'Dependencies with source "@scope/helpers", kind "type", nodeKind "ImportDeclaration", relationship from "sibling", relationship to "sibling", source "@scope/helpers" and specifiers "Fetcher", "FetcherConfig" to file of categories "shared", "data" and captured values: team="platform" belonging to elements of type "helper" and captured values: domain="api" are not allowed in file of categories "ui", "feature" and captured values: scope="frontend" belonging to elements of type "component", category "ui" and captured values: family="atoms" and module with origin "local". Denied by rule at index 2'
      );
    });
  });

  describe("dependenciesRuleDefaultErrorMessage", () => {
    it("builds no-rule message with both element and file data and includes to origin", () => {
      const dependency = createDependencyDescription();

      expect(dependenciesRuleDefaultErrorMessage(null, null, dependency)).toBe(
        'There is no rule allowing dependencies from file of categories "ui", "feature" and captured values: scope="frontend" belonging to elements of type "component", category "ui" and captured values: family="atoms" to entities of module with origin "external" and source "@scope/helpers" being file of categories "shared", "data" and captured values: team="platform" belonging to elements of type "helper", category "data" and captured values: domain="api"'
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
        'There is no rule allowing dependencies from file of categories "ui", "feature" and captured values: scope="frontend" to entities of module with origin "external" and source "@scope/helpers" being file of category "shared" and captured values: team="platform"'
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
        'There is no rule allowing dependencies from elements of type "component", category "ui" and captured values: family="atoms" to elements of type "helper", category "data" and captured values: domain="api"'
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
        'There is no rule allowing dependencies from file of categories "ui", "feature" and captured values: scope="frontend" belonging to elements of type "component", category "ui" and captured values: family="atoms" to entities of module with origin "external" and source "@scope/helpers"'
      );
    });
  });
});
