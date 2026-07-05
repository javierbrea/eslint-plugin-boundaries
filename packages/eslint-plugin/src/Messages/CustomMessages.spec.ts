import type {
  DependencyDescription,
  DependencySingleSelectorMatchResult,
  ElementDescription,
  ElementParent,
  EntityDescription,
} from "@boundaries/elements";

import {
  customErrorMessage,
  elementPropertiesToReplaceInLegacyTemplate,
  parentPropertiesToReplaceInLegacyTemplate,
  replaceObjectValueInLegacyTemplate,
} from "./CustomMessages";

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

const importerParent: ElementParent = {
  path: "/repo/src/domain",
  types: ["domain"],
  category: "business",
  captured: {
    layer: "domain",
  },
};

const targetParent: ElementParent = {
  path: "/repo/src/shared",
  types: ["shared"],
  category: "common",
  captured: {
    layer: "shared",
  },
};

function createEntityDescription(
  values: EntityDescriptionOverrides = {}
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
  return {
    from: createEntityDescription({
      element: {
        path: "/repo/src/components/button/index.ts",
        types: ["component"],
        category: "ui",
        filePath: "/repo/src/components/button/index.ts",
        fileInternalPath: "index.ts",
        captured: {
          family: "atoms",
        },
        parents: [importerParent],
        ...values.from?.element,
      },
      file: {
        path: "/repo/src/components/button/index.ts",
        categories: ["ui", "feature"],
        captured: {
          scope: "frontend",
        },
        ...values.from?.file,
      },
      module: {
        origin: "local",
        source: null,
        internalPath: null,
        ...values.from?.module,
      },
    }),
    to: createEntityDescription({
      element: {
        path: "/repo/src/helpers/fetcher.ts",
        types: ["helper"],
        category: "data",
        filePath: "/repo/src/helpers/fetcher.ts",
        fileInternalPath: "fetcher.ts",
        captured: {
          domain: "api",
        },
        parents: [targetParent],
        ...values.to?.element,
      },
      file: {
        path: "/repo/src/helpers/fetcher.ts",
        categories: ["shared", "data"],
        captured: {
          team: "platform",
        },
        ...values.to?.file,
      },
      module: {
        origin: "external",
        source: "@scope/helpers",
        internalPath: null,
        ...values.to?.module,
      },
    }),
    dependency: {
      source: "@/helpers/fetcher",
      kind: "type",
      nodeKind: "ImportDeclaration",
      specifiers: ["Fetcher", "FetcherConfig"],
      relationship: {
        from: "sibling",
        to: "sibling",
      },
      ...values.dependency,
    },
  };
}

