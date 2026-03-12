import type {
  DependencyDescription,
  DependencyMatchResult,
} from "@boundaries/elements";

import { buildErrorMessage } from "../Rules/Dependencies";

import {
  elementDescriptionMessage,
  dependencyDescriptionMessage,
  dependenciesRuleDefaultErrorMessage,
} from "./Messages";

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

describe("Messages", () => {
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

  it("ignores null element values by default", () => {
    expect(
      elementDescriptionMessage(
        {
          ...dependencyDescription.from,
          type: null,
        },
        ["type"]
      )
    ).toBe("");
  });

  it("includes null element values when configured", () => {
    expect(
      elementDescriptionMessage(
        {
          ...dependencyDescription.from,
          type: null,
        },
        ["type"],
        {
          includeNullValues: true,
        }
      )
    ).toBe('elements of type "null"');
  });

  it("creates dependency metadata fragments without redundant prefixes", () => {
    expect(
      dependencyDescriptionMessage(dependencyDescription.dependency, [
        "kind",
        "source",
      ])
    ).toBe('kind "type" and source "@/helpers/fetcher"');
  });

  it("formats array values in metadata fragments", () => {
    expect(
      dependencyDescriptionMessage(dependencyDescription.dependency, [
        "specifiers",
      ])
    ).toBe('specifiers "Fetcher"');
  });

  it("returns empty metadata fragment when selected properties are not available", () => {
    expect(
      dependencyDescriptionMessage(dependencyDescription.dependency, ["foo"])
    ).toBe("");
  });

  it("ignores null metadata values by default", () => {
    expect(
      dependencyDescriptionMessage(dependencyDescription.dependency, ["module"])
    ).toBe("");
  });

  it("includes null metadata values when configured", () => {
    expect(
      dependencyDescriptionMessage(
        dependencyDescription.dependency,
        ["module"],
        {
          includeNullValues: true,
        }
      )
    ).toBe('module "null"');
  });

  it("builds a semantic default message using relevant from/to/dependency properties", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: { type: "component", captured: { family: "atoms" } },
      to: { type: "helper", internalPath: "fetcher.ts" },
      dependency: { kind: "type", source: "@/helpers/fetcher" },
    };

    expect(
      dependenciesRuleDefaultErrorMessage(matchResult, 1, dependencyDescription)
    ).toBe(
      'Dependencies with kind "type" and source "@/helpers/fetcher" to elements of type "helper" and internalPath "fetcher.ts" are not allowed in elements of type "component" and family "atoms". Denied by rule at index 1'
    );
  });

  it("uses natural wording for no-rules message without 'dependencies of' redundancy", () => {
    const dependencyWithModule: DependencyDescription = {
      ...dependencyDescription,
      dependency: {
        ...dependencyDescription.dependency,
        module: "react-router-dom",
      },
    };

    expect(
      dependenciesRuleDefaultErrorMessage(null, null, dependencyWithModule)
    ).toBe(
      'There is no rule allowing dependencies from elements of type "component", category "ui", family "atoms" and elementName "button" to elements of type "helper", category "data" and domain "api"'
    );
  });

  it("uses 'with module' wording when no-rules message includes dependency metadata", () => {
    const dependencyFromWithModuleOnly: DependencyDescription = {
      ...dependencyDescription,
      to: {
        ...dependencyDescription.to,
        type: null,
        category: null,
        captured: null,
      },
      dependency: {
        ...dependencyDescription.dependency,
        module: "react-router-dom",
      },
    };

    expect(
      dependenciesRuleDefaultErrorMessage(
        null,
        null,
        dependencyFromWithModuleOnly
      )
    ).toBe(
      'There is no rule allowing dependencies from elements of type "component", category "ui", family "atoms" and elementName "button" to elements of origin "local" with module "react-router-dom"'
    );
  });

  it("omits non-present parts when only from selector is present", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: { type: "component" },
      to: null,
      dependency: null,
    };

    expect(
      dependenciesRuleDefaultErrorMessage(matchResult, 1, dependencyDescription)
    ).toBe(
      'Dependencies are not allowed in elements of type "component". Denied by rule at index 1'
    );
  });

  it("builds message when only dependency selector is present", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: null,
      to: null,
      dependency: { kind: "type" },
    };

    expect(
      dependenciesRuleDefaultErrorMessage(matchResult, 1, dependencyDescription)
    ).toBe(
      'Dependencies with kind "type" are not allowed. Denied by rule at index 1'
    );
  });

  it("returns fallback error when rule matched but there are no describable selector parts", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: false,
      from: null,
      to: null,
      dependency: null,
    };

    expect(
      dependenciesRuleDefaultErrorMessage(matchResult, 1, dependencyDescription)
    ).toContain("Not able to create a message for this violation");
  });
});

describe("ElementTypes buildErrorMessage", () => {
  it("returns rendered custom message when customMessage is provided", () => {
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
    ).toBe("My custom message");
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
      'Dependencies with kind "type" to elements of type "helper" are not allowed in elements of type "component". Denied by rule at index 1'
    );
  });
});
