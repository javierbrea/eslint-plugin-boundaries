import type {
  DependencyDescription,
  DependencyMatchResult,
  ElementDescription,
  ElementParent,
} from "@boundaries/elements";

import {
  customErrorMessage,
  elementPropertiesToReplaceInLegacyTemplate,
  replaceObjectValueInLegacyTemplate,
} from "./CustomMessages";

const importerParent: ElementParent = {
  elementPath: "src/domain",
  type: "domain",
  category: "business",
  captured: {
    layer: "domain",
  },
};

const targetParent: ElementParent = {
  elementPath: "src/shared",
  type: "shared",
  category: "common",
  captured: {
    layer: "shared",
  },
};

const importerElement: ElementDescription = {
  path: "/repo/src/components/button/index.ts",
  elementPath: "src/components/button",
  internalPath: "index.ts",
  type: "component",
  category: "ui",
  captured: {
    family: "atoms",
  },
  parents: [importerParent],
  origin: "local",
  isIgnored: false,
  isUnknown: false,
};

const targetElement: ElementDescription = {
  path: "/repo/src/helpers/fetcher.ts",
  elementPath: "src/helpers/fetcher",
  internalPath: "fetcher.ts",
  type: "helper",
  category: "data",
  captured: {
    domain: "api",
  },
  parents: [targetParent],
  origin: "local",
  isIgnored: false,
  isUnknown: false,
};

const dependencyDescription: DependencyDescription = {
  from: importerElement,
  to: targetElement,
  dependency: {
    source: "@/helpers/fetcher",
    module: "@scope/helpers",
    kind: "type",
    nodeKind: "ImportDeclaration",
    specifiers: ["Fetcher", "FetcherConfig"],
    relationship: {
      from: "sibling",
      to: "sibling",
    },
  },
};

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
    it("returns normalized values for full elements", () => {
      expect(
        elementPropertiesToReplaceInLegacyTemplate(
          importerElement,
          "type",
          dependencyDescription.dependency
        )
      ).toEqual({
        family: "atoms",
        type: "component",
        internalPath: "index.ts",
        source: "@/helpers/fetcher",
        module: "@scope/helpers",
        importKind: "type",
      });
    });

    it("returns normalized values for parent elements", () => {
      expect(
        elementPropertiesToReplaceInLegacyTemplate(importerParent, "value")
      ).toEqual({
        layer: "domain",
        type: "domain",
        internalPath: "",
        source: "",
        module: "",
        importKind: "value",
      });
    });

    it("falls back to empty strings for missing metadata", () => {
      expect(
        elementPropertiesToReplaceInLegacyTemplate(importerElement, "")
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
        ...importerElement,
        type: null,
        internalPath: null,
      } as unknown as ElementDescription;

      const dependencyWithNullableProperties = {
        ...dependencyDescription.dependency,
        source: null,
        module: null,
      } as unknown as DependencyDescription["dependency"];

      expect(
        elementPropertiesToReplaceInLegacyTemplate(
          elementWithNullableProperties,
          "",
          dependencyWithNullableProperties
        )
      ).toEqual({
        family: "atoms",
        type: "",
        internalPath: "",
        source: "",
        module: "",
        importKind: "",
      });
    });

    it("uses empty fallback values for nullable parent properties", () => {
      const parentWithNullableType = {
        ...importerParent,
        type: null,
      } as unknown as ElementParent;

      expect(
        elementPropertiesToReplaceInLegacyTemplate(parentWithNullableType, "")
      ).toEqual({
        layer: "domain",
        type: "",
        internalPath: "",
        source: "",
        module: "",
        importKind: "",
      });
    });
  });

  describe("customErrorMessage", () => {
    it("replaces legacy template placeholders from dependency context", () => {
      const template =
        "from ${from.type}/${from.family} to ${dependency.type}/${dependency.domain} source ${dependency.source} module ${dependency.module} report ${report.path} specs ${report.specifiers} parent ${from.parent.layer} -> ${dependency.parent.layer}";

      expect(customErrorMessage(template, dependencyDescription)).toBe(
        "from component/atoms to helper/api source @/helpers/fetcher module @scope/helpers report fetcher.ts specs Fetcher, FetcherConfig parent domain -> shared"
      );
    });

    it("renders handlebars expressions when template includes handlebars tokens", () => {
      const matchResult: DependencyMatchResult = {
        isMatch: true,
        from: { type: "component" },
        to: { type: "helper" },
        dependency: { kind: "type" },
      };

      const template =
        "{{from.type}} -> {{to.type}} (rule {{rule.index}}:{{rule.selector.dependency.kind}})";

      expect(
        customErrorMessage(template, dependencyDescription, 2, matchResult)
      ).toBe("component -> helper (rule 2:type)");
    });

    it("renders handlebars with null rule context when rule data is missing", () => {
      const template = "{{#if rule}}has-rule{{else}}no-rule{{/if}}";

      expect(customErrorMessage(template, dependencyDescription)).toBe(
        "no-rule"
      );
    });
  });
});
