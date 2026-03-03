import type {
  DependencyDescription,
  DependencyMatchResult,
} from "@boundaries/elements";

import {
  elementDescriptionMessage,
  dependencyDescriptionMessage,
  elementTypesDefaultErrorMessage,
} from "../../src/Messages";
import { buildErrorMessage } from "../../src/Rules/ElementTypes";

const dependencyDescription: DependencyDescription = {
  from: {
    path: "/repo/src/components/button/index.ts",
    elementPath: "src/components/button",
    internalPath: "index.ts",
    type: "component",
    category: "ui",
    captured: {
      family: "atoms",
      elementName: "button",
    },
    parents: [],
    origin: "local",
    isIgnored: false,
    isUnknown: false,
  },
  to: {
    path: "/repo/src/helpers/fetcher.ts",
    elementPath: "src/helpers/fetcher",
    internalPath: "fetcher.ts",
    type: "helper",
    category: "data",
    captured: {
      domain: "api",
    },
    parents: [],
    origin: "local",
    isIgnored: false,
    isUnknown: false,
  },
  dependency: {
    source: "@/helpers/fetcher",
    module: null,
    kind: "type",
    nodeKind: "ImportDeclaration",
    specifiers: ["Fetcher"],
    relationship: {
      from: "sibling",
      to: "sibling",
    },
  },
};

describe("Messages element-types default formatter", () => {
  it("creates element descriptions using the requested properties", () => {
    expect(
      elementDescriptionMessage(dependencyDescription.from, [
        "type",
        "category",
        "path",
      ])
    ).toBe(
      'elements of type "component", category "ui" and path "/repo/src/components/button/index.ts"'
    );
  });

  it("creates dependency metadata descriptions using the requested properties", () => {
    expect(
      dependencyDescriptionMessage(dependencyDescription.dependency, [
        "kind",
        "source",
      ])
    ).toBe('dependencies of kind "type" and source "@/helpers/fetcher"');
  });

  it("returns generic element text when selected properties are not available", () => {
    expect(elementDescriptionMessage(dependencyDescription.from, ["foo"])).toBe(
      "elements"
    );
  });

  it("returns generic dependencies text when selected metadata properties are not available", () => {
    expect(
      dependencyDescriptionMessage(dependencyDescription.dependency, ["foo"])
    ).toBe("dependencies");
  });

  it("formats array values in metadata descriptions", () => {
    expect(
      dependencyDescriptionMessage(dependencyDescription.dependency, [
        "specifiers",
      ])
    ).toBe('dependencies of specifiers "Fetcher"');
  });

  it("builds a semantic default message using relevant from/to/dependency properties", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: { type: "component", captured: { family: "atoms" } },
      to: { type: "helper", internalPath: "fetcher.ts" },
      dependency: { kind: "type", source: "@/helpers/fetcher" },
    };

    expect(
      elementTypesDefaultErrorMessage(matchResult, dependencyDescription)
    ).toBe(
      'Dependencies of kind "type" and source "@/helpers/fetcher", to elements of type "helper" and internalPath "fetcher.ts", are not allowed in elements of type "component" and family "atoms"'
    );
  });

  it("capitalizes message when only dependency and to are present", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: null,
      to: { type: "helper" },
      dependency: { kind: "type" },
    };

    expect(
      elementTypesDefaultErrorMessage(matchResult, dependencyDescription)
    ).toBe(
      'Dependencies of kind "type", to elements of type "helper", are not allowed'
    );
  });

  it("builds message when only dependency and from are present", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: { type: "component" },
      to: null,
      dependency: { kind: "type" },
    };

    expect(
      elementTypesDefaultErrorMessage(matchResult, dependencyDescription)
    ).toBe(
      'Dependencies of kind "type" are not allowed in elements of type "component"'
    );
  });

  it("builds message when only to selector is present", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: null,
      to: { type: "helper" },
      dependency: null,
    };

    expect(
      elementTypesDefaultErrorMessage(matchResult, dependencyDescription)
    ).toBe('Dependencies to elements of type "helper" are not allowed');
  });

  it("builds message when only dependency selector is present", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: null,
      to: null,
      dependency: { kind: "type" },
    };

    expect(
      elementTypesDefaultErrorMessage(matchResult, dependencyDescription)
    ).toBe('Dependencies of kind "type" are not allowed');
  });

  it("falls back to generic message when no selector details are present", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: false,
      from: null,
      to: null,
      dependency: null,
    };

    expect(
      elementTypesDefaultErrorMessage(matchResult, dependencyDescription)
    ).toBe("Dependencies are not allowed");
  });

  it("uses only matched relationship subproperty when building dependency description", () => {
    const dependencyWithMixedRelationship: DependencyDescription = {
      ...dependencyDescription,
      dependency: {
        ...dependencyDescription.dependency,
        relationship: {
          from: "ancestor",
          to: "child",
        },
      },
    };

    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: null,
      to: null,
      dependency: {
        relationship: {
          from: "ancestor",
        },
      },
    };

    expect(
      elementTypesDefaultErrorMessage(
        matchResult,
        dependencyWithMixedRelationship
      )
    ).toBe('Dependencies of relationship from "ancestor" are not allowed');
  });

  it("omits non-present parts when matchResult has only from selector", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: { type: "component" },
      to: null,
      dependency: null,
    };

    expect(
      elementTypesDefaultErrorMessage(matchResult, dependencyDescription)
    ).toBe('Dependencies are not allowed in elements of type "component"');
  });
});

describe("ElementTypes buildErrorMessage", () => {
  it("returns JSON stringified payload when customMessage is provided", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: { type: "component" },
      to: { type: "helper" },
      dependency: null,
    };

    expect(
      buildErrorMessage({
        matchResult,
        ruleIndex: 2,
        customMessage: "My custom message",
        dependency: dependencyDescription,
      })
    ).toBe(
      JSON.stringify({
        matchResult,
        ruleIndex: 2,
        customMessage: "My custom message",
        dependency: dependencyDescription,
      })
    );
  });

  it("returns generated default message when customMessage is not provided", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: { type: "component" },
      to: { type: "helper" },
      dependency: { kind: "type" },
    };

    expect(
      buildErrorMessage({
        matchResult,
        ruleIndex: 1,
        customMessage: undefined,
        dependency: dependencyDescription,
      })
    ).toBe(
      'Dependencies of kind "type", to elements of type "helper", are not allowed in elements of type "component"'
    );
  });
});
