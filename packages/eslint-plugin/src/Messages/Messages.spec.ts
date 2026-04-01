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
  origin?: Partial<EntityDescription["origin"]>;
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
      type: "default",
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
    origin: {
      kind: "local",
      module: null,
      ...values.origin,
    },
  };
}

function createDependencyDescription(
  values: DependencyDescriptionOverrides = {}
): DependencyDescription {
  const fromDefaults: EntityDescriptionOverrides = {
    element: {
      path: "/repo/src/components/button/index.ts",
      type: "component",
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
    origin: {
      kind: "local",
      module: null,
    },
  };

  const toDefaults: EntityDescriptionOverrides = {
    element: {
      path: "/repo/src/helpers/fetcher.ts",
      type: "helper",
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
    origin: {
      kind: "external",
      module: "@scope/helpers",
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
      origin: {
        ...fromDefaults.origin,
        ...values.from?.origin,
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
      origin: {
        ...toDefaults.origin,
        ...values.to?.origin,
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
            type: "component",
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
          origin: {
            kind: "local",
          },
        },
        to: {
          element: {
            type: "helper",
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
          origin: {
            kind: "external",
            module: "@scope/helpers",
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
        'Dependencies with source "@scope/helpers", kind "type", nodeKind "ImportDeclaration", relationship from "sibling", relationship to "sibling", module "@scope/helpers" and specifiers "Fetcher", "FetcherConfig" to file of categories "shared", "data" and team "platform" belonging to elements of type "helper" and domain "api" are not allowed in file of categories "ui", "feature" and scope "frontend" belonging to elements of type "component", category "ui" and family "atoms" and origin "local". Denied by rule at index 2'
      );
    });
  });

  describe("dependenciesRuleDefaultErrorMessage", () => {
    it("builds no-rule message with both element and file data and includes to origin", () => {
      const dependency = createDependencyDescription();

      expect(dependenciesRuleDefaultErrorMessage(null, null, dependency)).toBe(
        'There is no rule allowing dependencies from file of categories "ui", "feature" and scope "frontend" belonging to elements of type "component", category "ui" and family "atoms" to entities of origin "external" with module "@scope/helpers" being file of categories "shared", "data" and team "platform" belonging to elements of type "helper", category "data" and domain "api"'
      );
    });

    it("builds no-rule message when only file data is available", () => {
      const dependency = createDependencyDescription({
        from: {
          element: {
            type: null,
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
            type: null,
            category: null,
            captured: null,
          },
          file: {
            categories: ["shared"],
            captured: {
              team: "platform",
            },
          },
          origin: {
            kind: "external",
            module: "@scope/helpers",
          },
        },
      });

      expect(dependenciesRuleDefaultErrorMessage(null, null, dependency)).toBe(
        'There is no rule allowing dependencies from file of categories "ui", "feature" and scope "frontend" to entities of origin "external" with module "@scope/helpers" being file of categories "shared" and team "platform"'
      );
    });

    it("builds no-rule message when only element data is available", () => {
      const dependency = createDependencyDescription({
        from: {
          element: {
            type: "component",
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
            type: "helper",
            category: "data",
            captured: {
              domain: "api",
            },
          },
          file: {
            categories: null,
            captured: null,
          },
          origin: {
            kind: "local",
            module: null,
          },
        },
      });

      expect(dependenciesRuleDefaultErrorMessage(null, null, dependency)).toBe(
        'There is no rule allowing dependencies from elements of type "component", category "ui" and family "atoms" to elements of type "helper", category "data" and domain "api"'
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
            type: null,
            category: null,
            captured: null,
          },
          file: {
            categories: null,
            captured: null,
          },
          origin: {
            kind: "external",
            module: "@scope/helpers",
          },
        },
      });

      expect(dependenciesRuleDefaultErrorMessage(null, null, dependency)).toBe(
        'There is no rule allowing dependencies from file of categories "ui", "feature" and scope "frontend" belonging to elements of type "component", category "ui" and family "atoms" to entities of origin "external" with module "@scope/helpers"'
      );
    });
  });
});