describe("CustomMessages", () => {
  describe("replaceObjectValueInLegacyTemplate", () => {
    it("replaces all placeholder occurrences for a plain key", () => {
      const template = "${value} - ${value}";

      expect(
        replaceObjectValueInLegacyTemplate(template, "value", "done")
      ).toBe("done - done");
    });

    it("replaces placeholders using namespace when provided", () => {
      const template = "${from.type} vs ${type}";

      expect(
        replaceObjectValueInLegacyTemplate(
          template,
          "type",
          "component",
          "from"
        )
      ).toBe("component vs ${type}");
    });
  });

  describe("elementPropertiesToReplaceInLegacyTemplate", () => {
    const dependencyDescription = createDependencyDescription();

    it("returns normalized values for full elements", () => {
      expect(
        elementPropertiesToReplaceInLegacyTemplate({
          element: dependencyDescription.from.element,
          module: dependencyDescription.from.module,
          dependency: dependencyDescription.dependency,
        })
      ).toEqual({
        family: "atoms",
        type: "component",
        internalPath: "index.ts",
        source: "@/helpers/fetcher",
        module: "",
        importKind: "type",
      });
    });

    it("uses the origin module when present", () => {
      expect(
        elementPropertiesToReplaceInLegacyTemplate({
          element: dependencyDescription.to.element,
          module: dependencyDescription.to.module,
          dependency: dependencyDescription.dependency,
        })
      ).toEqual({
        domain: "api",
        type: "helper",
        internalPath: "fetcher.ts",
        source: "@/helpers/fetcher",
        module: "@scope/helpers",
        importKind: "type",
      });
    });

    it("falls back to empty strings for missing metadata", () => {
      expect(
        elementPropertiesToReplaceInLegacyTemplate({
          element: dependencyDescription.from.element,
        })
      ).toEqual({
        family: "atoms",
        type: "component",
        internalPath: "index.ts",
        source: "",
        module: "",
        importKind: "",
      });
    });

    it("uses empty fallback values for nullable element and dependency metadata properties", () => {
      const elementWithNullableProperties = {
        ...dependencyDescription.from.element,
        captured: null,
        types: null,
        fileInternalPath: null,
      } as unknown as ElementDescription;

      const dependencyWithNullableProperties = {
        ...dependencyDescription.dependency,
        source: null,
        kind: null,
      } as unknown as DependencyDescription["dependency"];

      expect(
        elementPropertiesToReplaceInLegacyTemplate({
          element: elementWithNullableProperties,
          module: {
            origin: "external",
            source: null,
            internalPath: null,
          },
          dependency: dependencyWithNullableProperties,
        })
      ).toEqual({
        type: "",
        internalPath: "",
        source: "",
        module: "",
        importKind: "",
      });
    });
  });

  describe("parentPropertiesToReplaceInLegacyTemplate", () => {
    const dependencyDescription = createDependencyDescription();

    it("returns normalized values for parent elements", () => {
      expect(
        parentPropertiesToReplaceInLegacyTemplate({
          parent: importerParent,
          dependency: dependencyDescription.dependency,
        })
      ).toEqual({
        layer: "domain",
        type: "domain",
        internalPath: "",
        source: "",
        module: "",
        importKind: "type",
      });
    });

    it("uses empty fallback values for nullable parent properties", () => {
      const parentWithNullableProperties = {
        ...importerParent,
        captured: null,
        types: null,
      } as unknown as ElementParent;

      expect(
        parentPropertiesToReplaceInLegacyTemplate({
          parent: parentWithNullableProperties,
        })
      ).toEqual({
        type: "",
        internalPath: "",
        source: "",
        module: "",
        importKind: "",
      });
    });
  });

  describe("customErrorMessage", () => {
    const dependencyDescription = createDependencyDescription();

    it("replaces legacy template placeholders from dependency context", () => {
      const template =
        "from ${from.type}/${from.family} to ${dependency.type}/${dependency.domain} source ${dependency.source} module ${dependency.module} report ${report.path} specs ${report.specifiers} parent ${from.parent.layer} -> ${dependency.parent.layer}";

      expect(customErrorMessage(template, dependencyDescription)).toBe(
        "from component/atoms to helper/api source @/helpers/fetcher module @scope/helpers report fetcher.ts specs Fetcher, FetcherConfig parent domain -> shared"
      );
    });

    it("renders handlebars expressions when template includes handlebars tokens", () => {
      const matchResult: DependencySingleSelectorMatchResult = {
        from: {
          element: {
            type: "component",
          },
        },
        to: {
          element: {
            type: "helper",
          },
        },
        dependency: {
          kind: "type",
        },
      };

      const template =
        "{{from.element.type}} -> {{to.element.type}} (rule {{rule.index}}:{{rule.selector.from.type}}/{{rule.selector.from.element.type}}:{{rule.selector.dependency.kind}})";

      expect(
        customErrorMessage(template, dependencyDescription, 2, matchResult)
      ).toBe("component -> helper (rule 2:component/component:type)");
    });

    it("renders handlebars with null rule context when rule data is missing", () => {
      const template =
        "{{from.element.type}} {{#if rule}}has-rule{{else}}no-rule{{/if}}";

      expect(customErrorMessage(template, dependencyDescription)).toBe(
        "component no-rule"
      );
    });

    it("renders block templates when handlebars syntax is detected", () => {
      const template = "{{#if rule}}has-rule{{else}}no-rule{{/if}}";

      expect(customErrorMessage(template, dependencyDescription)).toBe(
        "no-rule"
      );
    });

    it("omits origin in handlebars context when module origin is undefined", () => {
      const dependency = createDependencyDescription({
        from: {
          module: {
            origin: undefined,
            source: null,
            internalPath: null,
          } as unknown as DependencyDescription["from"]["module"],
        },
      });
      const template =
        "{{#if from.origin}}origin:{{from.origin}}{{else}}no-origin{{/if}}";

      expect(customErrorMessage(template, dependency)).toBe("no-origin");
    });

    it("preserves non-array parents in handlebars context", () => {
      const dependency = createDependencyDescription({
        from: {
          element: {
            path: "/repo/src/components/button/index.ts",
            types: ["component"],
            category: "ui",
            filePath: "/repo/src/components/button/index.ts",
            fileInternalPath: "index.ts",
            captured: { family: "atoms" },
            parents: null,
            isIgnored: false,
            isUnknown: false,
          } as unknown as DependencyDescription["from"]["element"],
        },
        to: {
          element: {
            path: "/repo/src/helpers/fetcher.ts",
            types: ["helper"],
            category: "data",
            filePath: "/repo/src/helpers/fetcher.ts",
            fileInternalPath: "fetcher.ts",
            captured: { domain: "api" },
            parents: null,
            isIgnored: false,
            isUnknown: false,
          } as unknown as DependencyDescription["to"]["element"],
        },
      });
      const template =
        "{{from.element.type}}->{{to.element.type}}|{{#if from.parents}}has{{else}}none{{/if}}";

      expect(customErrorMessage(template, dependency)).toBe(
        "component->helper|none"
      );
    });

    it("handles match result with missing from and to selectors", () => {
      const matchResult: DependencySingleSelectorMatchResult = {
        dependency: { kind: "type" },
      };
      const template =
        "rule:{{rule.index}}|from:{{#if rule.selector.from}}yes{{else}}no{{/if}}|to:{{#if rule.selector.to}}yes{{else}}no{{/if}}";

      expect(
        customErrorMessage(template, dependencyDescription, 5, matchResult)
      ).toBe("rule:5|from:no|to:no");
    });

    it("exposes elementPath and internalPath in rule selector when filePath fields are defined", () => {
      const matchResult: DependencySingleSelectorMatchResult = {
        from: {
          element: {
            type: "component",
            filePath: "/repo/src/components/button/index.ts",
            fileInternalPath: "index.ts",
          },
        },
        to: {
          element: {
            type: "helper",
            filePath: "/repo/src/helpers/fetcher.ts",
            fileInternalPath: "fetcher.ts",
          },
        },
        dependency: { kind: "type" },
      };
      const template =
        "{{rule.selector.from.elementPath}}|{{rule.selector.from.internalPath}}|{{rule.selector.to.elementPath}}|{{rule.selector.to.internalPath}}";

      expect(
        customErrorMessage(template, dependencyDescription, 1, matchResult)
      ).toBe(
        "/repo/src/components/button/index.ts|index.ts|/repo/src/helpers/fetcher.ts|fetcher.ts"
      );
    });

    it("omits elementPath and internalPath in rule selector when filePath fields are undefined", () => {
      const matchResult: DependencySingleSelectorMatchResult = {
        from: {
          element: {
            type: "component",
          },
        },
        to: {
          element: {
            type: "helper",
          },
        },
        dependency: { kind: "type" },
      };
      const template =
        "from-path:{{#if rule.selector.from.elementPath}}yes{{else}}no{{/if}}|from-internal:{{#if rule.selector.from.internalPath}}yes{{else}}no{{/if}}";

      expect(
        customErrorMessage(template, dependencyDescription, 1, matchResult)
      ).toBe("from-path:no|from-internal:no");
    });

    it("skips parent legacy placeholders when from element has no parents", () => {
      const dependency = createDependencyDescription({
        from: {
          element: {
            path: "/repo/src/components/button/index.ts",
            types: ["component"],
            category: "ui",
            filePath: "/repo/src/components/button/index.ts",
            fileInternalPath: "index.ts",
            captured: { family: "atoms" },
            parents: [],
            isIgnored: false,
            isUnknown: false,
          },
        },
      });
      const template = "${from.parent.layer}";

      expect(customErrorMessage(template, dependency)).toBe(
        "${from.parent.layer}"
      );
    });

    it("skips parent legacy placeholders when to element has no parents", () => {
      const dependency = createDependencyDescription({
        to: {
          element: {
            path: "/repo/src/helpers/fetcher.ts",
            types: ["helper"],
            category: "data",
            filePath: "/repo/src/helpers/fetcher.ts",
            fileInternalPath: "fetcher.ts",
            captured: { domain: "api" },
            parents: [],
            isIgnored: false,
            isUnknown: false,
          },
        },
      });
      const template = "${dependency.parent.layer}";

      expect(customErrorMessage(template, dependency)).toBe(
        "${dependency.parent.layer}"
      );
    });

    it("falls back to element fileInternalPath for report path when module internalPath is missing", () => {
      const dependency = createDependencyDescription({
        to: {
          module: {
            origin: "local",
            source: null,
            internalPath: null,
          },
        },
      });
      const template = "${report.path}";

      expect(customErrorMessage(template, dependency)).toBe("fetcher.ts");
    });

    it("uses module internalPath for report path when present", () => {
      const dependency = createDependencyDescription({
        to: {
          module: {
            origin: "external",
            source: "@scope/helpers",
            internalPath: "nested/api.ts",
          },
        },
      });
      const template = "${report.path}";

      expect(customErrorMessage(template, dependency)).toBe("nested/api.ts");
    });

    it("falls back to empty string for report path when no internal paths exist", () => {
      const dependency = createDependencyDescription({
        to: {
          element: {
            path: "/repo/src/helpers/fetcher.ts",
            types: ["helper"],
            category: "data",
            filePath: "/repo/src/helpers/fetcher.ts",
            fileInternalPath: null,
            captured: { domain: "api" },
            parents: [targetParent],
            isIgnored: false,
            isUnknown: false,
          },
          module: {
            origin: "local",
            source: null,
            internalPath: null,
          },
        },
      });
      const template = "[${report.path}]";

      expect(customErrorMessage(template, dependency)).toBe("[]");
    });

    it("falls back to empty string for report specifiers when missing", () => {
      const dependency = createDependencyDescription({
        dependency: {
          specifiers: undefined,
        } as unknown as Partial<DependencyDescription["dependency"]>,
      });
      const template = "[${report.specifiers}]";

      expect(customErrorMessage(template, dependency)).toBe("[]");
    });
  });
});
