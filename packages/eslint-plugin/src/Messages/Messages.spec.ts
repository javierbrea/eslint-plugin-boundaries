import type {
  DependencyDescription,
  DependencyMatchResult,
} from "@boundaries/elements";

import { buildErrorMessage } from "../Rules/Dependencies";

import {
  elementDescriptionMessage,
  dependencyDescriptionMessage,
  dependencyDescriptionMessageFromSelector,
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

  it("uses singleElement option for grammar", () => {
    expect(
      elementDescriptionMessage(dependencyDescription.from, ["type"], {
        singleElement: true,
      })
    ).toBe('element of type "component"');
  });

  it("handles empty parents array", () => {
    expect(
      elementDescriptionMessage(dependencyDescription.from, ["parent"])
    ).toBe("");
  });

  it("includes parent with null value when configured", () => {
    expect(
      elementDescriptionMessage(dependencyDescription.from, ["parent"], {
        includeNullValues: true,
      })
    ).toBe('elements of parent "null"');
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

  it("formats multiple array values in metadata fragments", () => {
    expect(
      dependencyDescriptionMessage(
        {
          ...dependencyDescription.dependency,
          specifiers: ["Fetcher", "useApi", "ApiConfig"],
        },
        ["specifiers"]
      )
    ).toBe('specifiers "Fetcher", "useApi", "ApiConfig"');
  });

  it("includes relationship property in dependency description", () => {
    expect(
      dependencyDescriptionMessage(dependencyDescription.dependency, [
        "relationship",
      ])
    ).toBe('relationship from "sibling" and relationship to "sibling"');
  });

  it("handles nodeKind property in dependency description", () => {
    expect(
      dependencyDescriptionMessage(dependencyDescription.dependency, [
        "nodeKind",
      ])
    ).toBe('nodeKind "ImportDeclaration"');
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

  it("returns null when dependency selector data is null", () => {
    expect(
      dependencyDescriptionMessageFromSelector(
        dependencyDescription.dependency,
        null
      )
    ).toBeNull();
  });

  it("returns null when dependency selector has no properties", () => {
    expect(
      dependencyDescriptionMessageFromSelector(
        dependencyDescription.dependency,
        {} as unknown as DependencyMatchResult["dependency"]
      )
    ).toBeNull();
  });

  it("returns null when selector properties do not exist in dependency metadata", () => {
    expect(
      dependencyDescriptionMessageFromSelector(
        dependencyDescription.dependency,
        {
          /* @ts-expect-error Testing branch with unsupported selector property */
          foo: "bar",
        }
      )
    ).toBeNull();
  });

  it("describes only selected relationship sides from dependency selector", () => {
    expect(
      dependencyDescriptionMessageFromSelector(
        dependencyDescription.dependency,
        {
          relationship: { from: "sibling" },
        }
      )
    ).toBe('relationship from "sibling"');
  });

  it("describes all relationship sides when relationship selector is not an object", () => {
    expect(
      dependencyDescriptionMessageFromSelector(
        dependencyDescription.dependency,
        {
          /* @ts-expect-error Testing fallback when relationship selector is not an object */
          relationship: true,
        }
      )
    ).toBe('relationship from "sibling" and relationship to "sibling"');
  });

  it("includes null dependency values when selector targets those properties", () => {
    expect(
      dependencyDescriptionMessageFromSelector(
        {
          ...dependencyDescription.dependency,
          module: null,
        },
        { module: "react" }
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

  it("handles no-rules message with only toDescription", () => {
    const onlyToDescription: DependencyDescription = {
      ...dependencyDescription,
      from: {
        ...dependencyDescription.from,
        type: null,
        category: null,
        captured: null,
      },
      dependency: {
        ...dependencyDescription.dependency,
        module: null,
        /* @ts-expect-error Testing branch with null source for message formatting */
        source: null,
      },
    };

    expect(
      dependenciesRuleDefaultErrorMessage(null, null, onlyToDescription)
    ).toContain("There is no rule allowing dependencies");
  });

  it("handles no-rules message with only dependency and origin", () => {
    const onlyDependencyAndOrigin: DependencyDescription = {
      ...dependencyDescription,
      from: {
        ...dependencyDescription.from,
        type: null,
        category: null,
        captured: null,
      },
      to: {
        ...dependencyDescription.to,
        type: null,
        category: null,
        captured: null,
      },
      dependency: {
        ...dependencyDescription.dependency,
        module: "external-pkg",
        /* @ts-expect-error Testing branch with null source for message formatting */
        source: null,
      },
    };

    expect(
      dependenciesRuleDefaultErrorMessage(null, null, onlyDependencyAndOrigin)
    ).toContain("with module");
  });

  it("handles no-rules message with only to and dependency", () => {
    const onlyToDependency: DependencyDescription = {
      ...dependencyDescription,
      from: {
        ...dependencyDescription.from,
        type: null,
        category: null,
        captured: null,
      },
      dependency: {
        ...dependencyDescription.dependency,
        module: "pkg",
      },
    } as unknown as DependencyDescription;

    expect(
      dependenciesRuleDefaultErrorMessage(null, null, onlyToDependency)
    ).toContain("to elements");
  });

  it("handles no-rules message with only from", () => {
    const onlyFrom: DependencyDescription = {
      ...dependencyDescription,
      to: {
        ...dependencyDescription.to,
        type: null,
        category: null,
        captured: null,
      },
      dependency: {
        ...dependencyDescription.dependency,
        module: null,
        source: null,
      },
    } as unknown as DependencyDescription;

    expect(dependenciesRuleDefaultErrorMessage(null, null, onlyFrom)).toContain(
      "from elements"
    );
  });

  it("handles no-rules message with only dependency", () => {
    const onlyDependency: DependencyDescription = {
      ...dependencyDescription,
      from: {
        ...dependencyDescription.from,
        type: null,
        category: null,
        captured: null,
      },
      to: {
        ...dependencyDescription.to,
        type: null,
        category: null,
        captured: null,
      },
      dependency: {
        ...dependencyDescription.dependency,
        module: null,
      },
    };

    expect(
      dependenciesRuleDefaultErrorMessage(null, null, onlyDependency)
    ).toContain("with");
  });

  it("returns error when no rules but no describable parts", () => {
    const noDescribableParts: DependencyDescription = {
      ...dependencyDescription,
      from: {
        ...dependencyDescription.from,
        type: null,
        category: null,
        captured: null,
      },
      to: {
        ...dependencyDescription.to,
        type: null,
        category: null,
        captured: null,
        origin: null,
      },
      dependency: {
        ...dependencyDescription.dependency,
        module: null,
        source: null,
      },
    } as unknown as DependencyDescription;

    expect(
      dependenciesRuleDefaultErrorMessage(null, null, noDescribableParts)
    ).toContain("Not able to create a message");
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

  it("builds message when only to selector is present", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: null,
      to: { type: "helper" },
      dependency: null,
    };

    expect(
      dependenciesRuleDefaultErrorMessage(matchResult, 2, dependencyDescription)
    ).toBe(
      'Dependencies to elements of type "helper" are not allowed. Denied by rule at index 2'
    );
  });

  it("builds message when dependency and to selectors are present", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: null,
      to: { type: "helper", internalPath: "fetcher.ts" },
      dependency: { kind: "type" },
    };

    expect(
      dependenciesRuleDefaultErrorMessage(matchResult, 3, dependencyDescription)
    ).toBe(
      'Dependencies with kind "type" to elements of type "helper" and internalPath "fetcher.ts" are not allowed. Denied by rule at index 3'
    );
  });

  it("builds message when dependency and from selectors are present", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: { type: "component" },
      to: null,
      dependency: { kind: "type" },
    };

    expect(
      dependenciesRuleDefaultErrorMessage(matchResult, 4, dependencyDescription)
    ).toBe(
      'Dependencies with kind "type" are not allowed in elements of type "component". Denied by rule at index 4'
    );
  });

  it("builds message when to and from selectors are present without dependency", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: { type: "component" },
      to: { type: "helper" },
      dependency: null,
    };

    expect(
      dependenciesRuleDefaultErrorMessage(matchResult, 5, dependencyDescription)
    ).toBe(
      'Dependencies to elements of type "helper" are not allowed in elements of type "component". Denied by rule at index 5'
    );
  });

  it("builds message with parent selector in from", () => {
    const dependencyWithParent = {
      ...dependencyDescription,
      from: {
        ...dependencyDescription.from,
        parents: [
          {
            elementPath: "src/shared",
            internalPath: "index.ts",
            type: "shared",
            category: null,
            captured: null,
            parents: [],
            origin: "local",
            isIgnored: false,
            isUnknown: false,
          },
        ],
      },
    };

    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: { type: "component", parent: { type: "shared" } },
      to: null,
      dependency: null,
    };

    expect(
      dependenciesRuleDefaultErrorMessage(matchResult, 6, dependencyWithParent)
    ).toContain("parent type");
  });

  it("builds message with wrong parent selector in from", () => {
    const dependencyWithParent = {
      ...dependencyDescription,
      from: {
        ...dependencyDescription.from,
        parents: [
          {
            elementPath: "src/shared",
            internalPath: "index.ts",
            type: "shared",
            category: null,
            captured: null,
            parents: [],
            origin: "local",
            isIgnored: false,
            isUnknown: false,
          },
        ],
      },
    };

    const matchResult: DependencyMatchResult = {
      isMatch: true,
      /* @ts-expect-error Testing branch with parent selector with wrong property */
      from: { type: "component", parent: { foo: "shared" } },
      to: null,
      dependency: null,
    };

    expect(
      dependenciesRuleDefaultErrorMessage(matchResult, 6, dependencyWithParent)
    ).not.toContain("parent type");
  });

  it("builds message with captured in selector", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: { type: "component", captured: { family: "atoms" } },
      to: null,
      dependency: null,
    };

    expect(
      dependenciesRuleDefaultErrorMessage(matchResult, 7, dependencyDescription)
    ).toContain("family");
  });

  it("builds message with relationship selector", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: null,
      to: null,
      dependency: { relationship: { from: "sibling" } },
    };

    expect(
      dependenciesRuleDefaultErrorMessage(matchResult, 8, dependencyDescription)
    ).toContain("relationship from");
  });

  it("builds message with parent selector that has no properties", () => {
    const dependencyWithParent = {
      ...dependencyDescription,
      from: {
        ...dependencyDescription.from,
        parents: [
          {
            elementPath: "src/shared",
            internalPath: "index.ts",
            type: null,
            category: null,
            captured: null,
            parents: [],
            origin: "local",
            isIgnored: false,
            isUnknown: false,
          },
        ],
      },
    };

    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: { parent: { type: "shared" } },
      to: null,
      dependency: null,
    };

    expect(
      dependenciesRuleDefaultErrorMessage(matchResult, 9, dependencyWithParent)
    ).toContain("Dependencies");
  });

  it("builds message with captured selector with multiple captured keys", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: {
        type: "component",
        captured: { family: "atoms", name: "button" },
      },
      to: null,
      dependency: null,
    };

    expect(
      dependenciesRuleDefaultErrorMessage(
        matchResult,
        10,
        dependencyDescription
      )
    ).toContain("family");
  });

  it("builds message with to selector that has captured properties", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: null,
      to: { type: "helper", captured: { domain: "api" } },
      dependency: null,
    };

    expect(
      dependenciesRuleDefaultErrorMessage(
        matchResult,
        11,
        dependencyDescription
      )
    ).toContain("domain");
  });

  it("includes null values in captured when selector requires it", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: {
        type: "component",
        captured: { family: null },
      },
      to: null,
      dependency: null,
    };

    const dependencyWithCapturedNull: DependencyDescription = {
      ...dependencyDescription,
      from: {
        ...dependencyDescription.from,
        captured: {
          family: null,
          elementName: "button",
        },
      },
    } as unknown as DependencyDescription;

    expect(
      dependenciesRuleDefaultErrorMessage(
        matchResult,
        12,
        dependencyWithCapturedNull
      )
    ).toContain("family");
  });

  it("handles relationship selector with both from and to", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: null,
      to: null,
      dependency: {
        relationship: { from: "sibling", to: "child" },
      },
    };

    expect(
      dependenciesRuleDefaultErrorMessage(
        matchResult,
        13,
        dependencyDescription
      )
    ).toContain("relationship");
  });

  it("handles from selector with undefined properties", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: { type: "component" },
      to: null,
      dependency: null,
    };

    expect(
      dependenciesRuleDefaultErrorMessage(
        matchResult,
        14,
        dependencyDescription
      )
    ).toContain("component");
  });

  it("handles empty captured object in selector", () => {
    const matchResult: DependencyMatchResult = {
      isMatch: true,
      from: { type: "component", captured: {} },
      to: null,
      dependency: null,
    };

    const emptyCapturedDependency: DependencyDescription = {
      ...dependencyDescription,
      from: {
        ...dependencyDescription.from,
        captured: {},
      },
    } as unknown as DependencyDescription;

    expect(
      dependenciesRuleDefaultErrorMessage(
        matchResult,
        15,
        emptyCapturedDependency
      )
    ).toContain("component");
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
