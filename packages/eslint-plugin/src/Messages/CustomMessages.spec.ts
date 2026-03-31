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
  origin?: Partial<EntityDescription["origin"]>;
};

type DependencyDescriptionOverrides = {
  from?: EntityDescriptionOverrides;
  to?: EntityDescriptionOverrides;
  dependency?: Partial<DependencyDescription["dependency"]>;
};

const importerParent: ElementParent = {
  path: "/repo/src/domain",
  type: "domain",
  category: "business",
  captured: {
    layer: "domain",
  },
};

const targetParent: ElementParent = {
  path: "/repo/src/shared",
  type: "shared",
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
  return {
    from: createEntityDescription({
      element: {
        path: "/repo/src/components/button/index.ts",
        type: "component",
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
      origin: {
        kind: "local",
        module: null,
        ...values.from?.origin,
      },
    }),
    to: createEntityDescription({
      element: {
        path: "/repo/src/helpers/fetcher.ts",
        type: "helper",
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
      origin: {
        kind: "external",
        module: "@scope/helpers",
        ...values.to?.origin,
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
          origin: dependencyDescription.from.origin,
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
          origin: dependencyDescription.to.origin,
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
        type: null,
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
          origin: {
            kind: "external",
            module: null,
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
        type: null,
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
        "{{from.element.type}} -> {{to.element.type}} (rule {{rule.index}}:{{rule.selector.dependency.kind}})";

      expect(
        customErrorMessage(template, dependencyDescription, 2, matchResult)
      ).toBe("component -> helper (rule 2:type)");
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
  });
});
